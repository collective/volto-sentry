import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';

import initSentry from './sentry';

export default function apply() {
  initSentry({ Sentry, SentryIntegrations });

  // Enhanced error handling for SSR
  if (process.env.RAZZLE_SENTRY_DSN || __SENTRY__?.SENTRY_DSN) {
    // Capture unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      Sentry.withScope((scope) => {
        scope.setTag('errorType', 'unhandledRejection');
        scope.setLevel('error');
        scope.setContext('promise', {
          promise: promise.toString(),
        });
        if (reason instanceof Error) {
          Sentry.captureException(reason);
        } else {
          Sentry.captureMessage(`Unhandled Rejection: ${String(reason)}`, 'error');
        }
      });
    });

    // Capture uncaught exceptions
    process.on('uncaughtException', (error) => {
      Sentry.withScope((scope) => {
        scope.setTag('errorType', 'uncaughtException');
        scope.setLevel('fatal');
        Sentry.captureException(error);
      });
    });

    // Capture SSR console errors
    const captureConsoleError = (...args) => {
      const errorMessage = args.join(' ');
      
      const isSSRError = 
        errorMessage.includes('Error: Service Unavailable') ||
        errorMessage.includes('Error: Not Found') ||
        errorMessage.includes('TypeError: Cannot read properties') ||
        errorMessage.includes('Error: connect EHOSTUNREACH') ||
        errorMessage.includes('This error originated either by throwing inside of an async function') ||
        errorMessage.includes('superagent') ||
        errorMessage.includes('Service Unavailable') ||
        errorMessage.includes('thrown during server-side render');

      if (isSSRError) {
        Sentry.withScope((scope) => {
          scope.setTag('errorType', 'ssrConsoleError');
          scope.setLevel('error');
          scope.setContext('ssrErrorDetails', {
            originalArgs: args,
            timestamp: new Date().toISOString(),
          });

          const errorObj = args.find(arg => arg instanceof Error);
          if (errorObj) {
            Sentry.captureException(errorObj);
          } else {
            Sentry.captureMessage(`SSR Console Error: ${errorMessage}`, 'error');
          }
        });
      }
    };

    // Override console.error to capture SSR errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      originalConsoleError.apply(console, args);
      captureConsoleError(...args);
    };
  }
}
