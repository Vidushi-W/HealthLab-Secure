const FundRequest = require('../models/FundRequest');
const ExperimentWallet = require('../models/ExperimentWallet');

// totalRequestedAmount
// totalApprovedAmount
// totalDisbursedAmount
// counts by status
// top experiments by approved amount

const getAnalytics = async () => {
    const stats = await FundRequest.aggregate([
        {
            $group: {
                _id: null,
                totalRequested: { $sum: '$requestedAmount' },
                // Approved amount is only set if approved, so we filter or just sum it (it's undefined/null otherwise, which sums to 0 usually, but safer to match)
                totalApproved: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['APPROVED', 'DISBURSED']] }, '$approvedAmount', 0]
                    }
                },
                totalDisbursed: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'DISBURSED'] }, '$approvedAmount', 0]
                    }
                }
            }
        }
    ]);

    const statusCounts = await FundRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const topExperiments = await FundRequest.aggregate([
        { $match: { status: { $in: ['APPROVED', 'DISBURSED'] } } },
        { $group: { _id: '$experimentId', totalApproved: { $sum: '$approvedAmount' } } },
        { $sort: { totalApproved: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'experiments', localField: '_id', foreignField: '_id', as: 'experiment' } },
        { $unwind: '$experiment' },
        { $project: { title: '$experiment.title', totalApproved: 1 } }
    ]);

    return {
        totals: stats[0] || { totalRequested: 0, totalApproved: 0, totalDisbursed: 0 },
        statusCounts: statusCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        topExperiments
    };
};

const getReports = async ({ status, experimentId, researcherId, fromDate, toDate, limit = 10, page = 1 }) => {
    const query = {};
    if (status) query.status = status;
    if (experimentId) query.experimentId = experimentId;
    if (researcherId) query.researcherId = researcherId;
    if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate);
        if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;

    const requests = await FundRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('researcherId', 'name email')
        .populate('experimentId', 'title');

    const total = await FundRequest.countDocuments(query);

    return {
        data: requests,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        }
    };
};

module.exports = { getAnalytics, getReports };
