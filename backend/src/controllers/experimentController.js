const experimentService = require('../services/experimentService');

const createExperiment = async (req, res, next) => {
    try {
        const experiment = await experimentService.createExperiment(req.user._id, req.body);
        res.status(201).json(experiment);
    } catch (error) {
        next(error);
    }
};

module.exports = { createExperiment };
