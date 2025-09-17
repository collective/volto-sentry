import loadable from '@loadable/component';

const SentryBrowser = loadable.lib(() =>
  import(/* webpackChunkName: "s_entry-browser" */ '@sentry/browser'),
);

// Only load @sentry/node on the server side
const SentryNode = __SERVER__ ? loadable.lib(() =>
  import(/* webpackChunkName: "s_entry-node" */ '@sentry/node'),
) : null;

const crashReporter = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (error) {
    if (
      __SENTRY__?.SENTRY_DSN ||
      process?.env?.RAZZLE_SENTRY_DSN ||
      window?.env?.RAZZLE_SENTRY_DSN
    ) {
      const loader = __CLIENT__ ? SentryBrowser : SentryNode;
      if (loader) {
        loader.load().then((Sentry) => {
        Sentry.withScope((scope) => {
          scope.setTag('errorType', __CLIENT__ ? 'reduxActionClient' : 'reduxActionServer');
          scope.setLevel('error');
          scope.setExtras({
            action,
            state: store.getState(),
            isSSR: __SERVER__,
            timestamp: new Date().toISOString(),
          });
          
          // Add more context for SSR errors
          if (__SERVER__) {
            scope.setTag('environment', 'server');
            scope.setContext('serverInfo', {
              nodeVersion: process.version,
              platform: process.platform,
              memoryUsage: process.memoryUsage(),
            });
          }
          
          Sentry.captureException(error);
        });
        });
      }
    }
    throw error;
  }
};

export default crashReporter;
