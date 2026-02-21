const express = require("express");
const cors = require("cors");
const experimentRoutes = require("./routes/experimentRoutes");
const authRoutes = require("./routes/authRoutes");
const fundRequestRoutes = require("./routes/fundRequestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contributionRoutes = require("./routes/contributionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/experiments", experimentRoutes); // Kept for backward compatibility
app.use("/api/fund-requests", fundRequestRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;
