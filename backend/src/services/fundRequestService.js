const FundRequest = require('../models/FundRequest');
const Experiment = require('../models/Experiment');
const ExperimentWallet = require('../models/ExperimentWallet');
const auditService = require('./auditService');
const mongoose = require('mongoose');

// Helper to check for active requests
const hasActiveRequest = async (experimentId) => {
    const activeStatuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];

    const count = await FundRequest.countDocuments({
        experimentId,
        status: { $in: activeStatuses }
    });
    return count > 0;
};

// Helper: Enforce only one fund request per researcher per calendar month
const enforceMonthlyResearcherFundRequestLimit = async (researcherId) => {
    const now = new Date();
    // Using UTC to safely determine start and end of the current month
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const count = await FundRequest.countDocuments({
        researcherId,
        createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth
        }
    });

    if (count > 0) {
        const error = new Error('Researcher can create only one fund request per month.');
        error.code = 'MONTHLY_FUND_REQUEST_LIMIT_REACHED';
        throw error;
    }
};

const createRequest = async (user, data) => {
    const { experimentId, targetAmount, reason } = data;

    // 1. Validation
    if (targetAmount <= 0) throw new Error('Target amount must be positive');

    const experiment = await Experiment.findById(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    if (experiment.createdBy && experiment.createdBy.toString() !== user._id.toString()) {
        throw new Error('Not authorized to request funds for this experiment');
    }

    // Check active requests
    if (await hasActiveRequest(experimentId)) {
        throw new Error('An active fund request already exists for this experiment');
    }

    // Check monthly limit
    await enforceMonthlyResearcherFundRequestLimit(user._id);

    // 2. Create
    const request = await FundRequest.create({
        experimentId,
        researcherId: user._id,
        targetAmount,
        reason,
        status: 'SUBMITTED',
        submittedAt: new Date(),
    });

    await auditService.logAction({
        actorId: user._id,
        actorRole: user.role,
        action: 'CREATE_REQUEST',
        fundRequestId: request._id,
        experimentId,
        toStatus: 'SUBMITTED',
        metadata: { targetAmount }
    });

    return request;
};

const getMyRequests = async (userId) => {
    return await FundRequest.find({ researcherId: userId }).sort({ createdAt: -1 });
};

const getOpenRequests = async () => {
    return await FundRequest.find({ status: 'OPEN_FOR_FUNDING', isOpenForFunding: true })
        .sort({ createdAt: -1 })
        .populate('researcherId', 'name')
        .populate('experimentId', 'title');
};

const getRequestById = async (requestId, user) => {
    const request = await FundRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    if (user.role !== 'ADMIN' && request.researcherId.toString() !== user._id.toString()) {
        throw new Error('Not authorized');
    }
    return request;
};

const updateRequest = async (requestId, user, data) => {
    const request = await FundRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    if (request.researcherId.toString() !== user._id.toString()) {
        throw new Error('Not authorized');
    }

    if (!['DRAFT', 'SUBMITTED'].includes(request.status)) {
        throw new Error('Cannot update request in current status');
    }

    // Only allow updating amount and reason
    if (data.targetAmount) request.targetAmount = data.targetAmount;
    if (data.reason) request.reason = data.reason;

    // Allow submission
    if (data.status === 'SUBMITTED' && request.status === 'DRAFT') {
        request.status = 'SUBMITTED';
        request.submittedAt = new Date();
    }

    await request.save();

    await auditService.logAction({
        actorId: user._id,
        actorRole: user.role,
        action: 'UPDATE_REQUEST',
        fundRequestId: request._id,
        experimentId: request.experimentId,
        metadata: data
    });

    return request;
};

const cancelRequest = async (requestId, user) => {
    const request = await FundRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    if (request.researcherId.toString() !== user._id.toString()) {
        throw new Error('Not authorized');
    }

    if (!['DRAFT', 'SUBMITTED'].includes(request.status)) {
        throw new Error('Cannot cancel request in current status');
    }

    const oldStatus = request.status;
    request.status = 'CANCELLED';
    request.cancelledAt = new Date();
    await request.save();

    await auditService.logAction({
        actorId: user._id,
        actorRole: user.role,
        action: 'CANCEL_REQUEST',
        fundRequestId: request._id,
        experimentId: request.experimentId,
        fromStatus: oldStatus,
        toStatus: 'CANCELLED'
    });

    return request;
};

// Admin Functions

const getAllRequests = async (filters) => {
    // Filters: status, experimentId, researcherId, date range
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.experimentId) query.experimentId = filters.experimentId;
    if (filters.researcherId) query.researcherId = filters.researcherId;
    // Date range logic could be added here

    return await FundRequest.find(query).sort({ createdAt: -1 }).populate('researcherId', 'name email').populate('experimentId', 'title');
};

const updateStatus = async (requestId, user, { status, adminDecisionNote }) => {
    // Valid transitions:
    // SUBMITTED -> UNDER_REVIEW
    // UNDER_REVIEW -> OPEN_FOR_FUNDING | REJECTED

    const request = await FundRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    const oldStatus = request.status;

    if (status === 'UNDER_REVIEW') {
        if (oldStatus !== 'SUBMITTED') throw new Error('Invalid transition to UNDER_REVIEW');
        request.status = 'UNDER_REVIEW';
        request.reviewedAt = new Date();
    } else if (status === 'REJECTED') {
        if (oldStatus !== 'UNDER_REVIEW') throw new Error('Invalid transition to REJECTED');
        request.status = 'REJECTED';
        request.rejectedAt = new Date();
        request.adminDecisionNote = adminDecisionNote;
    } else if (status === 'OPEN_FOR_FUNDING') {
        if (oldStatus !== 'UNDER_REVIEW') throw new Error('Invalid transition to OPEN_FOR_FUNDING');

        request.status = 'OPEN_FOR_FUNDING';
        request.isOpenForFunding = true;
        request.approvedAt = new Date();
        request.approvedBy = user._id;
        request.adminDecisionNote = adminDecisionNote;
    } else {
        throw new Error('Invalid status update');
    }

    await request.save();

    await auditService.logAction({
        actorId: user._id,
        actorRole: user.role,
        action: 'REVIEW_STATUS_CHANGE',
        fundRequestId: request._id,
        experimentId: request.experimentId,
        fromStatus: oldStatus,
        toStatus: status,
        metadata: { adminDecisionNote }
    });

    return request;
};

// Removed disburseRequest as wallet logic is moving to contributions

const disburseRequest = async (requestId, user, referenceId) => {
    const request = await FundRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    if (request.status !== 'APPROVED') {
        throw new Error('Request must be APPROVED to disburse');
    }

    if (!referenceId) throw new Error('Disbursement reference ID required');

    const oldStatus = request.status;
    request.status = 'DISBURSED';
    request.disbursedAt = new Date();
    request.disbursementReferenceId = referenceId;

    await request.save();

    await auditService.logAction({
        actorId: user._id,
        actorRole: user.role,
        action: 'DISBURSEMENT',
        fundRequestId: request._id,
        experimentId: request.experimentId,
        fromStatus: oldStatus,
        toStatus: 'DISBURSED',
        metadata: { referenceId }
    });

    return request;
};

module.exports = {
    createRequest,
    getMyRequests,
    getOpenRequests,
    getRequestById,
    updateRequest,
    cancelRequest,
    getAllRequests,
    updateStatus
};
