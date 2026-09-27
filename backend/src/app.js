const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const csrfGuard = require("./middleware/csrfGuard");
const mongoose = require("mongoose");

// Middleware imports
const { optionalAuth } = require("./middleware/authMiddleware");
const researcherApprovedForPublish = require("./middleware/researcherApproved");
const { extractUserFromHeader } = require("./middleware/rbacMiddleware");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const dbReadyMiddleware = require("./middleware/dbReadyMiddleware");
const frameGuard = require("./middleware/frameGuard");

// Route imports
const authRoutes = require("./routes/authRoutes");
const experimentRoutes = require("./routes/experimentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const coResearcherRoutes = require("./routes/coResearcherRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const participationRoutes = require("./routes/participationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const externalRoutes = require("./routes/externalRoutes");
const fundRequestRoutes = require("./routes/fundRequestRoutes");
const contributionRoutes = require("./routes/contributionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const communityRoutes = require("./modules/community/communityRoutes");

const app = express();

// Prevent clickjacking of backend-rendered/static responses and API pages.
app.use(frameGuard);

const allowedOrigins = [
  "http://localhost:5173",
  "https://health-lab-black.vercel.app",
];

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server calls and local tools that don't send an Origin header.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(csrfGuard);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📝 Debug Logger
app.use((req, res, next) => {
  console.log(`📡 [API Log] ${req.method} ${req.url}`);
  next();
});



// V4 fix: researcher identity documents are not public files.
// Images and PDFs in uploads/affiliation-proofs used to be served by the
// static /uploads folder below. Anyone who knew or guessed
// /uploads/affiliation-proofs/<file> could open a researcher's identity
// document with no login. This route is registered first, so that address
// now returns 401. An admin opens the same file through
// GET /api/admin/affiliation-proofs/:filename, which requires an admin token.
app.use("/uploads/affiliation-proofs", (req, res) => {
  res.status(401).json({ message: "Researcher identity documents are not public." });
});

const SAFE_UPLOAD_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"]);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  setHeaders(res, filePath) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    const ext = path.extname(filePath).toLowerCase();
    if (!SAFE_UPLOAD_EXTENSIONS.has(ext)) {
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", "attachment");
    }
  },
}));

// 📊 Health check
app.get("/health", (req, res) => {
  const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
  res.status(200).json({
    status: "ok",
    api: "HealthLab Backend API",
    database: states[mongoose.connection.readyState],
    dbCode: mongoose.connection.readyState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 🛡️ Database Readiness Guard - Applied to all API routes
app.use("/api", dbReadyMiddleware);

// 🚀 Routes
app.use("/api/auth", authRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/experiments", experimentRoutes);
app.use("/api/participations", participationRoutes);
app.use("/api/fund-requests", fundRequestRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/posts", communityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/reviews", reviewRoutes);

// Backward compatibility or direct routes
app.use("/experiments", experimentRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/reviews", reviewRoutes);

// IMPORTANT: Mount before /experiments if necessary
app.use("/experiments/:experimentId/co-researchers", coResearcherRoutes);

// 🛑 Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
