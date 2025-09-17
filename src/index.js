import loadable from '@loadable/component';
import initSentry from './sentry';
import crashReporter from './crashReporter';
import { sentryExpressErrorMiddleware } from './expressErrorMiddleware';

const sentryLibraries = {
  Sentry: loadable.lib(() =>
    import(/* webpackChunkName: "s_entry-browser" */ '@sentry/browser'),
  ),
  SentryIntegrations: loadable.lib(() => import('@sentry/integrations')),
};

const loadSentry = () => {
  const loaders = Object.entries(sentryLibraries).map(
    ([name, Lib]) =>
      new Promise((resolve) => Lib.load().then((mod) => resolve([name, mod]))),
  );
  Promise.all(loaders).then((libs) => {
    const libraries = Object.assign(
      {},
      ...libs.map(([name, lib]) => ({ [name]: lib })),
    );
    initSentry(libraries);
  });
};

const Sentry = loadable.lib(
  () => import(/* webpackChunkName: "s_entry-browser" */ '@sentry/browser'), // chunk name avoids ad blockers
);

const applyConfig = (config) => {
  const errorHandler = (error) =>
    Sentry.load().then((mod) => mod.captureException(error));

  if (__CLIENT__ && window?.env?.RAZZLE_SENTRY_DSN) {
    config.settings.errorHandlers.push(errorHandler);
  }
  config.settings.sentryOptions = (libraries) => {
    const { CaptureConsole } = libraries['SentryIntegrations'];
    return {
      // dsn: 'https://key@sentry.io/1',
      // environment: 'production',
      // release: '1.2.3',
      // serverName: 'volto',
      // tags: {
      //   site: 'foo.bar',
      //   app: 'test_app',
      //   logger: 'volto',
      // },
      // extras: {
      //   key: 'value',
      // },
      // integrations: [
      //   new CaptureConsole({
      //     levels: ['error'],
      //   }),
      // ],
    };
  };
  config.settings.storeExtenders = [
    ...(config.settings.storeExtenders || []),
    (stack) => [crashReporter, ...stack],
  ];

  // Add Sentry Express error middleware
  if (__SERVER__ && (process.env.RAZZLE_SENTRY_DSN || (typeof __SENTRY__ !== 'undefined' && __SENTRY__.SENTRY_DSN))) {
    config.settings.expressMiddleware = [
      ...(config.settings.expressMiddleware || []),
      sentryExpressErrorMiddleware,
    ];
  }

  if (__SERVER__) {
    const apply = require('./server').default;
    apply();
  }

  if (__CLIENT__ && window?.env?.RAZZLE_SENTRY_DSN) {
    loadSentry();
  }

  // check if we have __SENTRY__ otherwise we break storybook
  if (typeof __SENTRY__ !== 'undefined' && __SENTRY__.SENTRY_DSN) {
    loadSentry();
  }

  return config;
};

export default applyConfig;
