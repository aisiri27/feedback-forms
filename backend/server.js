require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const responseRoutes = require("./routes/responses");
const eventRoutes = require("./routes/eventRoutes");

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev-only-secret";
  console.log("JWT_SECRET not set. Using temporary dev secret.");
}

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("MongoDB connection failed. Falling back to in-memory mode.", err.message));
} else {
  console.log("MONGO_URI not set. Running in in-memory mode.");
}

app.use("/auth", authRoutes);
app.use("/forms", formRoutes);
app.use("/responses", responseRoutes);
app.use("/api/events", eventRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
