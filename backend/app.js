require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const responseRoutes = require("./routes/responses");
const eventRoutes = require("./routes/eventRoutes");
const requestLogger = require("./middleware/requestLogger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const allowedOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.use("/auth", authRoutes);
app.use("/forms", formRoutes);
app.use("/responses", responseRoutes);
app.use("/api/events", eventRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
