/**
 * Prevent this application's responses from being rendered inside another
 * site's frame. CSP is the modern control; X-Frame-Options supports older
 * clients that do not enforce CSP frame-ancestors.
 */
function frameGuard(req, res, next) {
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
  res.setHeader("X-Frame-Options", "DENY");
  next();
}

module.exports = frameGuard;
