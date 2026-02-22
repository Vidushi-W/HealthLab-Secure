/**
 * Admin controller: users, researchers, experiments, exports.
 * Delegates business logic to services; handles HTTP only.
 */

const Researcher = require("../models/Researcher");
const asyncHandler = require("../utils/asyncHandler");
const { error: errorResponse, success: successResponse } = require("../utils/response");
const { HTTP_STATUS } = require("../config/constants");
const adminService = require("../services/adminService");
const pdfExportService = require("../services/pdfExportService");

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

/** Dashboard analytics: researcher counts, status breakdown, type distribution, pending backlog, overdue reviews */
const getAnalytics = asyncHandler(async (req, res) => {
  const overdueDays = Math.max(1, parseInt(req.query.overdueDays, 10) || 7);
  const data = await adminService.getResearcherAnalytics(overdueDays);
  return res.status(HTTP_STATUS.OK).json(data);
});

module.exports = {
  getPendingResearchers,
  getResearchers,
  getResearcherById,
  approveResearcher,
  rejectResearcher,
  getUsers,
  deleteExperiment,
  exportResearchersPdf,
  getAnalytics,
};
