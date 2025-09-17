// Only import Sentry on server side to avoid webpack issues
let Sentry = null;
if (__SERVER__) {
  Sentry = require('@sentry/node');
}

/**
 * Wrapper function to capture SSR errors and send them to Sentry
 * @param {Function} fn - The function to wrap
 * @param {Object} options - Additional options for error handling
 * @returns {Function} - Wrapped function
 */
export const withSentrySSRErrorHandling = (fn, options = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Only capture if Sentry is configured and available
      if (Sentry && (process.env.RAZZLE_SENTRY_DSN || (typeof __SENTRY__ !== 'undefined' && __SENTRY__?.SENTRY_DSN))) {
        Sentry.withScope((scope) => {
          scope.setTag('errorType', 'ssrError');
          scope.setTag('source', options.source || 'unknown');
          scope.setLevel('error');
          
          // Add additional context if provided
          if (options.context) {
            scope.setContext('additionalContext', options.context);
          }
          
          // Add function name if available
          if (fn.name) {
            scope.setTag('functionName', fn.name);
          }
          
          // Capture the error
          Sentry.captureException(error);
        });
      }
      
      // Re-throw the error to maintain original behavior
      throw error;
    }
  };
};

/**
 * Express middleware to capture SSR errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const sentrySSRErrorMiddleware = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.send to capture 5xx errors
  res.send = function(body) {
    if (Sentry && res.statusCode >= 500 && (process.env.RAZZLE_SENTRY_DSN || (typeof __SENTRY__ !== 'undefined' && __SENTRY__?.SENTRY_DSN))) {
      Sentry.withScope((scope) => {
        scope.setTag('errorType', 'ssrHttpError');
        scope.setLevel('error');
        scope.setContext('httpError', {
          statusCode: res.statusCode,
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          body: typeof body === 'string' ? body.substring(0, 1000) : String(body).substring(0, 1000), // Limit body size
        });
        
        Sentry.captureMessage(`SSR HTTP Error ${res.statusCode}: ${req.url}`, 'error');
      });
    }
    
    return originalSend.call(this, body);
  };
  
  // Override res.json to capture 5xx errors
  res.json = function(obj) {
    if (Sentry && res.statusCode >= 500 && (process.env.RAZZLE_SENTRY_DSN || (typeof __SENTRY__ !== 'undefined' && __SENTRY__?.SENTRY_DSN))) {
      Sentry.withScope((scope) => {
        scope.setTag('errorType', 'ssrHttpError');
        scope.setLevel('error');
        scope.setContext('httpError', {
          statusCode: res.statusCode,
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          response: obj,
        });
        
        Sentry.captureMessage(`SSR HTTP Error ${res.statusCode}: ${req.url}`, 'error');
      });
    }
    
    return originalJson.call(this, obj);
  };
  
  next();
};

/**
 * Utility function to manually capture SSR errors
 * @param {Error|string} error - Error to capture
 * @param {Object} context - Additional context
 */
export const captureSSRError = (error, context = {}) => {
  if (Sentry && (process.env.RAZZLE_SENTRY_DSN || (typeof __SENTRY__ !== 'undefined' && __SENTRY__?.SENTRY_DSN))) {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', 'ssrError');
      scope.setLevel('error');
      
      if (context) {
        scope.setContext('customContext', context);
      }
      
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(String(error), 'error');
      }
    });
  }
};