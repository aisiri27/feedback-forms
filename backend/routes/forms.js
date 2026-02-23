const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Form = require("../models/form");
const Response = require("../models/Response");
const authMiddleware = require("../middleware/authMiddleware");
const store = require("../lib/inMemoryStore");

const router = express.Router();
const POSITIVE_WORDS = ["good", "great", "excellent", "helpful", "clear", "valuable", "amazing", "love", "best", "useful"];
const NEGATIVE_WORDS = ["bad", "poor", "confusing", "boring", "slow", "hard", "unclear", "difficult", "worse", "issue"];
const HIGHLIGHT_KEYWORDS = ["instructor", "content", "hands-on", "practical", "projects", "examples", "clarity"];
const IMPROVEMENT_KEYWORDS = ["pace", "duration", "time", "support", "resources", "qa", "interaction", "practice"];

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(String(id || ""));
}

function useMemory() {
  return !process.env.MONGO_URI || mongoose.connection.readyState !== 1;
}

function getUserIdFromHeader(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();

  if (!token) return null;
  if (token === "demo-token") return "000000000000000000000001";

  try {
    const secret = process.env.JWT_SECRET || "dev-only-secret";
    const decoded = jwt.verify(token, secret);
    return decoded.userId || null;
  } catch {
    return null;
  }
}

function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => ({
    _id: q._id || store.makeId(),
    title: q.title || "Untitled Question",
    type: q.type || "multiple_choice",
    required: Boolean(q.required),
    options: Array.isArray(q.options) ? q.options : [],
  }));
}

function normalizeSubmissionSettings(raw, fallback = {}) {
  const base = raw || fallback || {};
  const allowAnonymous = base.allowAnonymous !== false;
  const allowNamed = base.allowNamed !== false;
  return { allowAnonymous, allowNamed };
}

function deriveStatus(form) {
  return form?.isPublished || form?.status === "published" ? "published" : "draft";
}

function toClientForm(form) {
  const status = deriveStatus(form);
  return {
    ...form,
    status,
    isPublished: status === "published",
    submissionSettings: normalizeSubmissionSettings(form?.submissionSettings),
    aiPrompt: form?.aiPrompt || "",
  };
}

