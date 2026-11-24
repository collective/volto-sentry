#!/usr/bin/env bash
# Upload the source maps of a release to Sentry. Never fails the caller: a Sentry
# that is missing, unreachable or slow is a warning, because the frontend must
# start without it.
PARAM=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SENTRY_TIMEOUT="${SENTRY_TIMEOUT:-8}"

skip() {
  echo "Sentry: $1. Skipping source map upload."
  exit 0
}

for var in SENTRY_AUTH_TOKEN SENTRY_URL SENTRY_ORG SENTRY_PROJECT SENTRY_RELEASE; do
  [ -n "${!var:-}" ] || skip "$var is not set"
done

node "$SCRIPT_DIR/sentry-reachable.mjs" "$SENTRY_URL" "$SENTRY_TIMEOUT" \
  || skip "no answer from $SENTRY_URL within ${SENTRY_TIMEOUT}s"

export SENTRY_HTTP_MAX_RETRIES="${SENTRY_HTTP_MAX_RETRIES:-1}"

# The build lands in ./build in a Volto 18 project and in the core checkout of a
# Volto 19 pnpm workspace; SENTRY_SOURCEMAPS_DIR overrides both.
if [ -n "${SENTRY_SOURCEMAPS_DIR:-}" ]; then
  SOURCEMAPS_DIR="$SENTRY_SOURCEMAPS_DIR"
else
  for dir in ./build/public/static/js ./core/packages/volto/build/public/static/js; do
    if [ -d "$dir" ]; then
      SOURCEMAPS_DIR="$dir"
      break
    fi
  done
fi
# Checked before the release is created: an empty release would be reported as
# existing by every later run, which would then never upload its source maps.
[ -d "${SOURCEMAPS_DIR:-}" ] \
  || skip "no build found in ${SENTRY_SOURCEMAPS_DIR:-./build/public/static/js or ./core/packages/volto/build/public/static/js}"

CREATE=1
if [[ ! "$PARAM" = '--force' ]]; then
  if ./node_modules/.bin/sentry-cli releases info "$SENTRY_RELEASE" 2>/dev/null | grep -q "$SENTRY_RELEASE"; then
    CREATE=0
  fi
fi

if [ "$CREATE" = 1 ]; then
  FAILED=""

  echo "Creating Sentry release: $SENTRY_RELEASE"
  ./node_modules/.bin/sentry-cli releases new "$SENTRY_RELEASE" || FAILED="releases new"

  for ext in .js .map; do
    [ -z "$FAILED" ] || break
    echo "Uploading source maps from $SOURCEMAPS_DIR ($ext files)..."
    ./node_modules/.bin/sentry-cli releases files "$SENTRY_RELEASE" upload "$SOURCEMAPS_DIR" \
      --url-prefix "~/static/js" \
      --ext "$ext" || FAILED="upload $ext"
  done

  if [ -n "$FAILED" ]; then
    # Drop the incomplete release so that the next run uploads it again instead
    # of finding it and skipping. A release without events can be deleted.
    echo "WARN: Sentry $FAILED failed for $SENTRY_RELEASE. Removing the incomplete release."
    ./node_modules/.bin/sentry-cli releases delete "$SENTRY_RELEASE" \
      || echo "WARN: could not remove $SENTRY_RELEASE. Run this script with --force to upload its source maps."
    exit 0
  fi

  echo "Finalizing Sentry release: $SENTRY_RELEASE"
  if ./node_modules/.bin/sentry-cli releases finalize "$SENTRY_RELEASE"; then
    echo "Sentry release $SENTRY_RELEASE created and source maps uploaded."
  else
    echo "WARN: source maps uploaded, but finalizing $SENTRY_RELEASE failed."
  fi
else
  echo "Release $SENTRY_RELEASE already exists. Use --force to re-upload source maps."
fi

exit 0
