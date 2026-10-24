class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details = null) {
    super(400, message, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized access', details = null) {
    super(401, message, details);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden access', details = null) {
    super(403, message, details);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', details = null) {
    super(404, message, details);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details = null) {
    super(409, message, details);
  }
}

class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests. Please try again later.', details = null) {
    super(429, message, details);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
};
