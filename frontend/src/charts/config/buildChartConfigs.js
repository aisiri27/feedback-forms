import {
  getAverageRatingsPerEvent,
  getKeyValueData,
  getRatingCounts,
  getRecommendationCounts,
} from "../transformers/analyticsTransformers";

export function buildAnalyticsChartConfigs(apiData) {
  const safeData = apiData || {};
  const ratingCounts = getRatingCounts(safeData.ratings);
  const [yesCount, noCount] = getRecommendationCounts(safeData.recommend);
  const { eventNames, averages } = getAverageRatingsPerEvent(safeData.ratingsPerEvent);
  const improvementData = getKeyValueData(safeData.improvementCategories);
  const responseData = getKeyValueData(safeData.responsesPerEvent);

  return {
    ratingChart: {
      type: "bar",
      data: {
        labels: ["1 Star", "2 Star", "3 Star", "4 Star", "5 Star"],
        datasets: [
          {
            label: "Number of Ratings",
            data: ratingCounts,
            backgroundColor: "#2f80ed",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Overall Rating Distribution" } },
        scales: { y: { beginAtZero: true } },
      },
    },
    recommendChart: {
      type: "doughnut",
      data: {
        labels: ["Recommend", "Not Recommend"],
        datasets: [
          {
            data: [yesCount, noCount],
            backgroundColor: ["#27ae60", "#eb5757"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Would users recommend this?" } },
      },
    },
    avgRatingChart: {
      type: "bar",
      data: {
        labels: eventNames,
        datasets: [
          {
            label: "Average Rating",
            data: averages,
            backgroundColor: "#56ccf2",
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Average Rating per Event/Course" } },
        scales: { x: { min: 0, max: 5 } },
      },
    },
    categoryChart: {
      type: "bar",
      data: {
        labels: improvementData.labels,
        datasets: [
          {
            label: "Number of Mentions",
            data: improvementData.values,
            backgroundColor: "#f2994a",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "What Needs Improvement?" } },
        scales: { y: { beginAtZero: true } },
      },
    },
    trendChart: {
      type: "line",
      data: {
        labels: safeData.trendDates || [],
        datasets: [
          {
            label: "Average Rating",
            data: safeData.avgRatingsTrend || [],
            tension: 0.3,
            borderColor: "#9b51e0",
            backgroundColor: "rgba(155, 81, 224, 0.2)",
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Average Rating Trend Over Time" } },
        scales: { y: { min: 0, max: 5 } },
      },
    },
    responseChart: {
      type: "bar",
      data: {
        labels: responseData.labels,
        datasets: [
          {
            label: "Number of Responses",
            data: responseData.values,
            backgroundColor: "#6fcf97",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: "Responses per Event/Course" } },
        scales: { y: { beginAtZero: true } },
      },
    },
  };
}
