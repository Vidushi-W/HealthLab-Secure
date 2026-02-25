require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Experiment = require('../models/Experiment');
const ExperimentWallet = require('../models/ExperimentWallet');
const FundRequest = require('../models/FundRequest');
const { connectDB } = require('../config/db');

const seedData = async () => {
    await connectDB();

    try {
        await User.deleteMany({});
        await Experiment.deleteMany({});
        await ExperimentWallet.deleteMany({});
        await FundRequest.deleteMany({});

        console.log('Data destroyed...');

        // Hash passwords so login (bcrypt.compare) works
        const adminPasswordHash = await bcrypt.hash('admin123', 12);
        const researcherPasswordHash = await bcrypt.hash('password123', 12);

        // Create Users (admin credentials: admin@healthlab.com / admin123)
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@healthlab.com',
            password: adminPasswordHash,
            role: 'ADMIN'
        });

        const researcherUser = await User.create({
            name: 'Dr. Researcher',
            email: 'researcher@healthlab.io',
            password: researcherPasswordHash,
            role: 'RESEARCHER'
        });

        console.log('Users created...');
        console.log('Admin login: email = admin@healthlab.com, password = admin123');

        // Create Experiment
        const experiment = await Experiment.create({
            ownerId: researcherUser._id,
            title: 'Cancer Research Phase 1',
            fundingTargetAmount: 50000,
            minTopUpAmount: 100,
            maxTopUpAmount: 5000,
            maxTotalTopUps: 20000,
            currency: 'USD'
        });

        // Wallet is created automatically by logic? 
        // Logic is in ExperimentService.createExperiment, but here we used Model.create directly.
        // So we must manually create wallet.
        await ExperimentWallet.create({
            experimentId: experiment._id,
            currency: 'USD',
            balance: 0
        });

        console.log('Experiment & Wallet created...');

        // Create a fund request
        await FundRequest.create({
            experimentId: experiment._id,
            researcherId: researcherUser._id,
            targetAmount: 1000,
            reason: 'Reagents purchase',
            status: 'SUBMITTED',
            submittedAt: new Date()
        });

        console.log('Fund Request created...');
        console.log('Seed completed!');
        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();
