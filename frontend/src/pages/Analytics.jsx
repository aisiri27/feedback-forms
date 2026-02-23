import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

function SentimentGauge({ score = 50 }) {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const angle = Math.round((safe / 100) * 360);
  return (
    <div className="gauge-wrap">
      <div
        className="gauge-ring"
        style={{ background: `conic-gradient(#2f73ff ${angle}deg, rgba(180, 198, 240, 0.28) ${angle}deg)` }}
      >
        <div className="gauge-inner">
          <p className="gauge-score">{safe}</p>
          <p className="gauge-label">Sentiment</p>
        </div>
      </div>
    </div>
  );
}

function DistributionChart({ distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }) {
  const max = Math.max(1, ...Object.values(distribution));
  return (
    <div className="dist-bars">
      {[1, 2, 3, 4, 5].map((star) => {
        const value = distribution[star] || 0;
        return (
          <div key={star} className="dist-bar-item" title={`${star} stars: ${value}`}>
            <div className="dist-track">
              <div className="dist-fill" style={{ height: `${(value / max) * 100}%` }} />
            </div>
            <p className="dist-label">{star}</p>
            <p className="dist-value">{value}</p>
          </div>
        );
      })}
    </div>
  );
}

function YesNoSplit({ split = { Yes: 0, No: 0 } }) {
  const yes = split.Yes || 0;
  const no = split.No || 0;
  const total = Math.max(1, yes + no);
  const yesPct = (yes / total) * 100;
  return (
    <div>
      <div className="split-row">
        <span>Yes {yes}</span>
        <span>No {no}</span>
      </div>
      <div className="split-track">
        <div className="split-yes" style={{ width: `${yesPct}%` }} />
      </div>
    </div>
  );
}

