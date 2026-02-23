const mongoose = require("mongoose");
const { userDB, experimentDB } = require("../config/db");

/**
 * Middleware to ensure all MongoDB connections are established (1) before proceeding.
 * Returns 503 Service Unavailable if any database is not ready.
 */
const dbReadyMiddleware = (req, res, next) => {
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    if (mongoose.connection.readyState !== 1 || userDB.readyState !== 1 || experimentDB.readyState !== 1) {
        return res.status(503).json({
            error: {
                code: "DB_NOT_READY",
                message: "Database connections are not fully established. Please try again shortly.",
                states: {
                    default: mongoose.connection.readyState,
                    user: userDB.readyState,
                    experiment: experimentDB.readyState
                }
            }
        });
    }
    next();
};

module.exports = dbReadyMiddleware;
