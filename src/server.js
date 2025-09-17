import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';

import initSentry from './sentry';
import { enhancedSSRErrorCapture } from './ssrErrorHandler';

export default function apply() {
  initSentry({ Sentry, SentryIntegrations });
  
  // Add global error handlers for uncaught exceptions and unhandled rejections
  if (process.env.RAZZLE_SENTRY_DSN || (typeof __SENTRY__ !== 'undefined' && __SENTRY__.SENTRY_DSN)) {
    // Enhanced console.error capturing for SSR errors
    enhancedSSRErrorCapture();
    
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      Sentry.captureException(error);
      // Don't exit the process immediately, let Sentry flush
      setTimeout(() => process.exit(1), 2000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      Sentry.captureException(reason instanceof Error ? reason : new Error(reason));
    });
  }
}
