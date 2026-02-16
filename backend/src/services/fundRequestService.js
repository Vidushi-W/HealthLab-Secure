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

const createRequest = async (user, data) => {
    const { experimentId, requestedAmount, reason } = data;

    // 1. Validation
    if (requestedAmount <= 0) throw new Error('Requested amount must be positive');

    const experiment = await Experiment.findById(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    if (experiment.ownerId.toString() !== user._id.toString()) {
        throw new Error('Not authorized to request funds for this experiment');
    }

    // Check limits
    if (requestedAmount < experiment.minTopUpAmount) {
        throw new Error(`Amount below minimum top-up limit (${experiment.minTopUpAmount})`);
    }
    if (requestedAmount > experiment.maxTopUpAmount) {
        throw new Error(`Amount exceeds maximum top-up limit (${experiment.maxTopUpAmount})`);
    }

    // Check active requests
    if (await hasActiveRequest(experimentId)) {
        throw new Error('An active fund request already exists for this experiment');
    }

    // 2. Create
    const request = await FundRequest.create({
        experimentId,
        researcherId: user._id,
        requestedAmount,
        reason,
        status: 'DRAFT',
        submittedAt: new Date(),
    });

    await auditService.logAction({
        actorId: user._id,
        actorRole: user.role,
        action: 'CREATE_REQUEST',
        fundRequestId: request._id,
        experimentId,
        toStatus: 'SUBMITTED',
        metadata: { requestedAmount }
    });

    return request;
};

const getMyRequests = async (userId) => {
    return await FundRequest.find({ researcherId: userId }).sort({ createdAt: -1 });
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
    if (data.requestedAmount) request.requestedAmount = data.requestedAmount;
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

const updateStatus = async (requestId, user, { status, adminDecisionNote, approvedAmount }) => {
    // Valid transitions:
    // SUBMITTED -> UNDER_REVIEW
    // UNDER_REVIEW -> APPROVED | REJECTED

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
        request.decidedAt = new Date();
        request.adminDecisionNote = adminDecisionNote;
    } else if (status === 'APPROVED') {
        if (oldStatus !== 'UNDER_REVIEW') throw new Error('Invalid transition to APPROVED');

        // This is the critical part: Wallet Allocation
        return await approveRequest(request, user, approvedAmount, adminDecisionNote);
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

const approveRequest = async (request, user, approvedAmountOverride, note) => {
    // Removed transaction for local dev compatibility (requires replica set)
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
        const approvedAmount = approvedAmountOverride || request.requestedAmount;

        // Check idempotency (though status check handles mostly)
        if (request.status === 'APPROVED') throw new Error('Already approved');

        // Check global cap (maxTotalTopUps)
        const experiment = await Experiment.findById(request.experimentId); // .session(session);
        if (experiment.maxTotalTopUps) {
            // Calculate total approved so far
            const totalApproved = await FundRequest.aggregate([
                { $match: { experimentId: experiment._id, status: { $in: ['APPROVED', 'DISBURSED'] } } },
                { $group: { _id: null, total: { $sum: '$approvedAmount' } } }
            ]); // .session(session);

            const currentTotal = totalApproved.length > 0 ? totalApproved[0].total : 0;
            if (currentTotal + approvedAmount > experiment.maxTotalTopUps) {
                throw new Error('Approval would exceed experiment global funding cap');
            }
        }

        request.status = 'APPROVED';
        request.approvedAmount = approvedAmount;
        request.decidedAt = new Date();
        request.allocatedAt = new Date();
        request.adminDecisionNote = note;
        request.allocationIdempotencyKey = `ALLOC_${request._id}_${Date.now()}`; // Simple key

        await request.save(); // { session });

        // Update Wallet
        let wallet = await ExperimentWallet.findOne({ experimentId: request.experimentId }); // .session(session);
        if (!wallet) {
            // Should exist from experiment creation, but just in case
            wallet = await ExperimentWallet.create([{ experimentId: request.experimentId, balance: 0 }]); // , { session });
            wallet = wallet[0];
        } else {
            wallet.balance += approvedAmount;
            wallet.lastUpdatedAt = new Date();
            await wallet.save(); // { session });
        }

        // await session.commitTransaction();
        // session.endSession();

        // Audit Log (outside transaction or after)
        await auditService.logAction({
            actorId: user._id,
            actorRole: user.role,
            action: 'WALLET_ALLOCATION',
            fundRequestId: request._id,
            experimentId: request.experimentId,
            fromStatus: 'UNDER_REVIEW',
            toStatus: 'APPROVED',
            metadata: { approvedAmount, note }
        });

        return request;

    } catch (error) {
        // await session.abortTransaction();
        // session.endSession();
        throw error;
    }
};

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
    getRequestById,
    updateRequest,
    cancelRequest,
    getAllRequests,
    updateStatus,
    disburseRequest
};
