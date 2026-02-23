const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Form",
    required: true,
    index: true,
  },
  answers: [
    {
      questionId: String,
      answer: mongoose.Schema.Types.Mixed,
    },
  ],
  identity: {
    mode: {
      type: String,
      enum: ["anonymous", "named"],
      default: "anonymous",
    },
    respondentName: {
      type: String,
      default: "",
    },
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("Response", responseSchema);
