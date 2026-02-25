const Report = require("../models/Report");
const Post = require("../models/Post");
const asyncHandler = require("../utils/asyncHandler");
const { error: errorResponse } = require("../utils/response");
const { HTTP_STATUS } = require("../config/constants");

/**
 * List reports (admin). Query: status=pending|resolved
 */
const getReports = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const filter = status ? { status } : {};
  const reports = await Report.find(filter)
    .populate("reporter", "name email")
    .populate("postId", "title content status author")
    .sort({ createdAt: -1 })
    .lean();
  return res.status(HTTP_STATUS.OK).json({ success: true, reports });
});

/**
 * Resolve report (admin). Body: action = 'dismiss' | 'hide_content'. If hide_content, sets post or comment status to hidden.
 */
const resolveReport = asyncHandler(async (req, res) => {
  if ((req.user.role || "").toUpperCase() !== "ADMIN") {
    return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Admin only");
  }
  const report = await Report.findById(req.params.id);
  if (!report) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Report not found");
  if (report.status === "resolved") {
    return res.status(HTTP_STATUS.OK).json({ success: true, message: "Report already resolved", report });
  }
  const action = (req.body.action || "dismiss").toLowerCase();
  if (action === "hide_content") {
    if (report.targetType === "post") {
      await Post.findByIdAndUpdate(report.postId, { status: "hidden" });
    } else if (report.targetType === "comment" && report.commentId) {
      const post = await Post.findById(report.postId);
      if (post) {
        const comment = post.comments.id(report.commentId);
        if (comment) {
          comment.status = "hidden";
          await post.save();
        }
      }
    }
  }
  report.status = "resolved";
  report.resolvedBy = req.user._id;
  report.resolvedAt = new Date();
  await report.save();
  const updated = await Report.findById(report._id).populate("reporter", "name email").populate("postId", "title status");
  return res.status(HTTP_STATUS.OK).json({ success: true, message: "Report resolved", report: updated });
});

module.exports = { getReports, resolveReport };
