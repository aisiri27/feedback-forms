require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const responseRoutes = require("./routes/responses");
const eventRoutes = require("./routes/eventRoutes");
const requestLogger = require("./middleware/requestLogger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
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
