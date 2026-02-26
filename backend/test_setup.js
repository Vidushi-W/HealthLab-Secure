const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');
const FundRequest = require('./src/models/FundRequest');

const run = async () => {
    try {
        await connectDB();
        const admins = await User.find({ role: 'admin' }, '_id email role').limit(2);
        const researchers = await User.find({ role: 'researcher' }, '_id email role').limit(2);
        const requests = await FundRequest.find({}).sort({ createdAt: -1 }).limit(5);

        console.log('START_DATA');
        console.log('--- ADMINS ---');
        admins.forEach(u => console.log(`ADMIN:${u._id}:${u.email}`));
        console.log('--- RESEARCHERS ---');
        researchers.forEach(u => console.log(`RESEARCHER:${u._id}:${u.email}`));
        console.log('--- REQUESTS ---');
        requests.forEach(r => console.log(`REQUEST:${r._id}:${r.status}`));
        console.log('END_DATA');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
};

run();
