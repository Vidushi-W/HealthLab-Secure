const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

const registerUser = async (name, email, password, role) => {
    const userExists = await User.findOne({ email });

    if (userExists) {
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    if (user) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        };
    } else {
        throw new Error('Invalid user data');
    }
};

const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        if (user.banned === true) throw new Error('Account access is restricted');
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        };
    } else {
        throw new Error('Invalid email or password');
    }
};

module.exports = { registerUser, loginUser };
