const mongoose = require("mongoose");

const DB_NAME = "af_project_db";
let dbInstance = null;

/**
 * Single MongoDB connection to af_project_db.
 * All models are registered on this connection.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGO_DB_NAME || DB_NAME;

  if (!uri) throw new Error("MONGODB_URI missing");

  console.log(`⏳ MongoDB: Connecting to ${uri}...`);

  try {
    // Build URI with dbName: replace existing path (db name) to avoid double db name
    const queryIdx = uri.indexOf("?");
    const queryPart = queryIdx >= 0 ? uri.slice(queryIdx) : "";
    const withoutQuery = queryIdx >= 0 ? uri.slice(0, queryIdx) : uri;
    const lastSlash = withoutQuery.lastIndexOf("/");
    const beforePath =
      lastSlash > 0 ? withoutQuery.slice(0, lastSlash + 1) : withoutQuery.replace(/\/+$/, "") + "/";
    const finalUri = beforePath + dbName + queryPart;
    console.log(`🔌 Mongoose: Connecting to ${finalUri.replace(/:([^:@]+)@/, ":****@")}...`);
    await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 15000,
    });
    dbInstance = mongoose.connection.useDb(dbName, { useCache: true });
    console.log(`✅ MongoDB: Connected to ${dbName} (single database)`);
    return dbInstance;
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    throw error;
  }
};

/** @returns {mongoose.mongo.MongoClient} Mongoose connection useDb(af_project_db) */
function getDb() {
  const dbName = process.env.MONGO_DB_NAME || DB_NAME;
  return dbInstance || mongoose.connection.useDb(dbName, { useCache: true });
}

module.exports = {
  connectDB,
  get db() {
    return getDb();
  },
};
