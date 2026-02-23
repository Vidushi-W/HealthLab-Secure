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
    const baseUri = uri.endsWith('/') ? uri.slice(0, -1) : uri;

    // Connect default mongoose instance to af_project_db
    const connection = await mongoose.connect(`${baseUri}/${userDBName}`, {
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
