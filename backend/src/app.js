const path = require("path");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const experimentRoutes = require("./routes/experimentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const coResearcherRoutes = require("./routes/coResearcherRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const participationRoutes = require("./routes/participationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const externalRoutes = require("./routes/externalRoutes");

const { optionalAuth } = require("./middleware/auth");
const researcherApprovedForPublish = require("./middleware/researcherApproved");
const { extractUserFromHeader } = require("./middleware/rbacMiddleware");
const errorHandler = require("./utils/errorHandler");
const { HTTP_STATUS } = require("./config/constants");

const app = express();

app.use(cors());
app.use(express.json());
// Auth routes
app.use("/api/auth", authRoutes);

// PART B.3: Extract user info from headers (for authentication)
app.use(extractUserFromHeader);

app.use("/api/recommendations", recommendationRoutes);
app.use("/api/experiments", experimentRoutes);
app.use("/api/participations", participationRoutes); Develop_Integration

// Static uploads (friend branch)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// IMPORTANT: Mount before /experiments so /experiments/:experimentId/co-researchers is matched first
app.use("/experiments/:experimentId/co-researchers", coResearcherRoutes);

// Public / health
app.get("/health", (req, res) => {
  res.status(HTTP_STATUS.OK).json({ status: "ok", message: "Backend is running" });
});

// Auth/admin/external (friend branch)
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/external", externalRoutes);

// Experiments (friend branch uses optionalAuth + approval middleware)
app.use(
  "/experiments",
  optionalAuth,
  researcherApprovedForPublish,
  experimentRoutes
);

// Reviews (your branch)
app.use("/reviews", reviewRoutes);

// Global error handler (friend branch)
app.use(errorHandler);

module.exports = app;