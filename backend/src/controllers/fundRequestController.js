const fundRequestService = require('../services/fundRequestService');

const createRequest = async (req, res, next) => {
    try {
        const request = await fundRequestService.createRequest(req.user, req.body);
        res.status(201).json(request);
    } catch (error) {
        if (error.message.includes('not found')) res.status(404);
        else if (error.message.includes('active fund request')) res.status(409);
        else if (error.message.includes('limit') || error.message.includes('positive')) res.status(400);
        else res.status(400); // Default to bad request for business logic errors
        next(error);
    }
};

const getMyRequests = async (req, res, next) => {
    try {
        const requests = await fundRequestService.getMyRequests(req.user._id);
        res.json(requests);
    } catch (error) {
        next(error);
    }
};

const getRequestById = async (req, res, next) => {
    try {
        const request = await fundRequestService.getRequestById(req.params.id, req.user);
        res.json(request);
    } catch (error) {
        if (error.message.includes('not found')) res.status(404);
        else if (error.message.includes('Not authorized')) res.status(403);
        next(error);
    }
};

const updateRequest = async (req, res, next) => {
    try {
        const request = await fundRequestService.updateRequest(req.params.id, req.user, req.body);
        res.json(request);
    } catch (error) {
        if (error.message.includes('not found')) res.status(404);
        else if (error.message.includes('current status')) res.status(400);
        next(error);
    }
};

const cancelRequest = async (req, res, next) => {
    try {
        const request = await fundRequestService.cancelRequest(req.params.id, req.user);
        res.json(request);
    } catch (error) {
        if (error.message.includes('not found')) res.status(404);
        else if (error.message.includes('current status')) res.status(400);
        next(error);
    }
};

module.exports = {
    createRequest,
    getMyRequests,
    getRequestById,
    updateRequest,
    cancelRequest
};
