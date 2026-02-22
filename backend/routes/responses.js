const express = require("express");
const router = express.Router();
const Response = require("../models/Response");
const Form = require("../models/Form");

// Submit response (PUBLIC)
router.post("/:formId", async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form || !form.isPublished) {
      return res.status(400).json({ message: "Form not available" });
    }

    const response = new Response({
      formId: req.params.formId,
      answers: req.body.answers,
    });

    await response.save();
    res.json({ message: "Response submitted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;