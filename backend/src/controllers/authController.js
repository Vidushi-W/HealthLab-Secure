const authService = require('../services/authService');

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const user = await authService.registerUser(name, email, password, role);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await authService.loginUser(email, password);
        res.json(user);
    } catch (error) {
        res.status(401);
        next(error);
    }
};

module.exports = { registerUser, loginUser };
