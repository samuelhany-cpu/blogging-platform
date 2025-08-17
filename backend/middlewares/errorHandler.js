// 🛡️ Enhanced Error Handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log error for monitoring (don't log in tests)
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error Details:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication failed';
    code = 'AUTH_ERROR';
  } else if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Invalid CSRF token';
    code = 'CSRF_ERROR';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
    code = 'FILE_SIZE_ERROR';
  } else if (err.message?.includes('CORS policy violation')) {
    statusCode = 403;
    message = 'CORS policy violation';
    code = 'CORS_ERROR';
  }

  // Security: Don't expose sensitive error details in production
  const response = {
    error: message,
    code: code,
    timestamp: new Date().toISOString()
  };

  // Add additional details only in development
  if (process.env.NODE_ENV === 'development') {
    response.details = err.stack;
    response.path = req.originalUrl;
  }

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
