import assert from "node:assert/strict";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import "chromedriver";

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:4173";

const EXPECTED_CHART_IDS = [
  "ratingChart",
  "recommendChart",
  "avgRatingChart",
  "categoryChart",
  "trendChart",
  "responseChart",
];

async function testDashboardTitle(driver) {
  const title = await driver.findElement(By.css('[data-testid="dashboard-title"]')).getText();
  assert.equal(title, "Feedback Analytics Dashboard");
}

async function testAllChartCardsRender(driver) {
  const cards = await driver.findElements(By.css('[data-testid^="chart-card-"]'));
  assert.equal(cards.length, EXPECTED_CHART_IDS.length, "Expected exactly 6 chart cards");

  for (const id of EXPECTED_CHART_IDS) {
    const card = await driver.findElement(By.css(`[data-testid="chart-card-${id}"]`));
    assert.ok(await card.isDisplayed(), `Chart card ${id} should be visible`);
  }
}

async function testAllChartCanvasesRender(driver) {
  for (const id of EXPECTED_CHART_IDS) {
    const canvas = await driver.findElement(By.css(`[data-testid="chart-canvas-${id}"]`));
    assert.ok(await canvas.isDisplayed(), `Canvas ${id} should be visible`);

    const hasDimensions = await driver.executeScript(
      "const el = arguments[0]; return el.width > 0 && el.height > 0;",
      canvas
    );

    assert.equal(hasDimensions, true, `Canvas ${id} should have non-zero dimensions`);
  }
}

async function testMetricCardsRender(driver) {
  const totalResponses = await driver
    .findElement(By.css('[data-testid="metric-total-responses"] p'))
    .getText();
  const avgRating = await driver
    .findElement(By.css('[data-testid="metric-average-rating"] p'))
    .getText();

  assert.ok(Number(totalResponses) > 0, "Total responses should be greater than 0");
  assert.ok(Number(avgRating) > 0, "Average rating should be greater than 0");
}

async function run() {
  const options = new chrome.Options().addArguments(
    "--headless=new",
    "--disable-gpu",
    "--window-size=1440,1200"
  );

  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

  try {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('[data-testid="dashboard-title"]')), 15000);

    await testDashboardTitle(driver);
    await testMetricCardsRender(driver);
    await testAllChartCardsRender(driver);
    await testAllChartCanvasesRender(driver);

    console.log("Selenium e2e: all dashboard tests passed.");
  } finally {
    await driver.quit();
  }
}

run().catch((error) => {
  console.error("Selenium e2e failed:", error);
  process.exit(1);
});
