const reviewService = require("../services/reviewService");
const mongoose = require("mongoose");

// --- Validation helpers ---
function validateObjectId(id, name = "id") {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`Invalid ${name}`);
    err.statusCode = 400;
    throw err;
  }
}

function validateCreateUpdateBody(body, isUpdate = false) {
  const errors = [];
  const b = body || {};

  if (!isUpdate) {
    if (b.title === undefined || b.title === null) errors.push("title is required");
    else if (typeof b.title !== "string" || b.title.trim().length < 5 || b.title.length > 150) {
      errors.push("title must be 5–150 characters");
    }
    if (b.abstract === undefined || b.abstract === null) errors.push("abstract is required");
    else if (typeof b.abstract !== "string" || b.abstract.trim().length < 20 || b.abstract.length > 2000) {
      errors.push("abstract must be 20–2000 characters");
    }
    if (b.content === undefined || b.content === null) errors.push("content is required");
    else if (typeof b.content !== "string" || !b.content.trim()) errors.push("content must be non-empty");
    if (b.experiment === undefined || b.experiment === null) errors.push("experiment is required");
    else if (!mongoose.Types.ObjectId.isValid(b.experiment)) errors.push("experiment must be a valid ObjectId");
  } else {
    if (b.title !== undefined) {
      if (typeof b.title !== "string" || b.title.trim().length < 5 || b.title.length > 150) {
        errors.push("title must be 5–150 characters");
      }
    }
    if (b.abstract !== undefined) {
      if (typeof b.abstract !== "string" || b.abstract.trim().length < 20 || b.abstract.length > 2000) {
        errors.push("abstract must be 20–2000 characters");
      }
    }
    if (b.content !== undefined) {
      if (typeof b.content !== "string" || !b.content.trim()) errors.push("content must be non-empty");
    }
    if (b.status !== undefined) {
      if (!["draft", "published"].includes(b.status)) errors.push("status must be draft or published");
    }
  }

  if (b.keywords !== undefined && !Array.isArray(b.keywords)) {
    errors.push("keywords must be an array of strings");
  }

  if (errors.length) {
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }
}

function sendError(res, err) {
  const status = err.statusCode || 500;
  const payload = { success: false, message: err.message || "Internal server error" };
  if (err.errors) payload.errors = err.errors;
  res.status(status).json(payload);
}

// --- Handlers ---

// POST /reviews
const createReview = async (req, res) => {
  try {
    validateCreateUpdateBody(req.body, false);
    const review = await reviewService.createReview(req.body, req.user.id);
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.statusCode) return sendError(res, err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(err.errors || {}).map((e) => e.message),
      });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /reviews
const getReviews = async (req, res) => {
  try {
    const opts = {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
      experimentId: req.query.experimentId,
      status: req.query.status,
      sort: req.query.sort,
    };
    const viewerId = req.user ? req.user.id : null;
    const viewerRole = req.user ? req.user.role : null;
    const result = await reviewService.listReviews(opts, viewerId, viewerRole);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return sendError(res, err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /reviews/:id
const getReviewById = async (req, res) => {
  try {
    validateObjectId(req.params.id, "review id");
    const viewerId = req.user ? req.user.id : null;
    const viewerRole = req.user ? req.user.role : null;
    const review = await reviewService.getReviewById(req.params.id, viewerId, viewerRole);
    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    if (err.statusCode) return sendError(res, err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PUT /reviews/:id
const updateReview = async (req, res) => {
  try {
    validateObjectId(req.params.id, "review id");
    validateCreateUpdateBody(req.body, true);
    const review = await reviewService.updateReview(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    if (err.statusCode) return sendError(res, err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(err.errors || {}).map((e) => e.message),
      });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// DELETE /reviews/:id
const deleteReview = async (req, res) => {
  try {
    validateObjectId(req.params.id, "review id");
    await reviewService.deleteReview(req.params.id, req.user.id, req.user.role);
    return res.status(200).json({ success: true, data: { message: "Review deleted" } });
  } catch (err) {
    if (err.statusCode) return sendError(res, err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /experiments/:experimentId/reviews
const getReviewsByExperiment = async (req, res) => {
  try {
    validateObjectId(req.params.experimentId, "experiment id");
    const opts = {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
      status: req.query.status,
      sort: req.query.sort,
    };
    const viewerId = req.user ? req.user.id : null;
    const viewerRole = req.user ? req.user.role : null;
    const result = await reviewService.listByExperiment(
      req.params.experimentId,
      opts,
      viewerId,
      viewerRole
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return sendError(res, err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsByExperiment,
};