function normalizeYesNo(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "yes") return "Yes";
  if (text === "no") return "No";
  return null;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function buildTextInsights(textAnswers) {
  const positives = [];
  const negatives = [];
  const highlightCounts = {};
  const improvementCounts = {};

  textAnswers.forEach((text) => {
    const lower = String(text || "").toLowerCase();

    POSITIVE_WORDS.forEach((word) => {
      if (lower.includes(word)) positives.push(word);
    });

    NEGATIVE_WORDS.forEach((word) => {
      if (lower.includes(word)) negatives.push(word);
    });

    HIGHLIGHT_KEYWORDS.forEach((word) => {
      if (lower.includes(word)) {
        highlightCounts[word] = (highlightCounts[word] || 0) + 1;
      }
    });

    IMPROVEMENT_KEYWORDS.forEach((word) => {
      if (lower.includes(word)) {
        improvementCounts[word] = (improvementCounts[word] || 0) + 1;
      }
    });
  });

  const sentimentScore = clampScore(50 + ((positives.length - negatives.length) * 8));
  const highlights = Object.entries(highlightCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);
  const improvementAreas = Object.entries(improvementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

  const summary = [
    sentimentScore >= 70 ? "Overall positive feedback trend." : "Mixed-to-neutral feedback trend.",
    highlights.length ? `Strengths: ${highlights.join(", ")}.` : "No repeated strengths detected yet.",
    improvementAreas.length ? `Improve: ${improvementAreas.join(", ")}.` : "No repeated improvement area detected yet.",
  ].join(" ");

  return { sentimentScore, highlights, improvementAreas, summary };
}

function generateQuestionTemplate(prompt) {
  const lower = prompt.toLowerCase();

  const isAiTopic = ["ai", "ml", "machine learning", "bootcamp", "nlp"].some((key) => lower.includes(key));
  const options = isAiTopic
    ? [
      "Machine Learning Fundamentals",
      "Deep Learning Architectures",
      "Natural Language Processing",
      "Computer Vision",
      "Deployment and MLOps",
    ]
    : [
      "Hands-on Activities",
      "Instructor Delivery",
      "Content Quality",
      "Practical Examples",
      "Q&A and Interaction",
    ];

  return [
    {
      title: "On a scale of 1 to 5, how would you rate your overall experience?",
      type: "rating",
      required: true,
      options: [],
    },
    {
      title: "What was the most valuable aspect for you?",
      type: "short_answer",
      required: true,
      options: [],
    },
    {
      title: "Do you believe this prepared you well for real-world applications?",
      type: "yes_no",
      required: true,
      options: [],
    },
    {
      title: "Which of the following topics did you find most engaging?",
      type: "multiple_choice",
      required: true,
      options,
    },
    {
      title: "What suggestions do you have to improve in the future?",
      type: "paragraph",
      required: false,
      options: [],
    },
  ];
}

function generateFormDraftFromPrompt(prompt) {
  const cleanPrompt = String(prompt || "").trim();
  const titleCore = cleanPrompt || "General Feedback";

  return {
    title: `${titleCore} Feedback Form`,
    description: `Please provide your feedback for ${titleCore}.`,
    questions: generateQuestionTemplate(cleanPrompt),
  };
}

function buildAnalytics(form, responses) {
  const totalResponses = responses.length;
  const overallRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const yesNoSplit = { Yes: 0, No: 0 };
  const textAnswers = [];
  const trendMap = {};

  responses.forEach((row) => {
    const date = new Date(row.submittedAt || Date.now());
    const key = date.toISOString().slice(0, 10);
    trendMap[key] = (trendMap[key] || 0) + 1;
  });

  const questions = (form.questions || []).map((question) => {
    const qid = String(question._id);
    const related = responses
      .flatMap((r) => (Array.isArray(r.answers) ? r.answers : []))
      .filter((a) => String(a.questionId) === qid);

    const item = {
      questionId: qid,
      title: question.title || "Untitled Question",
      type: question.type || "unknown",
      totalAnswers: related.length,
    };

    if (question.type === "rating") {
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let ratingSum = 0;
      let ratingCount = 0;

      related.forEach((ans) => {
        const value = Number(ans.answer);
        if (Number.isInteger(value) && value >= 1 && value <= 5) {
          distribution[value] += 1;
          overallRatingDistribution[value] += 1;
          ratingSum += value;
          ratingCount += 1;
        }
      });

      item.ratingDistribution = distribution;
      item.averageRating = ratingCount ? Number((ratingSum / ratingCount).toFixed(2)) : 0;
    }

    if (question.type === "multiple_choice" || question.type === "yes_no") {
      const baseOptions = question.type === "yes_no"
        ? ["Yes", "No"]
        : (Array.isArray(question.options) ? question.options : []);

      const counts = {};
      baseOptions.forEach((opt) => { counts[opt] = 0; });
      related.forEach((ans) => {
        const value = question.type === "yes_no"
          ? normalizeYesNo(ans.answer)
          : String(ans.answer ?? "");

        if (!value) return;
        counts[value] = (counts[value] || 0) + 1;
        if (question.type === "yes_no") {
          yesNoSplit[value] += 1;
        }
      });
      item.choiceCounts = counts;
    }

    if (question.type === "short_answer" || question.type === "paragraph") {
      const responsesText = related
        .map((ans) => String(ans.answer || "").trim())
        .filter(Boolean);
      textAnswers.push(...responsesText);
      item.textResponses = responsesText.slice(-10);
    }

    return item;
  });

  const overallRatings = Object.entries(overallRatingDistribution).reduce(
    (acc, [key, value]) => acc + (Number(key) * value),
    0
  );
  const overallRatingsCount = Object.values(overallRatingDistribution).reduce((acc, value) => acc + value, 0);
  const avgRating = overallRatingsCount ? Number((overallRatings / overallRatingsCount).toFixed(2)) : 0;

  const insights = buildTextInsights(textAnswers);
  const submissionTrend = Object.entries(trendMap)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([date, count]) => ({ date, count }));

  return {
    formId: String(form._id),
    formTitle: form.title || "Untitled Form",
    totalResponses,
    averageRating: avgRating,
    questions,
    visualization: {
      overallRatingDistribution,
      yesNoSplit,
      recentTextResponses: textAnswers.slice(-10).reverse(),
      submissionTrend,
    },
    insights,
  };
}

