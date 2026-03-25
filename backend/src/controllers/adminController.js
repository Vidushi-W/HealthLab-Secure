// Admin controller: handles HTTP for users, researchers, experiments, fund requests. Uses services for logic.
const User = require("../models/User");
const Researcher = require("../models/Researcher");
const asyncHandler = require("../utils/asyncHandler");
const { error: errorResponse, success: successResponse } = require("../utils/response");
const { HTTP_STATUS } = require("../config/constants");
const adminService = require("../services/adminService");
const pdfExportService = require("../services/pdfExportService");
const fundRequestService = require("../services/fundRequestService");
const analyticsService = require("../services/analyticsService");

const { RESEARCHER_STATUS } = adminService;
const POPULATE = { user: "name email role", reviewedBy: "name email" };

// Researchers: list only pending
const getPendingResearchers = asyncHandler(async (req, res) => {
  const researchers = await Researcher.find({ status: RESEARCHER_STATUS.PENDING })
    .populate("user", POPULATE.user)
    .populate("reviewedBy", POPULATE.reviewedBy)
    .sort({ createdAt: -1 });
  return res.status(HTTP_STATUS.OK).json(researchers);
});

// Researchers: list all, optional query status filter
const getResearchers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const researchers = await Researcher.find(filter)
    .populate("user", POPULATE.user)
    .populate("reviewedBy", POPULATE.reviewedBy)
    .sort({ createdAt: -1 });
  return res.status(HTTP_STATUS.OK).json(researchers);
});

// Researchers: get one by id
const getResearcherById = asyncHandler(async (req, res) => {
  const researcher = await adminService.findResearcherById(req.params.id);
  if (!researcher) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Researcher not found");
  }
  return res.status(HTTP_STATUS.OK).json(researcher);
});

// Researchers: set status to approved, optional reviewNotes
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

// Researchers: set status to rejected, optional reviewNotes
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

// Researchers: remove record and set user role to participant
const deleteResearcher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const researcher = await Researcher.findById(id);
  if (!researcher) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Researcher not found");
  }
  const userId = researcher.user ? (researcher.user._id || researcher.user) : null;
  await Researcher.findByIdAndDelete(id);
  if (userId) {
    await User.findByIdAndUpdate(userId, { role: "participant" });
  }
  return successResponse(res, HTTP_STATUS.OK, null, "Researcher removed; user is now a participant");
});

// Users: list all with optional role filter, include researcherStatus when applicable
const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const list = await adminService.getUsersWithResearcherStatus(role || null);
  return res.status(HTTP_STATUS.OK).json(list);
});

// Users: list researchers not yet approved (isApproved false)
const getUnapprovedResearchers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "researcher", isApproved: false });
  return res.status(HTTP_STATUS.OK).json(users);
});

// Users: set isApproved true and sync researcher status to approved
const approveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { isApproved: true }, { new: true });

  if (!user) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "User not found");
  }

  await Researcher.findOneAndUpdate({ user: id }, { status: "approved" });

  return res.status(HTTP_STATUS.OK).json(user);
});

// Users: set isApproved false and sync researcher status to rejected
const rejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { isApproved: false }, { new: true });

  if (!user) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "User not found");
  }

  await Researcher.findOneAndUpdate({ user: id }, { status: "rejected" });

  return res.status(HTTP_STATUS.OK).json(user);
});

// Experiments: delete and optionally reject creator / reassign to participant
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

// Researchers: stream PDF report, optional query status filter
const exportResearchersPdf = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const researchers = await Researcher.find(filter)
    .populate("user", POPULATE.user)
    .populate("reviewedBy", POPULATE.reviewedBy)
    .sort({ createdAt: -1 });
  pdfExportService.pipeResearchersReportToResponse(researchers, res);
});

const getAllRequests = asyncHandler(async (req, res) => {
  const requests = await fundRequestService.getAllRequests(req.query);
  return res.status(HTTP_STATUS.OK).json(requests);
});

// Fund: update request status (status, adminDecisionNote, approvedAmount)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, adminDecisionNote, approvedAmount } = req.body || {};
  try {
    const request = await fundRequestService.updateStatus(req.params.id, req.user, { status, adminDecisionNote, approvedAmount });
    return res.status(HTTP_STATUS.OK).json(request);
  } catch (err) {
    if (err.message && (err.message.includes("not found") || err.message.includes("Invalid transition") || err.message.includes("exceed"))) {
      const code = err.message.includes("not found") ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return errorResponse(res, code, err.message);
    }
    throw err;
  }
});

// Analytics: dashboard data
const getAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAnalytics();
  return res.status(HTTP_STATUS.OK).json(data);
});

// Reports: fund reports with query params
const getReports = asyncHandler(async (req, res) => {
  const data = await analyticsService.getReports(req.query);
  return res.status(HTTP_STATUS.OK).json(data);
});

// Stub: not implemented
const disburseRequest = asyncHandler(async (req, res) => {
  return res.status(501).json({ success: false, message: "Not implemented" });
});

module.exports = {
  getPendingResearchers,
  getResearchers,
  getResearcherById,
  approveResearcher,
  rejectResearcher,
  deleteResearcher,
  getUsers,
  getUnapprovedResearchers,
  approveUser,
  rejectUser,
  deleteExperiment,
  exportResearchersPdf,
  getAnalytics,
  getAllRequests,
  updateStatus,
  getReports,
  disburseRequest,
};

