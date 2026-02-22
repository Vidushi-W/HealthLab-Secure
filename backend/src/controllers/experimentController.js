const mongoose = require("mongoose");
const Experiment = require("../models/Experiment");

// POST /experiments
const createExperiment = async (req, res, next) => {
  try {
    const { title, description, status, eligibilityRules, participantLimit } = req.body;

    // Determine createdBy from authenticated user or placeholder headers
    const userId = (req.user && (req.user.id || req.user._id)) || req.headers["x-user-id"];
    const createdBy = (userId && mongoose.Types.ObjectId.isValid(userId)) ? new mongoose.Types.ObjectId(userId) : null;

    const experiment = await Experiment.create({
      title,
      description,
      status: status || "draft",
      createdBy,
      eligibilityRules: eligibilityRules || {},
      participantLimit: participantLimit || 0,
    });

    return res.status(201).json(experiment);
  } catch (err) {
    next(err);
  }
};

// GET /experiments
const getExperiments = async (req, res, next) => {
  try {
    const experiments = await Experiment.find().sort({ createdAt: -1 });
    return res.status(200).json(experiments);
  } catch (err) {
    next(err);
  }
};

// GET /experiments/:id
const getExperimentById = async (req, res, next) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) return res.status(404).json({ message: "Experiment not found" });
    return res.status(200).json(experiment);
  } catch (err) {
    next(err);
  }
};

// PUT /experiments/:id
const updateExperiment = async (req, res, next) => {
  try {
    console.log("PUT body:", req.body);
    const updated = await Experiment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Experiment not found" });
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /experiments/:id
const deleteExperiment = async (req, res, next) => {
  try {
    const deleted = await Experiment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Experiment not found" });
    return res.status(200).json({ message: "Experiment deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createExperiment,
  getExperiments,
  getExperimentById,
  updateExperiment,
  deleteExperiment,
};
