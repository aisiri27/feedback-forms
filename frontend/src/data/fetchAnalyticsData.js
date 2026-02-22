function normalizeAnalyticsPayload(payload) {
  return {
    ratings: payload?.ratings ?? [],
    recommend: payload?.recommend ?? [],
    ratingsPerEvent: payload?.ratingsPerEvent ?? {},
    improvementCategories: payload?.improvementCategories ?? {},
    trendDates: payload?.trendDates ?? [],
    avgRatingsTrend: payload?.avgRatingsTrend ?? [],
    responsesPerEvent: payload?.responsesPerEvent ?? {},
  };
}

export async function fetchAnalyticsOverview({ signal } = {}) {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
    /\/$/,
    ""
  );
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT || "/api/analytics/overview";
  const response = await fetch(`${apiBase}${endpoint}`, { signal });

  if (!response.ok) {
    throw new Error(`Analytics request failed: ${response.status}`);
  }

  const payload = await response.json();
  return normalizeAnalyticsPayload(payload);
}
