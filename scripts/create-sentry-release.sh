#!/usr/bin/env bash
PARAM=$1
if [ -z "$PARAM" ]; then
  PARAM='not forced'
fi
if [ ! -z "$SENTRY_AUTH_TOKEN" ] && [ ! -z "$SENTRY_URL" ] && [ ! -z "$SENTRY_ORG" ] && [ ! -z "$SENTRY_PROJECT" ] && [ ! -z "$SENTRY_RELEASE" ]; then
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
else
  echo "SENTRY is not configured. Skipping source map upload."
  echo "Required env vars: SENTRY_AUTH_TOKEN, SENTRY_URL, SENTRY_ORG, SENTRY_PROJECT, SENTRY_RELEASE"
fi
