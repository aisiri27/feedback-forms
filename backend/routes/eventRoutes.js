const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventFeedback = require("../models/EventFeedback");
const authMiddleware = require("../middleware/authMiddleware");
const store = require("../lib/inMemoryStore");

const router = express.Router();

function useMemory() {
  return !process.env.MONGO_URI || mongoose.connection.readyState !== 1;
}

function randomPublicLink() {
  return Math.random().toString(36).slice(2, 10);
}

function buildDistribution(feedbackRows) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackRows.forEach((row) => {
    const value = Number(row.rating);
    if (value >= 1 && value <= 5) {
      distribution[value] += 1;
    }
  });
  return distribution;
}

function buildAnalytics(event, feedbackRows) {
  const totalResponses = feedbackRows.length;
  const sum = feedbackRows.reduce((acc, row) => acc + Number(row.rating || 0), 0);
  const averageRating = totalResponses ? Number((sum / totalResponses).toFixed(2)) : 0;
  const ratingDistribution = buildDistribution(feedbackRows);
  const comments = feedbackRows
    .filter((row) => String(row.comment || "").trim())
    .slice(-10)
    .reverse()
    .map((row) => ({
      rating: row.rating,
      comment: row.comment,
      submittedAt: row.submittedAt,
    }));

  return {
    eventId: String(event._id),
    title: event.title,
    totalResponses,
    averageRating,
    ratingDistribution,
    comments,
  };
}

router.post("/", authMiddleware, async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    if (!title) {
      return res.status(400).json({ message: "Event title is required" });
    }

    if (useMemory()) {
      const event = {
        _id: store.makeId(),
        title,
        description,
        createdBy: req.user.id,
        isActive: true,
        publicLink: randomPublicLink(),
        createdAt: store.nowIso(),
        feedbackForm: {
          ratingQuestion: "How would you rate this event?",
          textQuestion: "Any additional feedback? (optional)",
        },
      };
      store.events.push(event);
      return res.status(201).json(event);
    }

    const event = await Event.create({
      title,
      description,
      createdBy: req.user.id,
      publicLink: randomPublicLink(),
      isActive: true,
    });
    return res.status(201).json(event);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    if (useMemory()) {
      const data = store.events
        .filter((e) => String(e.createdBy) === String(req.user.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((event) => {
          const rows = store.eventFeedback.filter((f) => String(f.eventId) === String(event._id));
          const totalResponses = rows.length;
          const averageRating = totalResponses
            ? Number((rows.reduce((acc, row) => acc + Number(row.rating || 0), 0) / totalResponses).toFixed(2))
            : 0;
          return { ...event, totalResponses, averageRating };
        });
      return res.json(data);
    }

    const events = await Event.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    const eventIds = events.map((e) => e._id);
    const feedback = await EventFeedback.find({ eventId: { $in: eventIds } });

    const data = events.map((event) => {
      const rows = feedback.filter((f) => String(f.eventId) === String(event._id));
      const totalResponses = rows.length;
      const averageRating = totalResponses
        ? Number((rows.reduce((acc, row) => acc + Number(row.rating || 0), 0) / totalResponses).toFixed(2))
        : 0;
      return { ...event.toObject(), totalResponses, averageRating };
    });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/public/:publicLink", async (req, res) => {
  try {
    const { publicLink } = req.params;
    if (useMemory()) {
      const event = store.events.find((e) => e.publicLink === publicLink && e.isActive);
      if (!event) return res.status(404).json({ message: "Event not found" });
      return res.json({
        _id: event._id,
        title: event.title,
        description: event.description,
        publicLink: event.publicLink,
        feedbackForm: event.feedbackForm,
      });
    }

    const event = await Event.findOne({ publicLink, isActive: true });
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/public/:publicLink/feedback", async (req, res) => {
  try {
    const { publicLink } = req.params;
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
    }

    if (useMemory()) {
      const event = store.events.find((e) => e.publicLink === publicLink && e.isActive);
      if (!event) return res.status(404).json({ message: "Event not found" });

      store.eventFeedback.push({
        _id: store.makeId(),
        eventId: event._id,
        rating,
        comment,
        submittedAt: store.nowIso(),
      });
      return res.status(201).json({ message: "Feedback submitted" });
    }

    const event = await Event.findOne({ publicLink, isActive: true });
    if (!event) return res.status(404).json({ message: "Event not found" });

    await EventFeedback.create({
      eventId: event._id,
      rating,
      comment,
    });
    return res.status(201).json({ message: "Feedback submitted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/:id/analytics", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    if (useMemory()) {
      const event = store.events.find((e) => String(e._id) === String(id));
      if (!event) return res.status(404).json({ message: "Event not found" });
      if (String(event.createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const feedbackRows = store.eventFeedback.filter((f) => String(f.eventId) === String(event._id));
      return res.json(buildAnalytics(event, feedbackRows));
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const feedbackRows = await EventFeedback.find({ eventId: event._id }).sort({ submittedAt: 1 });
    return res.json(buildAnalytics(event, feedbackRows));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
