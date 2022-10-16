import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';

import initSentry from './sentry';

export default function apply() {
  initSentry({ Sentry, SentryIntegrations });
}
