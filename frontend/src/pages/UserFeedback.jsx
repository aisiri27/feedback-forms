import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function UserFeedback() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/forms/published");
        setForms(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load published forms");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Feedback Portal</h1>
          <button onClick={() => navigate("/")} className="btn-secondary">
            Admin
          </button>
        </div>

        {isLoading && <p>Loading published forms...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((form) => (
              <div key={form._id} className="app-card">
                <h2 className="font-semibold">{form.title}</h2>
                <p className="text-sm text-gray-600 mb-3">{form.description}</p>
                <p className="text-xs text-gray-500 mb-4">Questions: {form.questionCount || 0}</p>
                <button
                  onClick={() => navigate(`/public/${form._id}`)}
                  className="btn-primary"
                >
                  Give Feedback
                </button>
              </div>
            ))}
            {!forms.length && <p className="text-gray-600">No published forms yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
