const mongoose = require("mongoose");

const DB_NAME = "af_project_db";
let dbInstance = null;

function maskMongoUri(uri) {
  return uri.replace(/:([^:@]+)@/, ":****@");
}

function buildMongoUri(uri, dbName) {
  const queryIdx = uri.indexOf("?");
  const queryPart = queryIdx >= 0 ? uri.slice(queryIdx) : "";
  let baseUri = queryIdx >= 0 ? uri.slice(0, queryIdx) : uri;

  baseUri = baseUri.replace(/\/+$/, "");

  const protocolEnd = baseUri.indexOf("://");
  const firstSlashAfterProtocol = baseUri.indexOf("/", protocolEnd + 3);

  if (firstSlashAfterProtocol === -1) {
    return `${baseUri}/${dbName}${queryPart}`;
  }

  return `${baseUri.slice(0, firstSlashAfterProtocol + 1)}${dbName}${queryPart}`;
}

function getConnectionHint(error, uri) {
  if (error.code === "ENOTFOUND" && error.syscall === "querySrv") {
    return [
      "MongoDB Atlas SRV DNS lookup failed.",
      `The cluster host in MONGODB_URI could not be resolved: ${error.hostname}.`,
      "Copy a fresh Drivers connection string from MongoDB Atlas and update backend/.env.",
      `Current URI: ${maskMongoUri(uri)}`,
    ].join(" ");
  }

  return error.message;
}

/**
 * Single MongoDB connection to af_project_db.
 * All models are registered on this connection.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || DB_NAME;

  if (!uri) throw new Error("MONGODB_URI or MONGO_URI missing");

  console.log(`Mongoose: Input URI from env: ${maskMongoUri(uri)}`);
  console.log(`MongoDB: Connecting to ${maskMongoUri(uri)}...`);

  try {
    const finalUri = buildMongoUri(uri, dbName);
    console.log(`Mongoose: Final connection string: ${maskMongoUri(finalUri)}`);

    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    let retries = 5;
    while (retries > 0) {
      try {
        await mongoose.connect(finalUri, options);
        break;
      } catch (err) {
        retries -= 1;
        console.error(`MongoDB connection attempt failed. Retries left: ${retries}`);
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    dbInstance = mongoose.connection.useDb(dbName, { useCache: true });
    console.log(`MongoDB: Connected to ${dbName} (single database)`);
    return dbInstance;
  } catch (error) {
    console.error(`MongoDB Error: ${getConnectionHint(error, uri)}`);
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
