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
  aiPrompt: {
    type: String,
    default: "",
  },
  questions: [questionSchema],
  submissionSettings: {
    allowAnonymous: {
      type: Boolean,
      default: true,
    },
    allowNamed: {
      type: Boolean,
      default: true,
    },
  },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
  },
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
