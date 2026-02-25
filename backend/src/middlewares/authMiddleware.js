const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('User not found'); // Should be caught by error handler if we passed it there, but here we are in middleware
                // better to use res 401
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Not authorized, token failed' } });
        }
    } else {
        res.status(401).json({ error: { code: 'AUTH_MISSING', message: 'Not authorized, no token' } });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.some(role => role.toLowerCase() === req.user.role.toLowerCase())) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `User role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route`
                }
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
