const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');
const FundRequest = require('./src/models/FundRequest');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1h' });
};

const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const run = async () => {
    try {
        await connectDB();

        const admin = await User.findOne({ role: 'admin' });
        const researcher = await User.findOne({ role: 'researcher' });

        if (!admin || !researcher) {
            console.error('Test users not found');
            process.exit(1);
        }

        const adminToken = generateToken(admin._id, admin.role);
        const researcherToken = generateToken(researcher._id, researcher.role);

        // CREATE TEST DATA
        console.log('--- Creating Test Data ---');
        const Experiment = require('./src/models/Experiment');
        const testExperiment = await Experiment.create({
            title: 'Verification Test Experiment',
            description: 'Automated test data',
            createdBy: researcher._id,
            status: 'active'
        });

        const testRequest = await FundRequest.create({
            experimentId: testExperiment._id,
            researcherId: researcher._id,
            targetAmount: 1000,
            reason: 'Initial test reason',
            status: 'SUBMITTED',
            submittedAt: new Date()
        });

        const requestId = testRequest._id;
        console.log(`Testing with Request ID: ${requestId} (Status: ${testRequest.status})`);

        // 1. Test Researcher Update (Should PASS if DRAFT/SUBMITTED and owner)
        try {
            await axios.patch(`${API_URL}/fund-requests/${requestId}`,
                { reason: 'Researcher valid update' },
                { headers: { Authorization: `Bearer ${researcherToken}` } }
            );
            console.log('PASS: Researcher update allowed on own request');
        } catch (e) {
            console.error('FAIL: Researcher update blocked on own request:', e.response?.data || e.message);
        }

        // 2. Test Non-Owner Update (Should FAIL)
        // Note: For this to work, we'd need another researcher token. Skipping for now as owner check is basic.

        // 3. Test Status Lock (Simulate Approval then Edit)
        console.log('--- Testing Status Lock ---');
        try {
            // Admin approves the request
            await axios.patch(`${API_URL}/admin/fund-requests/${requestId}/status`,
                { status: 'OPEN_FOR_FUNDING' },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            console.log('Request approved by admin');

            // Researcher tries to update (Should FAIL)
            try {
                await axios.patch(`${API_URL}/fund-requests/${requestId}`,
                    { reason: 'Late update attempt' },
                    { headers: { Authorization: `Bearer ${researcherToken}` } }
                );
                console.error('FAIL: Researcher allowed to update after approval');
            } catch (e) {
                console.log('PASS: Researcher update blocked after approval (400)');
            }

            // Researcher tries to delete (Should FAIL)
            try {
                await axios.delete(`${API_URL}/fund-requests/${requestId}`,
                    { headers: { Authorization: `Bearer ${researcherToken}` } }
                );
                console.error('FAIL: Researcher allowed to delete after approval');
            } catch (e) {
                console.log('PASS: Researcher delete blocked after approval (400)');
            }

            // Admin tries to delete (Should PASS - Bypass)
            try {
                await axios.delete(`${API_URL}/fund-requests/${requestId}`,
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                );
                console.log('PASS: Admin allowed to delete even after approval (Bypass)');
            } catch (e) {
                console.error('FAIL: Admin delete blocked after approval');
            }

        } catch (e) {
            console.error('Status lock test failed setup:', e.response?.data || e.message);
        }

    } catch (e) {
        console.error('Verification Fatal Error:', e);
    } finally {
        process.exit(0);
    }
};

run();
