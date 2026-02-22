const mongoose = require("mongoose");
const mongoose = require("mongoose");
const dns = require("dns");

// Optional: helps in some networks/DNS issues
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "af_project_db",
    });
    console.log(`MongoDB connected successfully (DB: ${process.env.MONGO_DB_NAME || "af_project_db"})`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;