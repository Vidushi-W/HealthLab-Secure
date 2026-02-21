const Experiment = require("../models/Experiment");

// POST /experiments
const createExperiment = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const experiment = await Experiment.create({
      title,
      description,
      createdBy: req.user ? req.user._id : null,
      status: "draft",
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
