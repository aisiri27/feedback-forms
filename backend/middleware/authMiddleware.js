const jwt = require("jsonwebtoken");
const isDemoEnabled = process.env.NODE_ENV !== "production";

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : header.trim();

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (token === "demo-token" && isDemoEnabled) {
    req.user = {
      userId: "000000000000000000000001",
      id: "000000000000000000000001",
      email: "demo@chiac.local",
    };
    return next();
  }

  if (token === "demo-token" && !isDemoEnabled) {
    return res.status(401).json({ message: "Invalid or expired token" });
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
