const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");
const store = require("../lib/inMemoryStore");

function auth() {
  return { Authorization: "Bearer demo-token" };
}

function resetStore() {
  store.users.length = 0;
  store.forms.length = 0;
  store.responses.length = 0;
  store.events.length = 0;
  store.eventFeedback.length = 0;
}

test.beforeEach(() => {
  resetStore();
});

test("POST /forms/generate-from-prompt returns deterministic structure", async () => {
  const res = await request(app)
    .post("/forms/generate-from-prompt")
    .set(auth())
    .send({ prompt: "AI Bootcamp student feedback" });

  assert.equal(res.status, 200);
  assert.ok(res.body.title.includes("Feedback Form"));
  assert.ok(Array.isArray(res.body.questions));
  assert.ok(res.body.questions.length >= 5);
  assert.equal(res.body.questions[0].type, "rating");
});

test("unpublished form is blocked publicly, published form is accessible", async () => {
  const createRes = await request(app)
    .post("/forms")
    .set(auth())
    .send({
      title: "Course Form",
      questions: [{ title: "Rate", type: "rating", required: true, options: [] }],
      status: "draft",
    });
  assert.equal(createRes.status, 201);
  const formId = createRes.body._id;

  const draftPublic = await request(app).get(`/forms/${formId}`);
  assert.equal(draftPublic.status, 403);

  const publishRes = await request(app)
    .post(`/forms/${formId}/publish`)
    .set(auth());
  assert.equal(publishRes.status, 200);

  const livePublic = await request(app).get(`/forms/${formId}`);
  assert.equal(livePublic.status, 200);
  assert.equal(livePublic.body.status, "published");
});

test("POST /responses validates identity mode and named respondent", async () => {
  const createRes = await request(app)
    .post("/forms")
    .set(auth())
    .send({
      title: "Identity Form",
      status: "published",
      questions: [{ title: "Rate", type: "rating", required: true, options: [] }],
    });
  const formId = createRes.body._id;

  const invalidNamed = await request(app)
    .post(`/responses/${formId}`)
    .send({
      identity: { mode: "named", respondentName: "" },
      answers: [{ questionId: createRes.body.questions[0]._id, answer: 5 }],
    });
  assert.equal(invalidNamed.status, 400);

  const validNamed = await request(app)
    .post(`/responses/${formId}`)
    .send({
      identity: { mode: "named", respondentName: "Hari" },
      answers: [{ questionId: createRes.body.questions[0]._id, answer: 5 }],
    });
  assert.equal(validNamed.status, 201);
});

test("GET /forms/:id/analytics returns visualization + insights blocks", async () => {
  const createRes = await request(app)
    .post("/forms")
    .set(auth())
    .send({
      title: "Analytics Form",
      status: "published",
      questions: [
        { title: "Rate", type: "rating", required: true, options: [] },
        { title: "Recommend?", type: "yes_no", required: true, options: [] },
        { title: "Comment", type: "paragraph", required: false, options: [] },
      ],
    });

  const formId = createRes.body._id;
  const [q1, q2, q3] = createRes.body.questions;

  const submit = (identity, answers) =>
    request(app).post(`/responses/${formId}`).send({ identity, answers });

  const r1 = await submit(
    { mode: "anonymous" },
    [
      { questionId: q1._id, answer: 5 },
      { questionId: q2._id, answer: "Yes" },
      { questionId: q3._id, answer: "Great instructor and practical examples" },
    ]
  );
  assert.equal(r1.status, 201);

  const r2 = await submit(
    { mode: "anonymous" },
    [
      { questionId: q1._id, answer: 4 },
      { questionId: q2._id, answer: "No" },
      { questionId: q3._id, answer: "Need more practice time" },
    ]
  );
  assert.equal(r2.status, 201);

  const analyticsRes = await request(app)
    .get(`/forms/${formId}/analytics`)
    .set(auth());
  assert.equal(analyticsRes.status, 200);
  assert.equal(analyticsRes.body.totalResponses, 2);
  assert.ok(analyticsRes.body.visualization);
  assert.ok(analyticsRes.body.visualization.overallRatingDistribution);
  assert.ok(Array.isArray(analyticsRes.body.visualization.submissionTrend));
  assert.ok(analyticsRes.body.insights);
  assert.ok(typeof analyticsRes.body.insights.summary === "string");
});
