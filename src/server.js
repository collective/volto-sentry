import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';

import initSentry from './sentry';

export default function apply() {
  initSentry({ Sentry, SentryIntegrations });
}

export const captureSSRException = (error, context = {}) => {
  if (process.env.RAZZLE_SENTRY_DSN || (typeof __SENTRY__ !== 'undefined' && __SENTRY__.SENTRY_DSN)) {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', 'SSR');
      scope.setContext('SSR Context', context);
      if (context.url) {
        scope.setTag('url', context.url);
      }
      if (context.statusCode) {
        scope.setTag('statusCode', context.statusCode.toString());
      }
      Sentry.captureException(error);
    });
  }
  return error;
};
