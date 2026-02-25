const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const User = require("../models/user");
const store = require("../lib/inMemoryStore");

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." },
});
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many registration attempts. Try again later." },
});

function toUserPayload(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    googleId: user.googleId || "",
    authProvider: user.authProvider || "local",
  };
}

/* REGISTER */
router.post("/register", authLimiter, registerLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedName = (name || "").trim() || trimmedEmail.split("@")[0];

    if (!trimmedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const secret = process.env.JWT_SECRET || "dev-only-secret";
    const useMemory = !process.env.MONGO_URI || mongoose.connection.readyState !== 1;

    const existingUser = useMemory
      ? store.users.find((u) => u.email === trimmedEmail)
      : await User.findOne({ email: trimmedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = useMemory
      ? (() => {
          const newUser = {
            _id: store.makeId(),
            name: trimmedName,
            email: trimmedEmail,
            password: hashedPassword,
            authProvider: "local",
            googleId: "",
          };
          store.users.push(newUser);
          return newUser;
        })()
      : await User.create({
          name: trimmedName,
          email: trimmedEmail,
          password: hashedPassword,
          authProvider: "local",
        });

    const token = jwt.sign(
      { userId: user._id },
      secret,
      { expiresIn: "7d" }
    );

    res.json({ user: toUserPayload(user), token });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* LOGIN */
router.post("/login", authLimiter, loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = (email || "").trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const secret = process.env.JWT_SECRET || "dev-only-secret";
    const useMemory = !process.env.MONGO_URI || mongoose.connection.readyState !== 1;

    const user = useMemory
      ? store.users.find((u) => u.email === trimmedEmail)
      : await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      secret,
      { expiresIn: "7d" }
    );

    res.json({ user: toUserPayload(user), token });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* GOOGLE OAUTH */
router.post("/google", authLimiter, loginLimiter, async (req, res) => {
  try {
    const credential = String(req.body.credential || "").trim();
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!verifyRes.ok) {
      return res.status(400).json({ message: "Invalid Google credential" });
    }

    const payload = await verifyRes.json();
    const email = String(payload.email || "").trim().toLowerCase();
    const name = String(payload.name || email.split("@")[0] || "Google User").trim();
    const googleId = String(payload.sub || "").trim();

    if (!email || !googleId) {
      return res.status(400).json({ message: "Invalid Google payload" });
    }

    if (payload.email_verified !== "true" && payload.email_verified !== true) {
      return res.status(400).json({ message: "Google email is not verified" });
    }

    const expectedClientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();
    if (expectedClientId && payload.aud !== expectedClientId) {
      return res.status(400).json({ message: "Google client mismatch" });
    }

    const secret = process.env.JWT_SECRET || "dev-only-secret";
    const useMemory = !process.env.MONGO_URI || mongoose.connection.readyState !== 1;

    let user = useMemory
      ? store.users.find((u) => u.email === email || (u.googleId && u.googleId === googleId))
      : await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      if (useMemory) {
        user = {
          _id: store.makeId(),
          name,
          email,
          password: "",
          googleId,
          authProvider: "google",
        };
        store.users.push(user);
      } else {
        user = await User.create({
          name,
          email,
          password: "",
          googleId,
          authProvider: "google",
        });
      }
    } else if (useMemory) {
      user.googleId = user.googleId || googleId;
      user.authProvider = "google";
      user.name = user.name || name;
    } else {
      user.googleId = user.googleId || googleId;
      user.authProvider = "google";
      if (!user.name) user.name = name;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({ user: toUserPayload(user), token });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Google login failed" });
  }
});

module.exports = router;
