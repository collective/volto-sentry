const webpack = require('webpack');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

const SENTRY_KEYS = [
  'SENTRY_AUTH_TOKEN',
  'SENTRY_URL',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'SENTRY_RELEASE',
];

function validateSentryCliConfiguration(env) {
  return SENTRY_KEYS.findIndex((k) => env[k] === undefined) === -1;
}

module.exports = {
  modifyWebpackConfig({
    env: { target, dev },
    webpackConfig: config,
    webpackObject,
    options: { pluginOptions, razzleOptions, webpackOptions },
    paths,
  }) {
    if (
      process.env.SENTRY_AUTH_TOKEN &&
      process.env.SENTRY_URL &&
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT &&
      process.env.SENTRY_RELEASE
    )
      config.plugins.push(
        new SentryWebpackPlugin({
          url: process.env.SENTRY_URL,
          release: process.env.SENTRY_RELEASE,
          include: './build/public/static/js',
          urlPrefix: '~/static/js',
          ignore: ['node_modules'],
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
      );
    let SENTRY = undefined;

    if (process.env.SENTRY_DSN) {
      SENTRY = {
        SENTRY_DSN: process.env.SENTRY_DSN,
      };
    }

    if (target === 'web') {
      if (SENTRY && process.env.SENTRY_FRONTEND_CONFIG) {
        if (validateSentryCliConfiguration(process.env)) {
          config.plugins.push(
            new SentryCliPlugin({
              include: './build/public',
              ignore: ['node_modules', 'webpack.config.js'],
              release: process.env.SENTRY_RELEASE,
            }),
          );
        }
        try {
          SENTRY.SENTRY_CONFIG = JSON.parse(process.env.SENTRY_FRONTEND_CONFIG);
          if (process.env.SENTRY_RELEASE !== undefined) {
            SENTRY.SENTRY_CONFIG.release = process.env.SENTRY_RELEASE;
          }
        } catch (e) {
          console.log('Error parsing SENTRY_FRONTEND_CONFIG');
          throw e;
        }
      }
    }

    if (target === 'node') {
      if (SENTRY) {
        SENTRY.SENTRY_CONFIG = undefined;
        if (process.env.SENTRY_BACKEND_CONFIG) {
          try {
            SENTRY.SENTRY_CONFIG = JSON.parse(
              process.env.SENTRY_BACKEND_CONFIG,
            );
            if (process.env.SENTRY_RELEASE !== undefined) {
              SENTRY.SENTRY_CONFIG.release = process.env.SENTRY_RELEASE;
            }
          } catch (e) {
            console.log('Error parsing SENTRY_BACKEND_CONFIG');
            throw e;
          }
        }
      }
    }
    config.plugins.unshift(
      new webpack.DefinePlugin({
        __SENTRY__: SENTRY ? JSON.stringify(SENTRY) : undefined,
      }),
    );

    return config;
  },
};
