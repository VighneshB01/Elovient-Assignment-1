// Centralized error handler — must be registered last in server.js.
// Catches all errors thrown via express-async-handler or next(err).
// Returns a consistent { success, message } JSON shape for every error.
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Stack trace only exposed in development — never in production
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
