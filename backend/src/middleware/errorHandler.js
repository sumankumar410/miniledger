const { Prisma } = require('@prisma/client');
const { ApiError } = require('../utils/errors');
const { env } = require('../config/env');

const errorHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = 'An unexpected internal server error occurred';
  let details = undefined;

  // Custom ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // JSON parse error (e.g. malformed JSON payload)
  else if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    statusCode = 400;
    message = 'Malformed JSON body in request';
  }
  // Prisma Known Request Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = err.meta?.target || [];
        message = `A record with this ${Array.isArray(target) ? target.join(', ') : 'field'} already exists`;
        break;
      }
      case 'P2025':
        statusCode = 404;
        message = 'Requested record was not found';
        break;
      default:
        statusCode = 400;
        message = `Database operation error (${err.code})`;
        break;
    }
  }
  // Prisma Validation Error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database validation error. Check input format.';
  }

  // Log non-4xx errors or if in development
  if (statusCode >= 500 || env.NODE_ENV === 'development') {
    console.error(`[Error ${statusCode}] ${err.message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
