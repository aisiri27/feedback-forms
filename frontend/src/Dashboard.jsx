import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function statusText(form) {
  if (form.status) return form.status;
  return form.isPublished ? "published" : "draft";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const loadForms = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await api.get("/forms");
      setForms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load forms");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const createForm = async () => {
    navigate("/forms/create");
  };

  const copyPublicLink = async (formId) => {
    try {
      const link = `${window.location.origin}/form/${formId}/public`;
      await navigator.clipboard.writeText(link);
      alert("Public link copied");
    } catch {
      alert("Failed to copy link");
    }
  };

  const deleteForm = async (form) => {
    const title = form?.title || "this form";
    const confirmDelete = window.confirm(`Delete "${title}"? This will also remove all responses.`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/forms/${form._id}`);
      await loadForms();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete form");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="top-nav-glass p-4 flex justify-between items-center">
        <h1 className="text-xl text-[var(--color-text-primary)] brand-mark">
          <span className="brand-dot" />
          LumaForms
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/feedback")} className="btn-secondary text-sm">User Feedback</button>
          <button onClick={() => navigate("/analytics")} className="btn-secondary text-sm">Analytics</button>
          <span className="text-gray-600 hidden md:inline">{user?.name || user?.email}</span>
          <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
        </div>
      </div>

      <div className="app-container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Your Feedback Forms</h2>
            <p className="text-gray-600">Create polished feedback experiences and track engagement.</p>
          </div>
          <button onClick={createForm} className="btn-primary">+ Create New Form</button>
        </div>

        {isLoading && <p>Loading forms...</p>}
        {!isLoading && error && <p className="error-message">{error}</p>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => {
              const status = statusText(form);
              const isPublished = status === "published";
              return (
                <div key={form._id} className="app-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${isPublished ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {status.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-500">Q: {(form.questions || []).length}</p>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{form.title || "Untitled Form"}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {form.description || "No description provided."}
                  </p>

                  <p className="text-sm mb-4">Responses: {form.responseCount || 0}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => navigate(`/form/${form._id}`)} className="btn-secondary">View</button>
                    <button onClick={() => navigate(`/analytics/${form._id}`)} className="btn-primary">Results</button>
                    <button
                      onClick={() => navigate(`/form/${form._id}/public`)}
                      className="btn-secondary"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => copyPublicLink(form._id)}
                      disabled={!isPublished}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => deleteForm(form)}
                      className="btn-danger col-span-2"
                    >
                      Delete Form
                    </button>
                  </div>
                </div>
              );
            })}
            {!forms.length && <p className="text-gray-500">No forms yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
