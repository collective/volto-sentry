import loadable from '@loadable/component';
import initSentry from './sentry';
import { sentryOptions } from './sentry-config';
import crashReporter from './crashReporter';

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

if ((__CLIENT__ && window?.env?.RAZZLE_SENTRY_DSN) || __SENTRY__?.SENTRY_DSN)
  loadSentry();

if (__SERVER__) {
  const apply = require('./server').default;
  apply();
}

const Sentry = loadable.lib(
  () => import(/* webpackChunkName: "s_entry-browser" */ '@sentry/browser'), // chunk name avoids ad blockers
);

const applyConfig = (config) => {
  const errorHandler = (error) =>
    Sentry.load().then((mod) => mod.captureException(error));

  if (__CLIENT__ && window?.env?.RAZZLE_SENTRY_DSN) {
    config.settings.errorHandlers.push(errorHandler);
  }
  config.settings.sentryOptions = sentryOptions;
  config.settings.storeExtenders = (stack) => [crashReporter, ...stack];

  return config;
};

export default applyConfig;
