const mongoose = require("mongoose");

let userDB;
let experimentDB;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const userDBName = process.env.MONGO_DB_NAME || "af_project_db";
  const experimentDBName = process.env.EXPERIMENT_DB_NAME || "healthlab_fund_mgmt";

  if (!uri) throw new Error("MONGODB_URI missing");

  console.log(`⏳ MongoDB: Connecting to ${uri}...`);

  try {
    // Correctly build final URI: insert DB name BEFORE query string
    let finalUri;
    const queryIdx = uri.indexOf('?');
    if (queryIdx !== -1) {
      // URI has query params: insert db name before the '?'
      const beforeQuery = uri.slice(0, queryIdx).replace(/\/+$/, '');
      const queryPart = uri.slice(queryIdx);
      finalUri = `${beforeQuery}/${userDBName}${queryPart}`;
    } else {
      const baseUri = uri.replace(/\/+$/, '');
      finalUri = `${baseUri}/${userDBName}`;
    }
    console.log(`🔌 Mongoose: Connecting to ${finalUri.replace(/:([^:@]+)@/, ":****@")}...`);
    const connection = await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ MongoDB: Main connection connected to ${userDBName}`);

    // Set references
    userDB = mongoose.connection.useDb(userDBName, { useCache: true });
    experimentDB = mongoose.connection.useDb(experimentDBName, { useCache: true });

    console.log(`✅ MongoDB: useDb for userDB -> ${userDB.name}`);
    console.log(`✅ MongoDB: useDb for experimentDB -> ${experimentDB.name}`);

    return { userDB, experimentDB };
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  connectDB,
  get userDB() { return userDB || mongoose.connection.useDb(process.env.MONGO_DB_NAME || "af_project_db", { useCache: true }); },
  get experimentDB() { return experimentDB || mongoose.connection.useDb(process.env.EXPERIMENT_DB_NAME || "healthlab_fund_mgmt", { useCache: true }); }
};
