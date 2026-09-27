const express = require("express");
const request = require("supertest");
const {
  loginRateLimiter,
  registrationRateLimiter,
  resetAuthRateLimits,
} = require("../../../src/middleware/authRateLimit");

function makeApp(path, limiter) {
  const app = express();
  app.post(path, limiter, (req, res) => res.status(401).json({ message: "Invalid credentials" }));
  return app;
}

describe("authentication rate limits", () => {
  beforeEach(resetAuthRateLimits);
  afterEach(resetAuthRateLimits);

  test("allows five login attempts, then blocks the sixth with 429 and Retry-After", async () => {
    const app = makeApp("/login", loginRateLimiter);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request(app).post("/login");
      expect(response.status).toBe(401);
    }

    const blocked = await request(app).post("/login");
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
    expect(blocked.body.message).toMatch(/Too many login attempts/);
  });

  test("allows three registrations, then blocks the fourth", async () => {
    const app = makeApp("/register", registrationRateLimiter);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      expect((await request(app).post("/register")).status).toBe(401);
    }

    const blocked = await request(app).post("/register");
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many registration attempts/);
  });

  test("shares the login limit between the current and legacy auth URLs", async () => {
    const app = express();
    app.post("/api/auth/login", loginRateLimiter, (req, res) => res.sendStatus(401));
    app.post("/auth/login", loginRateLimiter, (req, res) => res.sendStatus(401));

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const path = attempt % 2 ? "/api/auth/login" : "/auth/login";
      expect((await request(app).post(path)).status).toBe(401);
    }
    expect((await request(app).post("/auth/login")).status).toBe(429);
  });
});
