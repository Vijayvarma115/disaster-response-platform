const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error in ${req.method} ${req.path}:`, err);

  // Default error
  let error = {
    message: 'Internal Server Error',
    status: 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.message = 'Validation Error';
    error.status = 400;
    error.details = err.message;
  } else if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    error.status = 400;
  } else if (err.code === 11000) {
    error.message = 'Duplicate field value';
    error.status = 400;
  } else if (err.message) {
    error.message = err.message;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    delete error.details;
  }

  res.status(error.status).json({
    error: error.message,
    ...(error.details && { details: error.details }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

module.exports = errorHandler;

