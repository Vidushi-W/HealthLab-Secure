/**
 * In-process rate limiting for public authentication endpoints.
 *
 * This protects login credentials and registration endpoints from automated
 * abuse before validation, database queries, or password comparisons occur.
 * Use a shared store (for example Redis) when the application is deployed on
 * more than one server instance.
 */
const buckets = new Map();

function clientKey(req) {
  // Express normalises req.ip; do not enable trust proxy unless the deployed
  // reverse proxy is explicitly configured as trusted in app.js.
  return req.ip || req.socket.remoteAddress || "unknown";
}

function createRateLimiter({ keyPrefix, windowMs, max, message }) {
  return (req, res, next) => {
    const now = Date.now();
    // A stable control name prevents bypassing a limit by switching between
    // the legacy /auth and current /api/auth route mounts.
    const key = `${keyPrefix}:${clientKey(req)}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        message,
        retryAfter,
      });
    }

    current.count += 1;
    return next();
  };
}

const loginRateLimiter = createRateLimiter({
  keyPrefix: "login",
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

const googleAuthRateLimiter = createRateLimiter({
  keyPrefix: "google-auth",
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many Google sign-in attempts. Please try again in 15 minutes.",
});

const registrationRateLimiter = createRateLimiter({
  keyPrefix: "registration",
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many registration attempts. Please try again in one hour.",
});

// Exported for deterministic automated tests only; it is not mounted as a route.
function resetAuthRateLimits() {
  buckets.clear();
}

module.exports = {
  createRateLimiter,
  loginRateLimiter,
  googleAuthRateLimiter,
  registrationRateLimiter,
  resetAuthRateLimits,
};
