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

CREATE=1
if [[ ! "$PARAM" = '--force' ]]; then
  if ./node_modules/.bin/sentry-cli releases info "$SENTRY_RELEASE" 2>/dev/null | grep -q "$SENTRY_RELEASE"; then
    CREATE=0
  fi
fi

if [ "$CREATE" = 1 ]; then
  echo "Creating Sentry release: $SENTRY_RELEASE"
  ./node_modules/.bin/sentry-cli releases new "$SENTRY_RELEASE"

  echo "Uploading source maps (JS chunks)..."
  ./node_modules/.bin/sentry-cli releases files "$SENTRY_RELEASE" upload ./build/public/static/js \
    --url-prefix "~/static/js" \
    --ext .js

  echo "Uploading source maps (.map files)..."
  ./node_modules/.bin/sentry-cli releases files "$SENTRY_RELEASE" upload ./build/public/static/js \
    --url-prefix "~/static/js" \
    --ext .map

  echo "Finalizing Sentry release: $SENTRY_RELEASE"
  ./node_modules/.bin/sentry-cli releases finalize "$SENTRY_RELEASE"

  echo "Sentry release $SENTRY_RELEASE created and source maps uploaded."
else
  echo "Release $SENTRY_RELEASE already exists. Use --force to re-upload source maps."
fi

exit 0
