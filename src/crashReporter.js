import loadable from '@loadable/component';

const SentryBrowser = loadable.lib(() =>
  import(/* webpackChunkName: "s_entry-browser" */ '@sentry/browser'),
);

let SentryNode = undefined;
if (__SERVER__) {
  SentryNode = loadable.lib(() =>
    import(/* webpackChunkName: "s_entry-node" */ '@sentry/node'),
  );
}

const crashReporter = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (error) {
    console.log("Caught error", error);
    if (
      __SENTRY__?.SENTRY_DSN ||
      process?.env?.RAZZLE_SENTRY_DSN ||
      window?.env?.RAZZLE_SENTRY_DSN
    ) {
      const loader = __CLIENT__ ? SentryBrowser : SentryNode;
      loader.load().then((Sentry) => {
        Sentry.withScope((scope) => {
          scope.setExtras({
            action,
            state: store.getState(),
          });
          Sentry.captureException(error);
        });
      });
    }
    throw error;
  }
};

export default crashReporter;
