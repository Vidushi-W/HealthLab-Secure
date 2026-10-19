const { HTTP_STATUS } = require("../config/constants");

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// V5 / VUL-09: never return err.stack (file paths / internals) to clients.
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200
        ? (err.statusCode || err.status || 500)
        : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
    });
};

module.exports = { notFound, errorHandler };
