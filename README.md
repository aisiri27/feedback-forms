# Feedback Forms (MERN Stack)

Full-stack feedback collection system for events/courses with Google login, public submissions, MongoDB storage, and per-event analytics dashboards.

## Project Scope

- Google OAuth login
- Logged-in users can create Events/Courses
- Each Event has a Feedback Form
- Questions support ratings (core) + optional text
- Public feedback submission links
- Secure MongoDB storage
- Per-event dashboard with:
- average rating
- total responses
- rating distribution charts

## Role Distribution (5 Members)

1. Frontend Engineer (Form Builder + Submission)
- Auth-aware UI states
- Event creation/list UI
- Feedback form builder (rating + optional text + required toggle)
- Public submission page and validation

2. Backend Engineer (API + Business Logic)
- REST endpoints for events/forms/responses
- Ownership/permission checks
- Validation and middleware-based security
- API documentation

3. Database Engineer (MongoDB + Data Modeling)
- Schemas/relationships for users/events/forms/questions/responses
- Indexing and aggregation optimization
- Data integrity and timestamped records

4. Auth & Deployment Engineer
- Google OAuth integration
- Route protection and session/token handling
- Frontend/backend deployment and env setup

5. Analytics & Dashboard Engineer
- Dashboard metrics (total responses, average rating, distribution)
- Chart implementation and empty-state handling
- Raw response to chart-ready transformation

## Current Analytics Work (Completed)

Your implemented analytics layer includes:

- Dashboard UI with metric cards + chart grid:
- `src/components/analytics/AnalyticsDashboard.jsx`
- Chart rendering lifecycle:
- `src/charts/render/renderCharts.js`
- Chart configuration builder:
- `src/charts/config/buildChartConfigs.js`
- Analytics data transforms:
- `src/charts/transformers/analyticsTransformers.js`
- Metric transforms:
- `src/charts/transformers/metricsTransformers.js`
- Chart layout constants:
- `src/charts/constants/chartLayout.js`
- Barrel exports:
- `src/charts/index.js`
- Dummy dataset:
- `src/data/dummyAnalyticsData.js`
- API fetch adapter:
- `src/data/fetchAnalyticsData.js`

## Definition of Done Status (Analytics Role)

- Dashboard metrics implemented
- Bar/distribution charts implemented with Chart.js
- Empty state implemented
- Data transformation layer implemented
- Auto-refresh polling and API fallback implemented
- Selenium e2e checks implemented and passing

## API Integration Flow

- `frontend/src/App.jsx` tries to fetch analytics from API.
- If API fails, app falls back to dummy data for uninterrupted frontend work.
- Polling runs every 30 seconds so dashboard can update when new feedback arrives.

Use `.env` when backend is ready:

```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_ANALYTICS_ENDPOINT=/api/analytics/overview
```

## Development Scripts

```bash
cd frontend
npm install
npm run dev
npm run lint
npm run build
npm run test:e2e
```

## Project Structure

```text
frontend/src/
  App.jsx
  App.css
  index.css
  main.jsx
  charts/
  components/
  data/
tests/
  e2e/
```

## Backend Status

- Backend has been restored on `main`.
- Team should continue backend development on `main` to avoid branch split with `master`.
- Quick verification command:
- `git ls-tree -r --name-only origin/main | findstr /i Backend`

## Independent Team Workflow

```
[Auth Engineer] -> Access Control
       |
       v
[Frontend] -> [Backend APIs] -> [MongoDB]
                               |
                               v
                        [Analytics Dashboard]
```

## Selenium Notes

- `npm run test:e2e` launches Vite preview on `http://127.0.0.1:4173`.
- Selenium runs headless Chrome and verifies:
- dashboard heading is visible
- all 6 chart cards render
- all 6 chart canvases are visible and sized
