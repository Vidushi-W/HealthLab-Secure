const mongoose = require("mongoose");
const Experiment = require("../models/Experiment");
const Participation = require("../models/Participation");
const {
  pickAllowedCreateFields,
} = require("../validators/experimentValidators");
const geminiService = require("../services/gemini.service");

const MAX_PARTICIPANTS_IN_AI_SUMMARY = 25;
const MAX_LOGS_PER_PARTICIPANT_IN_AI_SUMMARY = 20;

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

// POST /experiments/:id/ai-summary - Generate AI summary from experiment + participant log data
const generateExperimentAiSummary = async (req, res, next) => {
  try {
    const experimentId = req.params.id;
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: "Experiment not found" });
    }
//issue one - Researchers access other studies’ participant data → IDOR
//issue one solution - The server now loads the requested experiment before retrieving participant information and checks whether the authenticated researcher owns it.
 // The summary includes participant ages and daily logs, so it needs the
    // same ownership check as the participant-list endpoint.
    if (
      req.user.role !== "admin" &&
      (!experiment.ownerId || experiment.ownerId.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Not authorized to access this experiment's participant data" });
    }

    const participations = await Participation.find({ experimentId, status: "joined" })
      .select("userId userAge status dateJoined logs")
      .lean();

    const includedParticipations = participations.slice(0, MAX_PARTICIPANTS_IN_AI_SUMMARY);
    const omittedParticipantCount = Math.max(participations.length - includedParticipations.length, 0);

    const participantData = includedParticipations.map((p) => {
      const logs = (p.logs || []).slice(0, MAX_LOGS_PER_PARTICIPANT_IN_AI_SUMMARY).map((log) => {
        const data = log.data;
        let plain = {};
        if (data instanceof Map) plain = Object.fromEntries(data);
        else if (data && typeof data.toObject === "function") plain = data.toObject();
        else if (data && typeof data === "object") plain = data;
        return {
          date: log.date,
          submittedAt: log.submittedAt,
          data: plain,
        };
      });
      return {
        participantId: p._id.toString(),
        userAge: p.userAge,
        status: p.status,
        dateJoined: p.dateJoined,
        logCount: Array.isArray(p.logs) ? p.logs.length : 0,
        includedLogCount: logs.length,
        omittedLogCount: Math.max((p.logs || []).length - logs.length, 0),
        logs,
      };
    });

    const experimentDetails = {
      title: experiment.title,
      description: experiment.description || "",
      status: experiment.status,
      participantLimit: experiment.participantLimit,
      currentParticipantCount: experiment.currentParticipantCount ?? 0,
      eligibilityCriteria: experiment.eligibilityCriteria || {},
      logFieldDefinitions: experiment.logFieldDefinitions || [],
    };

    const prompt = `You are analyzing a research experiment and its participant data to produce a summary for the researcher.

 Experiment details
${JSON.stringify(experimentDetails, null, 2)}

 Data window used for this summary
${JSON.stringify(
      {
        totalJoinedParticipants: participations.length,
        participantsIncludedInPrompt: participantData.length,
        participantsOmittedFromPrompt: omittedParticipantCount,
        maxLogsPerParticipantIncluded: MAX_LOGS_PER_PARTICIPANT_IN_AI_SUMMARY,
      },
      null,
      2
    )}

 Participant logged data
The following are participants who joined this experiment and the log entries they submitted (daily or periodic data per the experiment's log field definitions).
${JSON.stringify(participantData, null, 2)}

Based on the experiment setup and the participant data above, write a structured summary with these sections (use markdown headings and short paragraphs). If there is no participant data yet, say so and summarize only the experiment setup. If there is data, highlight patterns, completeness, and any issues or suggestions.

Sections to include:
1. **Experiment overview** – What the experiment is and what it measures.
2. **Participation snapshot** – How many participants, how much data, time range.
3. **Key patterns** – Notable trends or patterns in the logged data.
4. **Issues or anomalies** – Missing data, outliers, or concerns.
5. **Suggestions for improvement** – Practical recommendations for the researcher.

Provide the summary now:`;

    const summaryResult = await geminiService.generateSummaryResult(prompt);
    if (!summaryResult.ok) {
      return res.status(summaryResult.statusCode || 503).json({
        message: summaryResult.errorMessage || "AI summary is temporarily unavailable. Please verify the Gemini API configuration and try again.",
        code: summaryResult.errorCode || "GEMINI_UNAVAILABLE",
      });
    }
    let aiSummary = summaryResult.text;
    // Strip markdown heading markers (#, ##, ###) from the start of lines
    if (typeof aiSummary === "string") {
      aiSummary = aiSummary.replace(/^#+\s*/gm, "").trim();
    }

    const aiSummaryUpdatedAt = new Date();

    experiment.aiSummary = aiSummary || "";
    experiment.aiSummaryUpdatedAt = aiSummaryUpdatedAt;
    await experiment.save();

    return res.status(200).json({
      experimentId: experiment._id.toString(),
      aiSummary: experiment.aiSummary,
      aiSummaryUpdatedAt: experiment.aiSummaryUpdatedAt,
    });
  } catch (err) {
    next(err);
  }
};

// GET /experiments/:id/safety-guidelines
const getSafetyGuidelines = async (req, res, next) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ message: "Experiment not found" });
    }

    const protocolService = require("../services/protocolService");
    const result = await protocolService.getGuidelinesForExperiment(experiment);

    return res.status(200).json(result);
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
  generateExperimentAiSummary,
  getSafetyGuidelines,
};
