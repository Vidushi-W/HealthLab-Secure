const express = require("express");
const cors = require("cors");
const experimentRoutes = require("./routes/experimentRoutes");



const app = express();

app.use(cors());
app.use(express.json());
app.use("/experiments", experimentRoutes);


app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

module.exports = app;
