const mongoose = require("mongoose");
const app = require("./app");

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

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

module.exports = { app, server };
