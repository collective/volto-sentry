import loadable from '@loadable/component';

const Sentry = loadable.lib(() =>
  import(/* webpackChunkName: "s_entry-browser" */ '@sentry/browser'),
);
