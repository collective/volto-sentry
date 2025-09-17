import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';

import initSentry from './sentry';
import { addTestSSRErrorRoutes } from './testSSRError';

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

    // Add a safe console error capture without overriding console.error globally
    const captureConsoleError = (...args) => {
      const errorMessage = args.join(' ');
      const isSSRError = 
        errorMessage.includes('Error: Service Unavailable') ||
        errorMessage.includes('Error: Not Found') ||
        errorMessage.includes('TypeError: Cannot read properties') ||
        errorMessage.includes('Error: connect EHOSTUNREACH') ||
        errorMessage.includes('This error originated either by throwing inside of an async function') ||
        errorMessage.includes('superagent') ||
        errorMessage.includes('Service Unavailable');

      if (isSSRError) {
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
            Sentry.captureException(errorObj);
          } else {
            Sentry.captureMessage(`SSR Console Error: ${errorMessage}`, 'error');
          }
        });
      }
    };

    // Store the capture function globally so it can be used elsewhere if needed
    global.__sentrySSRErrorCapture = captureConsoleError;

    // Send a test SSR error to Sentry on server startup (development only)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        Sentry.withScope((scope) => {
          scope.setTag('errorType', 'ssrTestError');
          scope.setLevel('info');
          scope.setContext('testInfo', {
            message: 'This is a test SSR error to verify Sentry integration',
            timestamp: new Date().toISOString(),
            source: 'volto-sentry startup test',
            environment: process.env.NODE_ENV,
            nodeVersion: process.version,
          });
          
          Sentry.captureMessage('Volto SSR Error Handling Test - Sentry integration is working! 🎉', 'info');
        });
        
        console.log('📡 Test SSR error sent to Sentry - check your Sentry dashboard');
      }, 2000); // Wait 2 seconds after startup

      // Also simulate the actual errors from the logs after 5 seconds
      setTimeout(() => {
        // Simulate the "Service Unavailable" error from the logs
        console.error('Error: Service Unavailable');
        console.error('    at Request.callback (/app/node_modules/superagent/lib/node/index.js:696:15)');
        
        // Simulate the "Cannot read properties" error
        console.error('TypeError: Cannot read properties of undefined (reading \'split\')');
        console.error('    at /app/build/server.js:1:3722480');
        
        console.log('📡 Simulated actual SSR errors from logs - these should also appear in Sentry');
      }, 5000); // Wait 5 seconds after startup
    }
  }
}
