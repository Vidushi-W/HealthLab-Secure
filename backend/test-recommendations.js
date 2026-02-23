const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

// Use one of the user IDs from af_project_db (from my inspection earlier)
const userId = "67b494640183c123cfac33c3"; // researcher@healthlab.io

const token = jwt.sign({ userId, role: 'researcher' }, JWT_SECRET, { expiresIn: '1h' });

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/recommendations',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', data);
    });
});

req.on('error', (err) => {
    console.error('Error:', err.message);
});

req.end();
