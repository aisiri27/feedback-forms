const express = require("express");
const mongoose = require("mongoose");
const Response = require("../models/Response");
const Form = require("../models/form");
const store = require("../lib/inMemoryStore");

const router = express.Router();

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(String(id || ""));
}

function useMemory() {
  return !process.env.MONGO_URI || mongoose.connection.readyState !== 1;
}

function normalizeIdentity(rawIdentity) {
  const mode = rawIdentity?.mode === "named" ? "named" : "anonymous";
  const respondentName = String(rawIdentity?.respondentName || "").trim();

  if (mode === "named" && !respondentName) {
    return { error: "Respondent name is required for named submissions" };
  }

  if (respondentName.length > 100) {
    return { error: "Respondent name must be at most 100 characters" };
  }

  return {
    mode,
    respondentName: mode === "named" ? respondentName : "",
  };
}

function isFormPublished(form) {
  return Boolean(form?.isPublished) || form?.status === "published";
}

router.post("/:formId", async (req, res) => {
  try {
    const { formId } = req.params;
    if (!isValidObjectId(formId)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const identityResult = normalizeIdentity(req.body.identity);
    if (identityResult.error) {
      return res.status(400).json({ message: identityResult.error });
    }

    if (useMemory()) {
      const form = store.forms.find((f) => String(f._id) === String(formId));
      if (!form || !isFormPublished(form)) {
        return res.status(404).json({ message: "Form not available" });
      }
      const response = {
        _id: store.makeId(),
        formId,
        answers,
        identity: identityResult,
        submittedAt: store.nowIso(),
      };
      store.responses.push(response);
      return res.status(201).json({ message: "Response submitted" });
    }

    const form = await Form.findById(formId);
    if (!form || !isFormPublished(form)) {
      return res.status(404).json({ message: "Form not available" });
    }

    const response = new Response({ formId, answers, identity: identityResult });
    await response.save();
    return res.status(201).json({ message: "Response submitted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
