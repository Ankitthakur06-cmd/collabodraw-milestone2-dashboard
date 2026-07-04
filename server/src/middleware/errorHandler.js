// Centralized Express error handler. Generic infrastructure only —
// no feature-specific error cases are handled yet.

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
}

export default errorHandler;
