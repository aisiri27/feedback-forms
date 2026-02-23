import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";

function DistributionBars({ distribution }) {
  const max = Math.max(1, ...Object.values(distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }));
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const value = distribution?.[star] || 0;
        return (
          <div key={star}>
            <div className="flex justify-between text-sm">
              <span>{star} Star</span>
              <span>{value}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-2 bg-[var(--color-primary)] rounded" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EventAnalyticsDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  const selectedEventId = searchParams.get("eventId") || "";

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await api.get("/api/events/mine");
        const data = Array.isArray(res.data) ? res.data : [];
        setEvents(data);
        if (!selectedEventId && data.length) {
          setSearchParams({ eventId: data[0]._id });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load events");
      }
    };
    loadEvents();
  }, [selectedEventId, setSearchParams]);

  useEffect(() => {
    if (!selectedEventId) return;
    const loadAnalytics = async () => {
      try {
        setError("");
        const res = await api.get(`/api/events/${selectedEventId}/analytics`);
        setAnalytics(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analytics");
      }
    };
    loadAnalytics();
  }, [selectedEventId]);

  const selectedTitle = useMemo(
    () => events.find((e) => String(e._id) === String(selectedEventId))?.title || "Event",
    [events, selectedEventId]
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Event Analytics Dashboard</h1>
          <button className="btn-secondary" onClick={() => navigate("/events/admin")}>
            Admin
          </button>
        </div>

        {events.length ? (
          <div className="mb-4">
            <label className="text-sm mr-2">Select Event:</label>
            <select
              className="input-base max-w-sm"
              value={selectedEventId}
              onChange={(e) => setSearchParams({ eventId: e.target.value })}
            >
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {error ? <p className="text-red-600 mb-4">{error}</p> : null}

        {analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="app-card">
              <h2 className="font-semibold mb-2">{selectedTitle}</h2>
              <p>Total Responses: {analytics.totalResponses}</p>
              <p>Average Rating: {analytics.averageRating}</p>
            </div>
            <div className="app-card">
              <h2 className="font-semibold mb-2">Rating Distribution</h2>
              <DistributionBars distribution={analytics.ratingDistribution} />
            </div>
            <div className="app-card md:col-span-2">
              <h2 className="font-semibold mb-2">Recent Optional Text Feedback</h2>
              {analytics.comments?.length ? (
                <ul className="space-y-2">
                  {analytics.comments.map((c, i) => (
                    <li key={`${c.submittedAt}-${i}`} className="border rounded p-2">
                      <p className="text-sm">Rating: {c.rating}</p>
                      <p className="text-sm text-gray-700">{c.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">No text feedback yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
