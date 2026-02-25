const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/constants');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!token || !token.trim()) {
                return res.status(401).json({ error: { code: 'AUTH_MISSING', message: 'Bearer token is empty' } });
            }

            const decoded = jwt.verify(token.trim(), JWT_SECRET);
            const userId = decoded.userId || decoded.id;
            if (!userId) {
                return res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Token missing user id' } });
            }

            req.user = await User.findById(userId).select('-password');
            if (!req.user) {
                return res.status(401).json({
                    error: { code: 'AUTH_FAILED', message: 'User not found. Log in again to get a new token.' }
                });
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Token expired. Please log in again.' } });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Invalid token' } });
            }
            console.error(error);
            return res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Not authorized, token failed' } });
        }
    } else {
        res.status(401).json({ error: { code: 'AUTH_MISSING', message: 'Not authorized, no token' } });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: { code: 'AUTH_FAILED', message: 'Not authorized, no user' }
            });
        }
        const userRole = (req.user.role || '').toUpperCase();
        const allowed = roles.map(r => (r || '').toUpperCase());
        if (!allowed.includes(userRole)) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `Role '${req.user.role}' is not allowed. Required: ${roles.join(' or ')}.`
                }
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
