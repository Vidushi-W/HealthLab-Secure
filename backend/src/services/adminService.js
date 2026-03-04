const User = require("../models/User");
const Researcher = require("../models/Researcher");
const Experiment = require("../models/Experiment");
const FundRequest = require("../models/FundRequest");
const ExperimentWallet = require("../models/ExperimentWallet");
const Contribution = require("../models/Contribution");
const { RESEARCHER_STATUS, USER_ROLE } = require("../config/constants");
const { RESEARCHER_TYPES } = require("../models/Researcher");

const POPULATE_USER = "name email role";
const POPULATE_REVIEWED_BY = "name email";

async function findResearcherById(id) {
  return Researcher.findById(id)
    .populate("user", POPULATE_USER)
    .populate("reviewedBy", POPULATE_REVIEWED_BY);
}

async function updateResearcherReview(researcherId, { status, reviewNotes }, reviewedByUserId) {
  const researcher = await Researcher.findById(researcherId);
  if (!researcher) return null;
  if (researcher.status !== RESEARCHER_STATUS.PENDING) {
    const err = new Error("Researcher has already been reviewed");
    err.statusCode = 400;
    throw err;
  }
  researcher.status = status;
  researcher.reviewNotes = reviewNotes != null ? String(reviewNotes) : "";
  researcher.reviewedAt = new Date();
  researcher.reviewedBy = reviewedByUserId;
  await researcher.save();
  return findResearcherById(researcherId);
}

async function getUsersWithResearcherStatus(roleFilter = null) {
  const filter = roleFilter ? { role: roleFilter } : {};
  const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
  const userIds = users.map((u) => u._id);
  const researchers = await Researcher.find({ user: { $in: userIds } });
  const researcherByUser = new Map(researchers.map((r) => [r.user.toString(), r]));
  return users.map((u) => {
    const uObj = u.toObject();
    const r = researcherByUser.get(u._id.toString());
    if (r) uObj.researcherStatus = r.status;
    return uObj;
  });
}

async function deleteExperimentWithOptions(experimentId, options, adminUserId) {
  const { rejectResearcher: doReject, reassignToParticipant: doReassign } = options || {};
  const experiment = await Experiment.findById(experimentId);
  if (!experiment) return null;
  const createdBy = experiment.createdBy || experiment.ownerId;

  await Promise.all([
    Experiment.findByIdAndDelete(experimentId),
    ExperimentWallet.findOneAndDelete({ experimentId }),
    FundRequest.deleteMany({ experimentId }),
    Contribution.deleteMany({ experimentId }),
  ]);

  if (createdBy && (doReject || doReassign)) {
    const researcher = await Researcher.findOne({ user: createdBy });
    if (researcher && doReject) {
      researcher.status = RESEARCHER_STATUS.REJECTED;
      researcher.reviewNotes = (researcher.reviewNotes || "") + " [Rejected due to experiment policy violation - experiment deleted by admin]";
      researcher.reviewedAt = new Date();
      researcher.reviewedBy = adminUserId;
      await researcher.save();
    }
    if (doReassign) {
      await User.findByIdAndUpdate(createdBy, { role: USER_ROLE.PARTICIPANT });
    }
  }
  return true;
}

async function getResearcherAnalytics(overdueDays = 7) {
  const cutoff = new Date(Date.now() - overdueDays * 24 * 60 * 60 * 1000);
  const [totalResearchers, pendingCount, approvedCount, rejectedCount, byTypeResult, overdueCount] = await Promise.all([
    Researcher.countDocuments(),
    Researcher.countDocuments({ status: RESEARCHER_STATUS.PENDING }),
    Researcher.countDocuments({ status: RESEARCHER_STATUS.APPROVED }),
    Researcher.countDocuments({ status: RESEARCHER_STATUS.REJECTED }),
    Researcher.aggregate([
      { $group: { _id: "$researcherType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Researcher.countDocuments({ status: RESEARCHER_STATUS.PENDING, createdAt: { $lt: cutoff } }),
  ]);

  const byStatus = { pending: pendingCount, approved: approvedCount, rejected: rejectedCount };
  const researcherTypeDistribution = {};
  RESEARCHER_TYPES.forEach((t) => (researcherTypeDistribution[t] = 0));
  byTypeResult.forEach((row) => (researcherTypeDistribution[row._id] = row.count));

  return {
    totalResearchers,
    byStatus,
    researcherTypeDistribution,
    pendingBacklogCount: pendingCount,
    overduePendingCount: overdueCount,
    overdueDays,
  };
}

module.exports = {
  findResearcherById,
  updateResearcherReview,
  getUsersWithResearcherStatus,
  deleteExperimentWithOptions,
  getResearcherAnalytics,
  RESEARCHER_STATUS,
};
