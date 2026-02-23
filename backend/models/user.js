const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  googleId: {
    type: String,
    default: "",
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
});

module.exports = mongoose.model("User", userSchema);
