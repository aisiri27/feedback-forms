const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: String,
  type: String,
  required: Boolean,
  options: [String],
});

const formSchema = new mongoose.Schema({
  title: String,
  description: String,
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Form", formSchema);