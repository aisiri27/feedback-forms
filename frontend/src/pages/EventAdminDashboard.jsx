import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function EventAdminDashboard() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEvents = async () => {
    try {
      const res = await api.get("/api/events/mine");
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load events");
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");
      await api.post("/api/events", { title, description });
      setTitle("");
      setDescription("");
      await loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="app-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin: Event Forms</h1>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => navigate("/events/feedback")}>
              User Feedback
            </button>
            <button className="btn-secondary" onClick={() => navigate("/events/analytics")}>
              Event Analytics
            </button>
          </div>
        </div>

        <form onSubmit={handleCreate} className="app-card event-form-layout mb-6">
          <h2 className="font-semibold mb-3">Create Event</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="input-base"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Event description"
            className="input-base"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>
          {error ? <p className="error-message">{error}</p> : null}
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <div key={event._id} className="event-card">
              <h3 className="event-title">{event.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              <p className="text-sm">Responses: {event.totalResponses || 0}</p>
              <p className="text-sm mb-2">Average Rating: {event.averageRating || 0}</p>
              <a
                href={`${window.location.origin}/event/${event.publicLink}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[var(--color-primary)] underline mr-3"
              >
                Public Feedback Link
              </a>
              <button
                onClick={() => navigate(`/events/analytics?eventId=${event._id}`)}
                className="btn-secondary text-sm"
              >
                View Analytics
              </button>
            </div>
          ))}
          {!events.length ? <p className="text-gray-600">No events yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
