function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId = Math.random().toString(36).slice(2, 10);
  req.requestId = requestId;

  res.on("finish", () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.originalUrl || req.url;
    console.log(`[${requestId}] ${method} ${path} -> ${status} (${ms}ms)`);
  });

  next();
}

module.exports = requestLogger;
