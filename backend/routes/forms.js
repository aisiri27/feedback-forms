const express = require("express");
const router = express.Router();
const Form = require("../models/Form");
const authMiddleware = require("../middleware/authMiddleware");

// CREATE
router.post("/", authMiddleware, async (req, res) => {
  const form = new Form({
    ...req.body,
    createdBy: req.user.id,
  });

  await form.save();
  res.json(form);
});

// GET MY FORMS
router.get("/", authMiddleware, async (req, res) => {
  const forms = await Form.find({
    createdBy: req.user.id,
  }).sort({ createdAt: -1 });

  res.json(forms);
});

// GET SINGLE
router.get("/:id", async (req, res) => {
  const form = await Form.findById(req.params.id);
  res.json(form);
});

// UPDATE
router.put("/:id", authMiddleware, async (req, res) => {
  const updated = await Form.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updated);
});

// PUBLISH
router.post("/:id/publish", authMiddleware, async (req, res) => {
  const form = await Form.findById(req.params.id);
  form.isPublished = true;
  await form.save();
  res.json({ message: "Published" });
});

module.exports = router;