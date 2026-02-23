function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const requestId = req.requestId || "no-request-id";
  console.error(`[${requestId}] Unhandled error:`, err.message);

  return res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message,
    requestId,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