router.post("/generate-from-prompt", authMiddleware, async (req, res) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    return res.json(generateFormDraftFromPrompt(prompt));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const requestedStatus = req.body.status === "published" ? "published" : "draft";
    const submissionSettings = normalizeSubmissionSettings(req.body.submissionSettings);

    if (useMemory()) {
      const form = {
        _id: store.makeId(),
        title: req.body.title || "Untitled Form",
        description: req.body.description || "",
        aiPrompt: req.body.aiPrompt || "",
        questions: normalizeQuestions(req.body.questions),
        submissionSettings,
        status: requestedStatus,
        createdBy: req.user.id,
        isPublished: requestedStatus === "published",
        createdAt: store.nowIso(),
      };
      store.forms.push(form);
      return res.status(201).json(toClientForm(form));
    }

    const form = new Form({
      title: req.body.title || "Untitled Form",
      description: req.body.description || "",
      aiPrompt: req.body.aiPrompt || "",
      questions: Array.isArray(req.body.questions) ? req.body.questions : [],
      submissionSettings,
      status: requestedStatus,
      isPublished: requestedStatus === "published",
      createdBy: req.user.id,
    });
    await form.save();
    return res.status(201).json(toClientForm(form.toObject()));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    if (useMemory()) {
      const forms = store.forms
        .filter((f) => String(f.createdBy) === String(req.user.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((form) => ({
          ...toClientForm(form),
          responseCount: store.responses.filter((r) => String(r.formId) === String(form._id)).length,
        }));
      return res.json(forms);
    }

    const forms = await Form.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    const counts = await Response.aggregate([
      { $match: { formId: { $in: forms.map((f) => f._id) } } },
      { $group: { _id: "$formId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const data = forms.map((form) => ({
      ...toClientForm(form.toObject()),
      responseCount: countMap.get(String(form._id)) || 0,
    }));
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/published", async (req, res) => {
  try {
    if (useMemory()) {
      const forms = store.forms
        .filter((f) => deriveStatus(f) === "published")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((f) => ({
          _id: f._id,
          title: f.title,
          description: f.description,
          status: deriveStatus(f),
          submissionSettings: normalizeSubmissionSettings(f.submissionSettings),
          questionCount: (f.questions || []).length,
        }));
      return res.json(forms);
    }

    const forms = await Form.find({ $or: [{ isPublished: true }, { status: "published" }] })
      .sort({ createdAt: -1 })
      .select("_id title description questions submissionSettings status isPublished");
    const data = forms.map((f) => ({
      _id: f._id,
      title: f.title,
      description: f.description,
      status: deriveStatus(f),
      submissionSettings: normalizeSubmissionSettings(f.submissionSettings),
      questionCount: Array.isArray(f.questions) ? f.questions.length : 0,
    }));
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/:id/analytics", authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    if (useMemory()) {
      const form = store.forms.find((f) => String(f._id) === String(req.params.id));
      if (!form) return res.status(404).json({ message: "Form not found" });
      if (String(form.createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const responses = store.responses.filter((r) => String(r.formId) === String(form._id));
      return res.json(buildAnalytics(form, responses));
    }

    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (String(form.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const responses = await Response.find({ formId: form._id });
    return res.json(buildAnalytics(form.toObject(), responses));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    if (useMemory()) {
      const form = store.forms.find((f) => String(f._id) === String(req.params.id));
      if (!form) return res.status(404).json({ message: "Form not found" });
      if (deriveStatus(form) === "published") return res.json(toClientForm(form));

      const userId = getUserIdFromHeader(req);
      if (!userId || String(form.createdBy) !== String(userId)) {
        return res.status(403).json({ message: "Form is not published" });
      }
      return res.json(toClientForm(form));
    }

    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (deriveStatus(form) === "published") return res.json(toClientForm(form.toObject()));

    const userId = getUserIdFromHeader(req);
    if (!userId || String(form.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Form is not published" });
    }
    return res.json(toClientForm(form.toObject()));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    if (useMemory()) {
      const idx = store.forms.findIndex((f) => String(f._id) === String(req.params.id));
      if (idx === -1) return res.status(404).json({ message: "Form not found" });
      if (String(store.forms[idx].createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      store.forms[idx] = {
        ...store.forms[idx],
        title: req.body.title ?? store.forms[idx].title,
        description: req.body.description ?? store.forms[idx].description,
        aiPrompt: req.body.aiPrompt ?? store.forms[idx].aiPrompt ?? "",
        submissionSettings: req.body.submissionSettings
          ? normalizeSubmissionSettings(req.body.submissionSettings, store.forms[idx].submissionSettings)
          : normalizeSubmissionSettings(store.forms[idx].submissionSettings),
        questions: Array.isArray(req.body.questions)
          ? normalizeQuestions(req.body.questions)
          : store.forms[idx].questions,
      };

      if (req.body.status === "published" || req.body.status === "draft") {
        store.forms[idx].status = req.body.status;
        store.forms[idx].isPublished = req.body.status === "published";
      } else if (typeof req.body.isPublished === "boolean") {
        store.forms[idx].isPublished = req.body.isPublished;
        store.forms[idx].status = req.body.isPublished ? "published" : "draft";
      }

      return res.json(toClientForm(store.forms[idx]));
    }

    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (String(form.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    form.title = req.body.title ?? form.title;
    form.description = req.body.description ?? form.description;
    form.aiPrompt = req.body.aiPrompt ?? form.aiPrompt ?? "";
    if (req.body.submissionSettings) {
      form.submissionSettings = normalizeSubmissionSettings(req.body.submissionSettings, form.submissionSettings);
    } else if (!form.submissionSettings) {
      form.submissionSettings = normalizeSubmissionSettings(null);
    }

    if (req.body.status === "published" || req.body.status === "draft") {
      form.status = req.body.status;
      form.isPublished = req.body.status === "published";
    } else if (typeof req.body.isPublished === "boolean") {
      form.isPublished = req.body.isPublished;
      form.status = req.body.isPublished ? "published" : "draft";
    }

    if (Array.isArray(req.body.questions)) form.questions = req.body.questions;
    await form.save();
    return res.json(toClientForm(form.toObject()));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    if (useMemory()) {
      const idx = store.forms.findIndex((f) => String(f._id) === String(req.params.id));
      if (idx === -1) return res.status(404).json({ message: "Form not found" });
      if (String(store.forms[idx].createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const formId = String(store.forms[idx]._id);
      store.forms.splice(idx, 1);
      for (let i = store.responses.length - 1; i >= 0; i -= 1) {
        if (String(store.responses[i].formId) === formId) {
          store.responses.splice(i, 1);
        }
      }
      return res.json({ message: "Form deleted" });
    }

    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (String(form.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Response.deleteMany({ formId: form._id });
    await form.deleteOne();
    return res.json({ message: "Form deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/:id/publish", authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    if (useMemory()) {
      const idx = store.forms.findIndex((f) => String(f._id) === String(req.params.id));
      if (idx === -1) return res.status(404).json({ message: "Form not found" });
      if (String(store.forms[idx].createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      store.forms[idx].isPublished = true;
      store.forms[idx].status = "published";
      return res.json({ message: "Published", form: toClientForm(store.forms[idx]) });
    }

    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    if (String(form.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    form.isPublished = true;
    form.status = "published";
    await form.save();
    return res.json({ message: "Published", form: toClientForm(form.toObject()) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
