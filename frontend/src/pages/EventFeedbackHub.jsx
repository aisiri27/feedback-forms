import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function EventFeedbackHub() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const mine = await api.get("/api/events/mine");
        const data = Array.isArray(mine.data) ? mine.data : [];
        setEvents(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load events");
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="app-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User: Give Feedback</h1>
          <button className="btn-secondary" onClick={() => navigate("/events/admin")}>
            Admin
          </button>
        </div>
        {error ? <p className="error-message mb-4">{error}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <div key={event._id} className="event-card">
              <h2 className="event-title">{event.title}</h2>
              <p className="text-sm text-gray-600 mb-3">{event.description}</p>
              <button
                onClick={() => navigate(`/event/${event.publicLink}`)}
                className="btn-primary"
              >
                Open Feedback Form
              </button>
            </div>
          ))}
          {!events.length ? <p className="text-gray-600">No events available.</p> : null}
        </div>
      </div>
    </div>
  );
}
