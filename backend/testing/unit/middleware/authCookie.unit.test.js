process.env.JWT_SECRET = 'cookie-test-secret';
const request = require('supertest');
const jwt = require('jsonwebtoken');
jest.mock('../../../src/models/User', () => ({ findById: jest.fn(), findOne: jest.fn(), create: jest.fn() }));
jest.mock('../../../src/middleware/dbReadyMiddleware', () => (req, res, next) => next());
const User = require('../../../src/models/User');
const app = require('../../../src/app');
const { resetAuthRateLimits } = require('../../../src/middleware/authRateLimit');
const { optionalAuth, protect, authorize } = require('../../../src/middleware/authMiddleware');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const token = (payload = { id: 'test-user' }, options = { expiresIn: '1h' }) => jwt.sign(payload, process.env.JWT_SECRET, options);
const cookie = (value = token()) => 'healthlab_session=' + value;
let user;
beforeEach(() => {
  resetAuthRateLimits();
  user = { _id: 'test-user', name: 'Tester', email: 'tester@example.com', role: 'participant', banned: false, password: bcrypt.hashSync('StrongPass@2026', 4) };
  User.findById.mockImplementation(() => ({ select: async () => user }));
  User.findOne.mockImplementation(() => ({ select: async () => user }));
});
test('login sets HttpOnly cookie with JWT expiry and no JSON token; browser jar authenticates and logs out', async () => {
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/login').set('X-Requested-With', 'HealthLab').send({ email: user.email, password: 'StrongPass@2026' });
  expect(login.status).toBe(200);
  expect(login.body.token).toBeUndefined();
  const header = login.headers['set-cookie'][0];
  expect(header).toContain('HttpOnly');
  expect(header).toContain('SameSite=Lax');
  expect(header).toContain('Path=/');
  const signed = header.split(';')[0].split('=')[1];
  const expiry = /Expires=([^;]+)/.exec(header)[1];
  expect(new Date(expiry).getTime()).toBe(jwt.decode(signed).exp * 1000);
  expect((await agent.get('/api/auth/profile')).status).toBe(200);
  const logout = await agent.post('/api/auth/logout').set('X-Requested-With', 'HealthLab');
  expect(logout.status).toBe(200);
  expect(logout.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
  expect(logout.headers['set-cookie'][0]).toContain('HttpOnly');
  expect((await agent.get('/api/auth/profile')).status).toBe(401);
});
test('registration sets cookie and omits JSON token', async () => {
  User.findOne.mockResolvedValueOnce(null);
  User.create.mockResolvedValueOnce(user);
  const response = await request(app).post('/api/auth/register-participant').set('X-Requested-With', 'HealthLab').send({ name: 'Tester', email: user.email, password: 'StrongPass@2026', age: 28, gender: 'Female', location: 'Colombo', height: 165, weight: 60 });
  expect(response.status).toBe(201);
  expect(response.body.token).toBeUndefined();
  expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
});
test('production cookie and its deletion are Secure', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const login = await request(app).post('/api/auth/login').set('X-Requested-With', 'HealthLab').send({ email: user.email, password: 'StrongPass@2026' });
    expect(login.headers['set-cookie'][0]).toContain('Secure');
    expect(login.headers['set-cookie'][0]).toContain('SameSite=None');
    const logout = await request(app).post('/api/auth/logout').set('X-Requested-With', 'HealthLab');
    expect(logout.headers['set-cookie'][0]).toContain('Secure');
  } finally { process.env.NODE_ENV = previous; }
});
test.each([null, 'malformed', token({ id: 'test-user' }, { expiresIn: -1 })])('rejects absent/invalid/expired cookie: %s', async value => {
  let req = request(app).get('/api/auth/profile');
  if (value) req = req.set('Cookie', cookie(value));
  expect((await req).status).toBe(401);
});
test('Bearer-only authentication is no longer accepted', async () => {
  expect((await request(app).get('/api/auth/profile').set('Authorization', 'Bearer ' + token())).status).toBe(401);
});
test('deleted and banned users cannot access protected endpoints', async () => {
  user.banned = true;
  expect((await request(app).get('/api/auth/profile').set('Cookie', cookie())).status).toBe(403);
  user = null;
  expect((await request(app).get('/api/auth/profile').set('Cookie', cookie())).status).toBe(401);
});
test('optional authentication checks cookies and bans; roles use the database user', async () => {
  const server = express();
  server.use(cookieParser());
  server.get('/optional', optionalAuth, (req,res) => res.json({ id: req.user?._id || null }));
  server.get('/admin', protect, authorize('admin'), (req,res) => res.sendStatus(200));
  expect((await request(server).get('/optional')).body.id).toBeNull();
  expect((await request(server).get('/optional').set('Cookie', cookie())).body.id).toBe('test-user');
  expect((await request(server).get('/admin').set('Cookie', cookie(token({ id: 'test-user', role: 'admin' })))).status).toBe(403);
  user.role = 'admin';
  expect((await request(server).get('/admin').set('Cookie', cookie())).status).toBe(200);
  user.banned = true;
  expect((await request(server).get('/optional').set('Cookie', cookie())).status).toBe(403);
});
test('CSRF header is mandatory, including login/logout and legacy paths', async () => {
  for (const path of ['/api/auth/login', '/api/auth/logout', '/auth/logout']) {
    expect((await request(app).post(path)).status).toBe(403);
  }
});
test('credentialed CORS permits only the existing explicit origins', async () => {
  const allowed = await request(app).options('/api/auth/login').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST').set('Access-Control-Request-Headers', 'X-Requested-With');
  expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  expect(allowed.headers['access-control-allow-credentials']).toBe('true');
  const denied = await request(app).post('/api/auth/logout').set('Origin', 'https://attacker.example').set('X-Requested-With', 'HealthLab');
  expect(denied.status).toBeGreaterThanOrEqual(400);
  expect(denied.headers['set-cookie']).toBeUndefined();
});
