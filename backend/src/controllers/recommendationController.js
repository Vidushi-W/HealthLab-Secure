const Experiment = require("../models/Experiment");
const recommendationService = require("../services/recommendationService");

exports.getRecommendations = async (req, res) => {
    try {
        const user = req.user; // Assuming user is attached by auth middleware
        if (!user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        // 1. Fetch all active experiments
        const experiments = await Experiment.find({ status: "active" });

        // 2. Calculate scores for each experiment
        const recommendations = experiments.map(exp => {
            const matchInfo = recommendationService.calculateMatchScore(user, exp);
            return {
                ...exp.toObject(),
                matchScore: matchInfo.score,
                matchReason: matchInfo.reason
            };
        });

        // 3. Sort by score descending
        recommendations.sort((a, b) => b.matchScore - a.matchScore);

        // 4. Return all experiments with scores
        res.status(200).json(recommendations);
    } catch (error) {
        console.error("Recommendation error:", error);
        res.status(500).json({ message: "Error fetching recommendations" });
    }
};
