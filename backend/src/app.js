const express = require("express");
const cors = require("cors");
const experimentRoutes = require("./routes/experimentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

// Routes
app.use("/experiments", experimentRoutes);

module.exports = app;
