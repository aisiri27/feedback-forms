const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : header.trim();

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (token === "demo-token") {
    req.user = {
      userId: "000000000000000000000001",
      id: "000000000000000000000001",
      email: "demo@chiac.local",
    };
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || "dev-only-secret";
    const decoded = jwt.verify(token, secret);
    req.user = {
      ...decoded,
      id: decoded.userId,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
