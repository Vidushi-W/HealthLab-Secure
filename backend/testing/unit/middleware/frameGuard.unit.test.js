const express = require("express");
const request = require("supertest");
const frameGuard = require("../../../src/middleware/frameGuard");

test("frame guard sends CSP frame-ancestors and X-Frame-Options DENY", async () => {
  const app = express();
  app.use(frameGuard);
  app.get("/", (req, res) => res.json({ ok: true }));

  const response = await request(app).get("/");
  expect(response.headers["content-security-policy"]).toBe("frame-ancestors 'none'");
  expect(response.headers["x-frame-options"]).toBe("DENY");
});
