import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function EventPublicFeedback() {
  const { publicLink } = useParams();
  const [event, setEvent] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/events/public/${publicLink}`);
        setEvent(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Event not found");
      }
    };
    load();
  }, [publicLink]);

  const submit = async () => {
    try {
      setError("");
      await api.post(`/api/events/public/${publicLink}/feedback`, {
        rating: Number(rating),
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback");
    }
  };

  if (error) return <div className="feedback-page"><div className="error-message">{error}</div></div>;
  if (!event) return <div className="p-6">Loading...</div>;
  if (submitted) return <div className="feedback-page"><div className="success-message">Thanks! Feedback submitted.</div></div>;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="feedback-page app-card">
        <h1 className="feedback-header">{event.title}</h1>
        <p className="text-gray-600 mb-6">{event.description}</p>

        <label className="block text-sm font-medium mb-2">How would you rate this event? (1-5)</label>
        <div className="rating-scale mb-4">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={Number(rating) === value ? "btn-primary px-3 py-1" : "btn-secondary px-3 py-1"}
            >
              {value}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium mb-2">Any additional feedback? (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input-base mb-4"
          rows={4}
        />

        <button onClick={submit} className="btn-primary">
          Submit Feedback
        </button>
      </div>
    </div>
  );
}
