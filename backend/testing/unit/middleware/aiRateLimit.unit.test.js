const express = require("express");
const request = require("supertest");
const {
  aiRateLimiter,
  resetAiRateLimits,
  MAX_AI_REQUESTS,
} = require("../../../src/middleware/aiRateLimit");

function makeApp() {
  const app = express();
  app.use((req, res, next) => {
    req.user = { _id: req.get("x-test-user") || "user-a" };
    next();
  });
  app.post("/chat", aiRateLimiter, (req, res) => res.sendStatus(200));
  app.post("/summary", aiRateLimiter, (req, res) => res.sendStatus(200));
  return app;
}

describe("per-user AI request limit", () => {
  beforeEach(resetAiRateLimits);
  afterEach(resetAiRateLimits);

  test("blocks a user's request above the shared AI quota", async () => {
    const app = makeApp();
    for (let i = 0; i < MAX_AI_REQUESTS; i += 1) {
      expect((await request(app).post("/chat")).status).toBe(200);
    }
    const blocked = await request(app).post("/summary");
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
    expect(blocked.body.message).toMatch(/AI request limit reached/);
  });

  test("does not let one user consume another user's quota", async () => {
    const app = makeApp();
    for (let i = 0; i < MAX_AI_REQUESTS; i += 1) {
      await request(app).post("/chat").set("x-test-user", "user-a");
    }
    expect((await request(app).post("/chat").set("x-test-user", "user-b")).status).toBe(200);
  });
});
