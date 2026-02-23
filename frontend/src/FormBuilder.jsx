import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "./api";

function toClientQuestion(question, index) {
  return {
    clientId: question._id || `q-${index}-${Date.now()}`,
    serverId: question._id,
    title: question.title || "Untitled Question",
    type: question.type || "multiple_choice",
    required: Boolean(question.required),
    options: Array.isArray(question.options) && question.options.length
      ? question.options
      : ["Option 1"],
  };
}

function toServerQuestion(question) {
  const hasOptions = question.type === "multiple_choice";
  const payload = {
    title: question.title,
    type: question.type,
    required: question.required,
    options: hasOptions ? question.options : [],
  };

  if (question.serverId) {
    payload._id = question.serverId;
  }
  return payload;
}

function makeQuestion(type) {
  const base = {
    clientId: `new-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title: "Untitled Question",
    type,
    required: false,
    options: [],
  };

  if (type === "multiple_choice") {
    return { ...base, options: ["Option 1"] };
  }

  if (type === "rating") {
    return { ...base, title: "Rate from 1 to 5" };
  }

  return base;
}

function SortableItem({ question, isSelected, onSelect, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.clientId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        onClick={onSelect}
        className={`question-block bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 ${
          isSelected ? "border-[var(--color-primary)]" : "border-transparent"
        }`}
      >
        <div {...listeners} className="cursor-move text-gray-400 text-center mb-2">
          :::
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <input
            value={question.title}
            onChange={(e) => onUpdate(question.clientId, { title: e.target.value })}
            className="input-base text-lg w-full"
          />
          <select
            value={question.type}
            onChange={(e) => onUpdate(question.clientId, { type: e.target.value, options: e.target.value === "multiple_choice" ? (question.options?.length ? question.options : ["Option 1"]) : [] })}
            className="input-base md:w-52"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="rating">Rating (1-5)</option>
            <option value="short_answer">Short Answer</option>
            <option value="paragraph">Paragraph</option>
            <option value="yes_no">Yes / No</option>
          </select>
        </div>

        {question.type === "multiple_choice" && (
          <div>
            {(question.options || []).map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={(e) => {
                  const next = [...question.options];
                  next[index] = e.target.value;
                  onUpdate(question.clientId, { options: next });
                }}
                className="input-base block w-full mb-2"
              />
            ))}
            <button
              type="button"
              onClick={() => onUpdate(question.clientId, { options: [...question.options, "New Option"] })}
              className="btn-secondary text-sm"
            >
              + Add Option
            </button>
          </div>
        )}

        {question.type === "rating" && (
          <div className="flex gap-2 text-sm">
            {[1, 2, 3, 4, 5].map((n) => <span key={n} className="btn-secondary">{n}</span>)}
          </div>
        )}

        {question.type === "short_answer" && (
          <input disabled placeholder="Short answer text" className="input-base w-full" />
        )}

        {question.type === "paragraph" && (
          <textarea disabled placeholder="Long answer text" className="input-base w-full" />
        )}

        {question.type === "yes_no" && (
          <div className="flex gap-6 text-gray-600">
            <span>Yes</span>
            <span>No</span>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate(question.clientId, { required: e.target.checked })}
            />
            Required
          </label>
          <button type="button" onClick={onDelete} className="text-red-500 text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [formDescription, setFormDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [submissionSettings, setSubmissionSettings] = useState({
    allowAnonymous: true,
    allowNamed: true,
  });
  const [status, setStatus] = useState("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const questionIds = useMemo(() => questions.map((q) => q.clientId), [questions]);
  const publicUrl = `${window.location.origin}/form/${id}/public`;

  const loadForm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await api.get(`/forms/${id}`);
      const form = res.data;
      const initialQuestions = (form.questions || []).map(toClientQuestion);

      setFormTitle(form.title || "Untitled Form");
      setFormDescription(form.description || "");
      setAiPrompt(form.aiPrompt || "");
      setSubmissionSettings({
        allowAnonymous: form?.submissionSettings?.allowAnonymous !== false,
        allowNamed: form?.submissionSettings?.allowNamed !== false,
      });
      setStatus(form.status || (form.isPublished ? "published" : "draft"));
      setQuestions(initialQuestions);
      setSelectedId(initialQuestions[0]?.clientId || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load form");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const addQuestion = (type = "multiple_choice") => {
    const item = makeQuestion(type);
    setQuestions((prev) => [...prev, item]);
    setSelectedId(item.clientId);
  };

  const updateQuestion = (clientId, updates) => {
    setQuestions((prev) => prev.map((q) => (q.clientId === clientId ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (clientId) => {
    setQuestions((prev) => {
      const next = prev.filter((q) => q.clientId !== clientId);
      if (selectedId === clientId) {
        setSelectedId(next[0]?.clientId || null);
      }
      return next;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setQuestions((prev) => {
      const oldIndex = prev.findIndex((q) => q.clientId === active.id);
      const newIndex = prev.findIndex((q) => q.clientId === over.id);
      const copy = [...prev];
      const [moved] = copy.splice(oldIndex, 1);
      copy.splice(newIndex, 0, moved);
      return copy;
    });
  };

  const saveForm = async (nextStatus = status) => {
    await api.put(`/forms/${id}`, {
      title: formTitle,
      description: formDescription,
      aiPrompt,
      submissionSettings,
      status: nextStatus,
      questions: questions.map(toServerQuestion),
    });
    await loadForm();
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      await saveForm(status);
      setMessage("Saved");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save form");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError("");
      setMessage("");
      const prompt = aiPrompt.trim();
      if (!prompt) {
        setError("Enter a prompt to generate a form draft.");
        return;
      }

      const res = await api.post("/forms/generate-from-prompt", { prompt });
      const generated = res.data;

      setFormTitle(generated.title || formTitle);
      setFormDescription(generated.description || formDescription);
      const generatedQuestions = (generated.questions || []).map(toClientQuestion);
      setQuestions(generatedQuestions);
      setSelectedId(generatedQuestions[0]?.clientId || null);
      setMessage("Draft generated from AI designer template.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate form draft");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setError("");
      setMessage("");
      await saveForm("published");
      await api.post(`/forms/${id}/publish`);
      setStatus("published");
      setMessage(`Published. Public link: ${publicUrl}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish form");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading form...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-14">
      <div className="top-nav-glass">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">LumaForms Studio</h1>
            <p className="text-sm text-gray-600">Design production-ready forms with AI-assisted templates.</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`text-xs px-2 py-1 rounded ${status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {status.toUpperCase()}
            </span>
            <button type="button" onClick={() => navigate("/")} className="btn-secondary">Dashboard</button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="btn-secondary">
              {isSaving ? "Saving..." : "Save Form"}
            </button>
            <button type="button" onClick={handlePublish} disabled={isPublishing} className="btn-primary">
              {isPublishing ? "Publishing..." : "Publish Form"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error ? <p className="error-message mb-4">{error}</p> : null}
        {message ? <p className="success-message mb-4">{message}</p> : null}

        <div className="app-card mb-6 ai-designer-block">
          <p className="font-semibold text-white text-lg mb-1">LumaForms AI Designer</p>
          <p className="text-white/90 text-sm mb-3">Describe your event and generate a starter questionnaire.</p>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="input-base bg-white/90"
              placeholder="Example: AI bootcamp review from students"
            />
            <button type="button" onClick={handleGenerate} disabled={isGenerating} className="btn-primary">
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        <div className="app-card mb-6">
          <p className="text-sm font-semibold mb-2">Form Details</p>
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="input-base text-xl mb-3"
            placeholder="Form title"
          />
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="input-base mb-4"
            placeholder="Description"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Submission Settings</p>
              <label className="flex items-center gap-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={submissionSettings.allowAnonymous}
                  onChange={(e) => setSubmissionSettings((prev) => ({ ...prev, allowAnonymous: e.target.checked }))}
                />
                Allow Anonymous
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={submissionSettings.allowNamed}
                  onChange={(e) => setSubmissionSettings((prev) => ({ ...prev, allowNamed: e.target.checked }))}
                />
                Allow Include Name
              </label>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Share Link</p>
              <a href={publicUrl} className="text-[var(--color-primary)] underline break-all" target="_blank" rel="noreferrer">
                {publicUrl}
              </a>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold mb-2">Quick Add</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => addQuestion("short_answer")}>Text</button>
            <button type="button" className="btn-secondary" onClick={() => addQuestion("rating")}>Rating</button>
            <button type="button" className="btn-secondary" onClick={() => addQuestion("multiple_choice")}>Choice</button>
            <button type="button" className="btn-secondary" onClick={() => addQuestion("yes_no")}>Yes/No</button>
          </div>
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
            {questions.map((question) => (
              <SortableItem
                key={question.clientId}
                question={question}
                isSelected={selectedId === question.clientId}
                onSelect={() => setSelectedId(question.clientId)}
                onUpdate={updateQuestion}
                onDelete={() => deleteQuestion(question.clientId)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
