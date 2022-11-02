#!/usr/bin/env node
const { exec } = require('node:child_process');
let PARAM = process.argv[2];
if (!PARAM) PARAM = 'not forced';

let CREATE;

if (
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_URL &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT &&
  process.env.SENTRY_RELEASE
) {
  CREATE = true;

  if (PARAM !== '--force') {
    exec(
      `./node_modules/@sentry/cli/sentry-cli releases info ${process.env.SENTRY_RELEASE} | grep -q ${process.env.SENTRY_RELEASE}`,
      (err, output) => {
        if (err) {
          // log and return if we encounter an error
          return;
        }
        if (output) {
          CREATE = false;
        }
      },
    );
  }
  if (CREATE === true) {
    exec(
      ` ./node_modules/@sentry/cli/sentry-cli releases new ${process.env.SENTRY_RELEASE}`,
      (err, output) => {
        if (err) {
          console.log(err);
          // log and return if we encounter an error
          return;
        }
        console.log(output);
      },
    );
    exec(
      `./node_modules/@sentry/cli/sentry-cli releases files ${process.env.SENTRY_RELEASE} upload ./build/public/static/ --url-prefix "~/static"`,
      (err, output) => {
        if (err) {
          console.log(err);
          // log and return if we encounter an error
          return;
        }
      },
    );
    exec(
      ` ./node_modules/@sentry/cli/sentry-cli releases finalize ${process.env.SENTRY_RELEASE}`,
      (err, output) => {
        if (err) {
          console.log(err);
          // log and return if we encounter an error
          return;
        }
      },
    );
  } else {
    console.log(`Release ${process.env.SENTRY_RELEASE} already exists`);
    console.log('Use --force if you still want to upload the source maps');
  }
} else console.log('SENTRY is not configured');
