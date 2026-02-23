const mongoose = require("mongoose");

const eventFeedbackSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    default: "",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("EventFeedback", eventFeedbackSchema);