function TrendSparkline({ trend = [] }) {
  const points = Array.isArray(trend) ? trend : [];
  if (!points.length) return <p className="text-sm text-gray-600">No trend data yet.</p>;

  const width = 380;
  const height = 120;
  const pad = 12;
  const maxY = Math.max(1, ...points.map((p) => p.count || 0));
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const path = points.map((p, i) => {
    const x = pad + i * step;
    const y = height - pad - ((p.count || 0) / maxY) * (height - pad * 2);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(47,115,255,0.34)" />
            <stop offset="100%" stopColor="rgba(47,115,255,0.04)" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="#2f73ff" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="trend-labels">
        <span>{points[0].date}</span>
        <span>{points[points.length - 1].date}</span>
      </div>
    </div>
  );
}

function QuestionCard({ question }) {
  if (!question) return null;
  return (
    <div className="app-card">
      <h3 className="font-semibold mb-1">{question.title}</h3>
      <p className="text-xs text-gray-500 mb-3">{question.type} | Answers: {question.totalAnswers}</p>

      {question.ratingDistribution ? <DistributionChart distribution={question.ratingDistribution} /> : null}

      {question.choiceCounts ? (
            <div className="space-y-2">
              {Object.entries(question.choiceCounts).map(([label, value]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1"><span>{label}</span><span>{value}</span></div>
                  <div className="h-2 bg-slate-100 rounded">
                    <div className="h-2 bg-[var(--color-primary)] rounded" style={{ width: `${(value / Math.max(1, ...Object.values(question.choiceCounts))) * 100}%` }} />
                  </div>
                </div>
              ))}
        </div>
      ) : null}

      {question.textResponses?.length ? (
        <div className="space-y-2">
          {question.textResponses.slice(0, 4).map((txt, idx) => (
            <p key={`${question.questionId}-${idx}`} className="analytics-quote">{txt}</p>
          ))}
        </div>
      ) : null}

      {!question.ratingDistribution && !question.choiceCounts && !question.textResponses?.length ? (
        <p className="text-sm text-gray-600">No answers yet.</p>
      ) : null}
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const params = useParams();
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(params.id || "");
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");

  useEffect(() => {
    const loadForms = async () => {
      try {
        setIsLoadingForms(true);
        const res = await api.get("/forms");
        const data = Array.isArray(res.data) ? res.data : [];
        setForms(data);
        setSelectedFormId((prev) => prev || (data.length ? String(data[0]._id) : ""));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load forms");
      } finally {
        setIsLoadingForms(false);
      }
    };
    loadForms();
  }, []);

  useEffect(() => {
    if (params.id && params.id !== selectedFormId) {
      setSelectedFormId(params.id);
    }
  }, [params.id, selectedFormId]);

  useEffect(() => {
    if (!selectedFormId) return;
    const loadAnalytics = async () => {
      try {
        setIsLoadingAnalytics(true);
        setError("");
        const res = await api.get(`/forms/${selectedFormId}/analytics`);
        setAnalytics(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setIsLoadingAnalytics(false);
      }
    };
    loadAnalytics();
  }, [selectedFormId]);

  useEffect(() => {
    const first = analytics?.questions?.[0]?.questionId || "";
    setSelectedQuestionId((prev) => prev || first);
  }, [analytics]);

  const selectedTitle = useMemo(
    () => forms.find((f) => String(f._id) === String(selectedFormId))?.title || analytics?.formTitle || "Form",
    [forms, selectedFormId, analytics]
  );

  const selectedQuestion = useMemo(
    () => (analytics?.questions || []).find((q) => q.questionId === selectedQuestionId) || analytics?.questions?.[0],
    [analytics, selectedQuestionId]
  );

  const insights = analytics?.insights || {
    sentimentScore: 50,
    highlights: [],
    improvementAreas: [],
    summary: "No insights yet.",
  };

  return (
    <div className="analytics-shell">
      <div className="analytics-bg-orb analytics-bg-orb-a" />
      <div className="analytics-bg-orb analytics-bg-orb-b" />
      <div className="analytics-bg-orb analytics-bg-orb-c" />

      <div className="max-w-6xl mx-auto relative z-10 px-4 py-8">
        <div className="top-nav-glass rounded-2xl px-4 py-3 mb-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{selectedTitle}</h1>
            <p className="text-[var(--color-text-secondary)]">LumaForms interactive analytics</p>
          </div>
          <button onClick={() => navigate("/")} className="btn-secondary">Dashboard</button>
        </div>

        <div className="analytics-glass-panel mb-5">
          {isLoadingForms ? <p>Loading forms...</p> : null}
          {!isLoadingForms && forms.length ? (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Form</label>
              <select
                value={selectedFormId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedFormId(nextId);
                  navigate(`/analytics/${nextId}`);
                }}
                className="input-base max-w-sm"
              >
                {forms.map((form) => (
                  <option key={form._id} value={form._id}>{form.title}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="analytics-tab-row mb-5">
          {[
            { id: "overview", label: "Overview" },
            { id: "questions", label: "Question Explorer" },
            { id: "insights", label: "Text Insights" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "analytics-tab analytics-tab-active" : "analytics-tab"}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? <p className="error-message mb-4">{error}</p> : null}
        {isLoadingAnalytics ? <p>Loading analytics...</p> : null}

        {analytics && activeTab === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="analytics-glass-panel lg:col-span-4">
              <p className="analytics-card-title">Sentiment Gauge</p>
              <SentimentGauge score={insights.sentimentScore} />
              <p className="text-sm text-[var(--color-text-secondary)] mt-3">{insights.summary}</p>
            </div>
            <div className="analytics-glass-panel lg:col-span-8">
              <p className="analytics-card-title">Response Trend</p>
              <TrendSparkline trend={analytics.visualization?.submissionTrend} />
            </div>
            <div className="analytics-glass-panel lg:col-span-6">
              <p className="analytics-card-title">Rating Distribution</p>
              <DistributionChart distribution={analytics.visualization?.overallRatingDistribution} />
            </div>
            <div className="analytics-glass-panel lg:col-span-6 space-y-4">
              <div>
                <p className="analytics-card-title">Recommendation Split</p>
                <YesNoSplit split={analytics.visualization?.yesNoSplit} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="mini-metric">
                  <p className="mini-label">Total Responses</p>
                  <p className="mini-value">{analytics.totalResponses}</p>
                </div>
                <div className="mini-metric">
                  <p className="mini-label">Average Rating</p>
                  <p className="mini-value">{analytics.averageRating || 0}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {analytics && activeTab === "questions" ? (
          <div className="space-y-4">
            <div className="analytics-glass-panel">
              <p className="analytics-card-title mb-3">Select Question</p>
              <div className="flex flex-wrap gap-2">
                {(analytics.questions || []).map((question, idx) => (
                  <button
                    key={question.questionId}
                    type="button"
                    onClick={() => setSelectedQuestionId(question.questionId)}
                    className={selectedQuestionId === question.questionId ? "analytics-chip analytics-chip-active" : "analytics-chip"}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
            </div>
            <QuestionCard question={selectedQuestion} />
          </div>
        ) : null}

        {analytics && activeTab === "insights" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="analytics-glass-panel">
              <p className="analytics-card-title mb-3">Highlights</p>
              {insights.highlights?.length ? (
                <div className="space-y-2">
                  {insights.highlights.map((item) => <p key={item} className="analytics-pill">+ {item}</p>)}
                </div>
              ) : <p className="text-sm text-gray-600">No repeated strengths yet.</p>}
            </div>
            <div className="analytics-glass-panel">
              <p className="analytics-card-title mb-3">Improvement Areas</p>
              {insights.improvementAreas?.length ? (
                <div className="space-y-2">
                  {insights.improvementAreas.map((item) => <p key={item} className="analytics-pill">- {item}</p>)}
                </div>
              ) : <p className="text-sm text-gray-600">No repeated issues yet.</p>}
            </div>
            <div className="analytics-glass-panel md:col-span-2">
              <p className="analytics-card-title mb-3">Recent Comments</p>
              {analytics.visualization?.recentTextResponses?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analytics.visualization.recentTextResponses.map((txt, idx) => (
                    <p key={`recent-${idx}`} className="analytics-quote">{txt}</p>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-600">No text responses yet.</p>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
