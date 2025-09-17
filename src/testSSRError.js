// Test utility to trigger SSR errors for Sentry testing
import { captureSSRError } from './ssrErrorHandler';

/**
 * Utility function to test SSR error capturing
 * This can be called from server-side code to test Sentry integration
 */
export const triggerTestSSRError = (errorType = 'test') => {
  if (__SERVER__) {
    switch (errorType) {
      case 'exception':
        throw new Error('Test SSR Exception for Sentry - this is intentional for testing');
      
      case 'rejection':
        Promise.reject(new Error('Test SSR Promise Rejection for Sentry - this is intentional for testing'));
        break;
      
      case 'console':
        console.error('Error: Service Unavailable - Test SSR Console Error for Sentry');
        break;
      
      case 'manual':
        captureSSRError(
          new Error('Manual SSR Error Test for Sentry - this is intentional for testing'),
          {
            testContext: 'Manual error trigger',
            timestamp: new Date().toISOString(),
            source: 'testSSRError.js'
          }
        );
        break;
      
      default:
        console.error('TypeError: Cannot read properties of undefined (reading \'test\') - SSR Test Error for Sentry');
    }
  }
};

/**
 * Middleware to add test error endpoints for development
 */
export const addTestSSRErrorRoutes = (app) => {
  if (__SERVER__ && process.env.NODE_ENV === 'development') {
    // Test endpoint to trigger different types of SSR errors
    app.get('/test-ssr-error/:type?', (req, res) => {
      const errorType = req.params.type || 'default';
      
      try {
        triggerTestSSRError(errorType);
        res.json({ 
          message: `SSR error test triggered: ${errorType}`,
          note: 'Check Sentry for the captured error'
        });
      } catch (error) {
        res.status(500).json({ 
          message: 'SSR error test completed with exception',
          error: error.message,
          note: 'Check Sentry for the captured error'
        });
      }
    });
    
    console.log('🧪 Test SSR Error routes added:');
    console.log('  GET /test-ssr-error/exception - Throws an exception');
    console.log('  GET /test-ssr-error/rejection - Creates promise rejection');
    console.log('  GET /test-ssr-error/console - Logs console error');
    console.log('  GET /test-ssr-error/manual - Manual error capture');
    console.log('  GET /test-ssr-error - Default console error');
  }
};