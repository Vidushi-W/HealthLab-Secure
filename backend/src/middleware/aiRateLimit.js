/**
 * Shared per-user quota for endpoints that invoke paid AI providers.
 *
 * The counter intentionally uses one bucket across AI features, so a user
 * cannot avoid the quota by alternating between chat and Gemini endpoints.
 * Replace this in-memory store with Redis before running multiple instances.
 */
const buckets = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_AI_REQUESTS = 10;

function getUserId(req) {
  const user = req.user;
  return user && (user._id || user.id) ? String(user._id || user.id) : null;
}

function aiRateLimiter(req, res, next) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const now = Date.now();
  const current = buckets.get(userId);
  if (!current || current.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_AI_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({
      success: false,
      message: "AI request limit reached. Please try again later.",
      retryAfter,
    });
  }

  current.count += 1;
  return next();
}

function resetAiRateLimits() {
  buckets.clear();
}

module.exports = { aiRateLimiter, resetAiRateLimits, MAX_AI_REQUESTS, WINDOW_MS };
