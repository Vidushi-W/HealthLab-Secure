const mongoose = require("mongoose");
const Experiment = require("../models/Experiment");
const {
  pickAllowedCreateFields,
} = require("../validators/experimentValidators");

// POST /experiments
const createExperiment = async (req, res, next) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user._id)) || req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({ message: "User ID not found in request" });
    }

    // Only accept whitelisted fields from the frontend
    const payload = pickAllowedCreateFields(req.body);

    // Rely on Mongoose defaults for system-managed fields
    const experiment = new Experiment({
      ...payload,
      ownerId: userId, // assign owner automatically
    });

    await experiment.save();

    return res.status(201).json({
      success: true,
      data: experiment,
    });
  } catch (err) {
    next(err);
  }
};
// GET /experiments
const getExperiments = async (req, res, next) => {
  try {
    const experiments = await Experiment.find().sort({ createdAt: -1 });

    // Check for enrollment if user is logged in
    const user = req.user;
    let joinedExpIds = new Set();

    if (user && user._id) {
      const Participations = require("../models/Participation");
      const userParticipations = await Participations.find({ userId: user._id, status: "joined" });
      joinedExpIds = new Set(userParticipations.map(p => p.experimentId.toString()));
    }

    const experimentsWithStatus = experiments.map(exp => ({
      ...exp.toObject(),
      enrolled: joinedExpIds.has(exp._id.toString())
    }));

    console.log(`📊 API /experiments: Found ${experiments.length} experiments`);
    return res.status(200).json(experimentsWithStatus);
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
      { returnDocument: "after", runValidators: true }
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
