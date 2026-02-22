import { useEffect, useRef } from "react";
import {
  CHART_LAYOUT,
  buildDashboardMetrics,
  hasAnyFeedback,
  renderAnalyticsCharts,
} from "../../charts";

function AnalyticsDashboard({ data, source }) {
  const chartRefs = useRef({});
  const metrics = buildDashboardMetrics(data);
  const hasFeedback = hasAnyFeedback(data);

  useEffect(() => {
    if (!hasFeedback) return undefined;

    const cleanupCharts = renderAnalyticsCharts(data, chartRefs.current);
    return cleanupCharts;
  }, [data, hasFeedback]);

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <h1 data-testid="dashboard-title">Feedback Analytics Dashboard</h1>
        <p className="source-badge" data-testid="source-badge">
          Data source: {source === "api" ? "Live API" : "Demo"}
        </p>
      </header>

      <div className="metrics-grid" data-testid="metrics-grid">
        <article className="metric-card" data-testid="metric-total-responses">
          <h2>Total Responses</h2>
          <p>{metrics.totalResponses}</p>
        </article>
        <article className="metric-card" data-testid="metric-average-rating">
          <h2>Average Rating</h2>
          <p>{metrics.averageRating}</p>
        </article>
        <article className="metric-card" data-testid="metric-rating-distribution">
          <h2>Rating Distribution</h2>
          <p>{metrics.ratingDistribution.join(" / ")}</p>
        </article>
      </div>

      {hasFeedback ? (
        <div className="chart-grid" data-testid="chart-grid">
          {CHART_LAYOUT.map((chart) => (
            <article
              key={chart.id}
              className="chart-card"
              data-testid={`chart-card-${chart.id}`}
            >
              <h2>{chart.title}</h2>
              <div className="canvas-wrap">
                <canvas
                  data-testid={`chart-canvas-${chart.id}`}
                  ref={(element) => {
                    if (element) chartRefs.current[chart.id] = element;
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state" data-testid="empty-state">
          <h2>No feedback data yet</h2>
          <p>Charts will appear after the first responses are submitted.</p>
        </section>
      )}
    </section>
  );
}

export default AnalyticsDashboard;
