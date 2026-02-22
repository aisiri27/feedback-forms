const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  // For normal login users
  password: {
    type: String
  },

  // For Google login users
  googleId: {
    type: String
  },

  profilePic: String,

  authProvider: {
    type: String,
    enum: ["google", "local"],
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});


// 🔐 Hash password before saving (for local users)
userSchema.pre("save", async function(next) {
  if (!this.password) return next();
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
