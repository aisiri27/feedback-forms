const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

router.post("/create", async (req, res) => {
  try {
    const { title, description, createdBy } = req.body;

    const newEvent = new Event({
      title,
      description,
      createdBy,
      publicLink: Math.random().toString(36).substring(2,8)
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.params.userId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;