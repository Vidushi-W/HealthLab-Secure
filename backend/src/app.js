const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");
const dbReadyMiddleware = require("./middlewares/dbReadyMiddleware");

// Route imports
const experimentRoutes = require("./routes/experimentRoutes");
const authRoutes = require("./routes/authRoutes");
const fundRequestRoutes = require("./routes/fundRequestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contributionRoutes = require("./routes/contributionRoutes");

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// 📊 Health check (Accessible even if DB is down)
app.get("/health", (req, res) => {
  const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
  res.status(200).json({
    status: "ok",
    api: "HealthLab Fund Management API",
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
app.use("/experiments", experimentRoutes); // Backward compatibility
app.use("/api/fund-requests", fundRequestRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/admin", adminRoutes);

// 🛑 Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
