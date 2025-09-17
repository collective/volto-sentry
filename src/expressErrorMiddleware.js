import * as Sentry from '@sentry/node';

export const sentryExpressErrorMiddleware = (err, req, res, next) => {
  // Capture the error in Sentry before passing it to the default error handler
  if (process.env.RAZZLE_SENTRY_DSN || (typeof __SENTRY__ !== 'undefined' && __SENTRY__.SENTRY_DSN)) {
    // Add request context to the error
    Sentry.withScope((scope) => {
      scope.setTag('error_source', 'express_middleware');
      scope.setContext('request', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        user_agent: req.headers['user-agent'],
      });
      
      // Capture the error
      Sentry.captureException(err);
    });
  }
  
  // Pass the error to the next middleware (Volto's default error handler)
  next(err);
};