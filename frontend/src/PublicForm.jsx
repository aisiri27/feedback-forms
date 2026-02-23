import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "./api";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

function normalizeFormSettings(form) {
  const allowAnonymous = form?.submissionSettings?.allowAnonymous !== false;
  const allowNamed = form?.submissionSettings?.allowNamed !== false;
  return { allowAnonymous, allowNamed };
}

function isRequiredAnswered(question, answers) {
  const value = answers[question._id];
  if (question.type === "rating") return Number.isInteger(Number(value));
  if (question.type === "yes_no") return value === "Yes" || value === "No";
  return String(value || "").trim().length > 0;
}

export default function PublicForm() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [identityMode, setIdentityMode] = useState("anonymous");
  const [respondentName, setRespondentName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        setError("");
        setIsUnavailable(false);
        const res = await api.get(`/forms/${id}`);
        setForm(res.data);

        const settings = normalizeFormSettings(res.data);
        if (settings.allowAnonymous) {
          setIdentityMode("anonymous");
        } else if (settings.allowNamed) {
          setIdentityMode("named");
        }
      } catch (err) {
        const message = err.response?.data?.message || "Failed to load form";
        if (message.toLowerCase().includes("not published")) {
          setIsUnavailable(true);
        } else {
          setError(message);
        }
      }
    };

    loadForm();
  }, [id]);

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    try {
      setValidationError("");
      setError("");

      const unansweredRequired = (form.questions || []).filter(
        (question) => question.required && !isRequiredAnswered(question, answers)
      );

      if (unansweredRequired.length) {
        setValidationError("Please answer all required questions before submitting.");
        return;
      }

      if (identityMode === "named" && !respondentName.trim()) {
        setValidationError("Please enter your name or switch to anonymous mode.");
        return;
      }

      const formatted = Object.keys(answers).map((questionId) => ({
        questionId,
        answer: answers[questionId],
      }));

      const identity = {
        mode: identityMode,
        respondentName: identityMode === "named" ? respondentName.trim() : "",
      };

      await api.post(`/responses/${id}`, { answers: formatted, identity });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit response");
    }
  };

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  if (isUnavailable) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="max-w-xl w-full app-card text-center">
          <h1 className="text-2xl font-bold mb-3">This form is not live yet</h1>
          <p className="text-gray-600">The owner has not published this form yet. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!form) return <div className="p-6">Loading...</div>;
  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="max-w-xl w-full success-message">
          Thanks! Your feedback has been submitted.
        </div>
      </div>
    );
  }

  const settings = normalizeFormSettings(form);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="app-card mb-6">
          <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
          <p className="text-gray-600">{form.description}</p>
        </div>

        <div className="app-card mb-6">
          <p className="uppercase tracking-wide text-xs text-gray-500 mb-3">Submission Preference</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!settings.allowAnonymous}
              onClick={() => setIdentityMode("anonymous")}
              className={identityMode === "anonymous" ? "btn-primary w-full" : "btn-secondary w-full"}
            >
              Anonymous
            </button>
            <button
              type="button"
              disabled={!settings.allowNamed}
              onClick={() => setIdentityMode("named")}
              className={identityMode === "named" ? "btn-primary w-full" : "btn-secondary w-full"}
            >
              Include Name
            </button>
          </div>
          {identityMode === "named" ? (
            <input
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              className="input-base mt-3"
              placeholder="Your name"
            />
          ) : null}
        </div>

        {(form.questions || []).map((question, index) => (
          <div key={question._id} className="app-card mb-5">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Question {index + 1}</p>
            <p className="text-lg font-semibold mb-3">
              {question.title} {question.required ? <span className="text-red-500">*</span> : null}
            </p>

            {question.type === "short_answer" && (
              <input
                className="input-base"
                placeholder="Type your answer"
                value={answers[question._id] || ""}
                onChange={(e) => setAnswer(question._id, e.target.value)}
              />
            )}

            {question.type === "paragraph" && (
              <textarea
                className="input-base"
                rows={4}
                placeholder="Type your detailed answer"
                value={answers[question._id] || ""}
                onChange={(e) => setAnswer(question._id, e.target.value)}
              />
            )}

            {question.type === "rating" && (
              <div className="flex gap-3 flex-wrap">
                {RATING_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAnswer(question._id, value)}
                    className={Number(answers[question._id]) === value ? "btn-primary rounded-full w-11 h-11 p-0" : "btn-secondary rounded-full w-11 h-11 p-0"}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}

            {question.type === "multiple_choice" &&
              (question.options || []).map((option, optionIndex) => (
                <label key={optionIndex} className="block mb-2">
                  <input
                    type="radio"
                    name={question._id}
                    value={option}
                    checked={answers[question._id] === option}
                    onChange={(e) => setAnswer(question._id, e.target.value)}
                  />
                  <span className="ml-2">{option}</span>
                </label>
              ))}

            {question.type === "yes_no" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  className={answers[question._id] === "Yes" ? "btn-primary" : "btn-secondary"}
                  onClick={() => setAnswer(question._id, "Yes")}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={answers[question._id] === "No" ? "btn-primary" : "btn-secondary"}
                  onClick={() => setAnswer(question._id, "No")}
                >
                  No
                </button>
              </div>
            )}
          </div>
        ))}

        {validationError ? <p className="error-message mb-4">{validationError}</p> : null}
        {error ? <p className="error-message mb-4">{error}</p> : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary px-6 py-3"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
