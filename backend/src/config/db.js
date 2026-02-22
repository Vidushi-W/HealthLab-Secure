const mongoose = require("mongoose");
const dns = require("dns");

// Optional: helps in some networks/DNS issues
dns.setServers(["1.1.1.1", "8.8.8.8"]);

/**
 * Establishment of MongoDB connection with robust event monitoring.
 */
const connectDB = async () => {
  const connString = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!connString) {
    console.error("❌ FATAL: Neither MONGODB_URI nor MONGO_URI found in .env");
    process.exit(1);
  }

  // Monitor connection states
  mongoose.connection.on("connecting", () => {
    console.log("⏳ MongoDB: Connecting...");
  });

  mongoose.connection.on("connected", () => {
    const host = mongoose.connection.host;
    const dbName = mongoose.connection.name;
    console.log(`✅ MongoDB: Connected to ${host} (DB: ${dbName})`);
  });

  mongoose.connection.on("error", (err) => {
    console.error(`❌ MongoDB: Connection Error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB: Disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("🔄 MongoDB: Reconnected");
  });

  try {
    // Explicitly disable buffering to ensure route handlers fail fast if DB is down
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(connString, {
      dbName: process.env.MONGO_DB_NAME || "af_project_db",
      serverSelectionTimeoutMS: 5000,
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB: Initial connection failed: ${error.message}`);
    throw error; // Let server.js handle the fatal exit
  }
};

module.exports = connectDB;
