import * as Sentry from '@sentry/node';

export const enhancedSSRErrorCapture = () => {
  if (!process.env.RAZZLE_SENTRY_DSN && !(typeof __SENTRY__ !== 'undefined' && __SENTRY__.SENTRY_DSN)) {
    return;
  }

  // Override the original console.error to capture specific SSR errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Call the original console.error first
    originalConsoleError.apply(console, args);
    
    // Check if this looks like a structured SSR error
    if (args.length > 0) {
      const firstArg = args[0];
      
      // Capture if it's an Error object
      if (firstArg instanceof Error) {
        Sentry.withScope((scope) => {
          scope.setTag('error_source', 'ssr_console_error');
          scope.setTag('error_type', firstArg.constructor.name);
          
          // Add additional context from other arguments
          if (args.length > 1) {
            scope.setContext('additional_data', {
              arguments: args.slice(1).map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              )
            });
          }
          
          Sentry.captureException(firstArg);
        });
      }
      // Capture structured error objects even if not Error instances
      else if (typeof firstArg === 'object' && firstArg !== null) {
        // Check if it looks like an error object with status, message, etc.
        if (firstArg.status || firstArg.message || firstArg.stack) {
          const error = new Error(firstArg.message || 'SSR Error');
          error.status = firstArg.status;
          error.originalError = firstArg;
          
          Sentry.withScope((scope) => {
            scope.setTag('error_source', 'ssr_object_error');
            scope.setContext('original_error', firstArg);
            Sentry.captureException(error);
          });
        }
      }
      // Capture string errors that contain error patterns
      else if (typeof firstArg === 'string') {
        const errorPatterns = [
          /TypeError:/,
          /ReferenceError:/,
          /SyntaxError:/,
          /cannot read properties/i,
          /cannot GET/i,
          /service unavailable/i,
          /This error originated either by throwing inside of an async function/,
        ];
        
        if (errorPatterns.some(pattern => pattern.test(firstArg))) {
          const error = new Error(firstArg);
          
          Sentry.withScope((scope) => {
            scope.setTag('error_source', 'ssr_string_error');
            scope.setContext('console_args', args);
            Sentry.captureException(error);
          });
        }
      }
    }
  };
};