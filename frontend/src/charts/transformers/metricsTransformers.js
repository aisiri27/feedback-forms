import { getRatingCounts } from "./analyticsTransformers";

export function buildDashboardMetrics(apiData) {
  const safeData = apiData || {};
  const ratings = Array.isArray(safeData.ratings) ? safeData.ratings : [];
  const totalResponses = ratings.length;

  const averageRating = totalResponses
    ? Number((ratings.reduce((sum, value) => sum + value, 0) / totalResponses).toFixed(2))
    : 0;

  return {
    totalResponses,
    averageRating,
    ratingDistribution: getRatingCounts(ratings),
  };
}

export function hasAnyFeedback(apiData) {
  return buildDashboardMetrics(apiData).totalResponses > 0;
}
