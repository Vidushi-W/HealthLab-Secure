const fundRequestService = require('../services/fundRequestService');
const analyticsService = require('../services/analyticsService');

const getAllRequests = async (req, res, next) => {
    try {
        const filters = req.query; // status, experimentId, researcherId
        const requests = await fundRequestService.getAllRequests(filters);
        res.json(requests);
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { status, adminDecisionNote, approvedAmount } = req.body;
        const request = await fundRequestService.updateStatus(req.params.id, req.user, {
            status,
            adminDecisionNote,
            approvedAmount
        });
        res.json(request);
    } catch (error) {
        if (error.message.includes('not found')) res.status(404);
        else if (error.message.includes('Invalid transition') || error.message.includes('exceed')) res.status(400);
        next(error);
    }
};

const disburseRequest = async (req, res, next) => {
    try {
        const { disbursementReferenceId } = req.body;
        const request = await fundRequestService.disburseRequest(req.params.id, req.user, disbursementReferenceId);
        res.json(request);
    } catch (error) {
        if (error.message.includes('not found')) res.status(404);
        else if (error.message.includes('APPROVED')) res.status(400);
        next(error);
    }
};

const getAnalytics = async (req, res, next) => {
    try {
        const data = await analyticsService.getAnalytics();
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const getReports = async (req, res, next) => {
    try {
        const data = await analyticsService.getReports(req.query);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRequests,
    updateStatus,
    disburseRequest,
    getAnalytics,
    getReports
};
