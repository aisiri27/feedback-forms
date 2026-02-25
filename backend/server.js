const mongoose = require("mongoose");
const app = require("./app");
const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.JWT_SECRET) {
  console.error("JWT_SECRET is required in production.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev-only-secret";
  console.log("JWT_SECRET not set. Using temporary dev secret.");
}

if (isProd && !process.env.MONGO_URI) {
  console.error("MONGO_URI is required in production.");
  process.exit(1);
}

async function start() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB Connected");
    } catch (err) {
      if (isProd) {
        console.error("MongoDB connection failed in production.", err.message);
        process.exit(1);
      }
      console.log("MongoDB connection failed. Falling back to in-memory mode.", err.message);
    }
  } else {
    console.log("MONGO_URI not set. Running in in-memory mode.");
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );

  return server;
}

const serverPromise = start();

module.exports = { app, serverPromise };
