import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';

import initSentry from './sentry';
import { addTestSSRErrorRoutes } from './testSSRError';

export default function apply() {
  console.log('🐛 [SENTRY DEBUG] server.js apply() called');
  console.log('🐛 [SENTRY DEBUG] RAZZLE_SENTRY_DSN:', !!process.env.RAZZLE_SENTRY_DSN);
  console.log('🐛 [SENTRY DEBUG] __SENTRY__:', typeof __SENTRY__ !== 'undefined' ? !!__SENTRY__?.SENTRY_DSN : 'undefined');
  
  initSentry({ Sentry, SentryIntegrations });

  // Enhanced error handling for SSR
  if (process.env.RAZZLE_SENTRY_DSN || __SENTRY__?.SENTRY_DSN) {
    console.log('🐛 [SENTRY DEBUG] Setting up SSR error handlers');
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

    // Add a safe console error capture without overriding console.error globally
    const captureConsoleError = (...args) => {
      const errorMessage = args.join(' ');
      console.log('🐛 [SENTRY DEBUG] captureConsoleError called with:', errorMessage.substring(0, 200));
      
      const isSSRError = 
        errorMessage.includes('Error: Service Unavailable') ||
        errorMessage.includes('Error: Not Found') ||
        errorMessage.includes('TypeError: Cannot read properties') ||
        errorMessage.includes('Error: connect EHOSTUNREACH') ||
        errorMessage.includes('This error originated either by throwing inside of an async function') ||
        errorMessage.includes('superagent') ||
        errorMessage.includes('Service Unavailable');

      console.log('🐛 [SENTRY DEBUG] isSSRError:', isSSRError);

      if (isSSRError) {
        console.log('🐛 [SENTRY DEBUG] SENDING SSR ERROR TO SENTRY:', errorMessage.substring(0, 100));
        Sentry.withScope((scope) => {
          scope.setTag('errorType', 'ssrConsoleError');
          scope.setLevel('error');
          scope.setContext('ssrErrorDetails', {
            originalArgs: args,
            timestamp: new Date().toISOString(),
          });

          // Try to extract error object if available
          const errorObj = args.find(arg => arg instanceof Error);
          if (errorObj) {
            console.log('🐛 [SENTRY DEBUG] Sending ERROR OBJECT to Sentry:', errorObj.message);
            Sentry.captureException(errorObj);
          } else {
            console.log('🐛 [SENTRY DEBUG] Sending ERROR MESSAGE to Sentry:', errorMessage.substring(0, 100));
            Sentry.captureMessage(`SSR Console Error: ${errorMessage}`, 'error');
          }
        });
      }
    };

    // Store the capture function globally so it can be used elsewhere if needed
    global.__sentrySSRErrorCapture = captureConsoleError;
    
    // Override console.error to capture SSR errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Call original console.error first
      originalConsoleError.apply(console, args);
      // Then try to capture for Sentry
      captureConsoleError(...args);
    };
    
    console.log('🐛 [SENTRY DEBUG] SSR error handlers set up successfully + console.error overridden');
  } else {
    console.log('🐛 [SENTRY DEBUG] No Sentry DSN found, SSR error handlers NOT set up');
  }
}
