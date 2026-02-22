import Chart from "chart.js/auto";
import { buildAnalyticsChartConfigs } from "../config/buildChartConfigs";

export function renderAnalyticsCharts(apiData, canvasesById) {
  const configs = buildAnalyticsChartConfigs(apiData);
  const charts = [];

  Object.entries(configs).forEach(([id, config]) => {
    const canvas = canvasesById?.[id];
    if (canvas) {
      charts.push(new Chart(canvas, config));
    }
  });

  return () => {
    charts.forEach((chart) => chart.destroy());
  };
}
