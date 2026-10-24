const sendSuccess = (res, data, message, statusCode = 200, pagination = null) => {
  const payload = {
    success: true,
  };

  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;
  if (pagination) payload.pagination = pagination;

  return res.status(statusCode).json(payload);
};

const sendError = (
  res,
  message = 'An unexpected error occurred',
  statusCode = 500,
  errors = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
