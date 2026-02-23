require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('MONGO_DB_NAME:', process.env.MONGO_DB_NAME);
console.log('EXPERIMENT_DB_NAME:', process.env.EXPERIMENT_DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
process.exit(0);
