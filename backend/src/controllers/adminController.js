/**
 * Admin controller: users, researchers, experiments, exports.
 * Delegates business logic to services; handles HTTP only.
 */

const User = require("../models/User");
const Researcher = require("../models/Researcher");
const asyncHandler = require("../utils/asyncHandler");
const { error: errorResponse, success: successResponse } = require("../utils/response");
const { HTTP_STATUS } = require("../config/constants");
const adminService = require("../services/adminService");
const pdfExportService = require("../services/pdfExportService");
const fundRequestService = require('../services/fundRequestService');
const analyticsService = require('../services/analyticsService');

const { RESEARCHER_STATUS } = adminService;
const POPULATE = { user: "name email role", reviewedBy: "name email" };

const getPendingResearchers = asyncHandler(async (req, res) => {
  const researchers = await Researcher.find({ status: RESEARCHER_STATUS.PENDING })
    .populate("user", POPULATE.user)
    .populate("reviewedBy", POPULATE.reviewedBy)
    .sort({ createdAt: -1 });
  return res.status(HTTP_STATUS.OK).json(researchers);
});

const getResearchers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const researchers = await Researcher.find(filter)
    .populate("user", POPULATE.user)
    .populate("reviewedBy", POPULATE.reviewedBy)
    .sort({ createdAt: -1 });
  return res.status(HTTP_STATUS.OK).json(researchers);
});

const getResearcherById = asyncHandler(async (req, res) => {
  const researcher = await adminService.findResearcherById(req.params.id);
  if (!researcher) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Researcher not found");
  }
  return res.status(HTTP_STATUS.OK).json(researcher);
});

const approveResearcher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;
  try {
    const updated = await adminService.updateResearcherReview(
      id,
      { status: RESEARCHER_STATUS.APPROVED, reviewNotes },
      req.user._id
    );
    if (!updated) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Researcher not found");
    }
    return res.status(HTTP_STATUS.OK).json(updated);
  } catch (err) {
    if (err.statusCode === 400) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, err.message);
    }
    throw err;
  }
});

const rejectResearcher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;
  try {
    const updated = await adminService.updateResearcherReview(
      id,
      { status: RESEARCHER_STATUS.REJECTED, reviewNotes },
      req.user._id
    );
    if (!updated) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Researcher not found");
    }
    return res.status(HTTP_STATUS.OK).json(updated);
  } catch (err) {
    if (err.statusCode === 400) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, err.message);
    }
    throw err;
  }
});

const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const list = await adminService.getUsersWithResearcherStatus(role || null);
  return res.status(HTTP_STATUS.OK).json(list);
});

const getUnapprovedResearchers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "researcher", isApproved: false });
  return res.status(HTTP_STATUS.OK).json(users);
});

const approveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { isApproved: true }, { new: true });

  if (!user) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "User not found");
  }

  // Also update corresponding Researcher record if it exists
  await Researcher.findOneAndUpdate({ user: id }, { status: "approved" });

  return res.status(HTTP_STATUS.OK).json(user);
});

const rejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { isApproved: false }, { new: true });

  if (!user) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "User not found");
  }

  // Also update corresponding Researcher record if it exists
  await Researcher.findOneAndUpdate({ user: id }, { status: "rejected" });

  return res.status(HTTP_STATUS.OK).json(user);
});

const deleteExperiment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const result = await adminService.deleteExperimentWithOptions(
    id,
    {
      rejectResearcher: body.rejectResearcher,
      reassignToParticipant: body.reassignToParticipant,
    },
    req.user._id
  );
  if (!result) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Experiment not found");
  }
  return successResponse(res, HTTP_STATUS.OK, null, "Experiment deleted");
});

const exportResearchersPdf = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const researchers = await Researcher.find(filter)
    .populate("user", POPULATE.user)
    .populate("reviewedBy", POPULATE.reviewedBy)
    .sort({ createdAt: -1 });
  pdfExportService.pipeResearchersReportToResponse(researchers, res);
});

/** Dashboard analytics: Researcher counts */
const getResearcherAnalytics = asyncHandler(async (req, res) => {
  const overdueDays = Math.max(1, parseInt(req.query.overdueDays, 10) || 7);
  const data = await adminService.getResearcherAnalytics(overdueDays);
  return res.status(HTTP_STATUS.OK).json(data);
});

/** Fund Management Admin Functions */
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
  getPendingResearchers,
  getResearchers,
  getResearcherById,
  approveResearcher,
  rejectResearcher,
  getUsers,
  getUnapprovedResearchers,
  approveUser,
  rejectUser,
  deleteExperiment,
  exportResearchersPdf,
  getResearcherAnalytics,
  getAllRequests,
  updateStatus,
  getAnalytics,
  getReports
};
