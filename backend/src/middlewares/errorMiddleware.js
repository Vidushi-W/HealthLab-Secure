const errorHandler = (err, req, res, next) => {
    // Determine status code
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log the error for internal tracking (exclude in simple Postman views)
    if (process.env.NODE_ENV !== 'test') {
        console.error(`[Error] ${req.method} ${req.url}: ${err.message}`);
    }

    // Always return JSON
    res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'),
            message: err.message || 'An unexpected error occurred',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Route Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
