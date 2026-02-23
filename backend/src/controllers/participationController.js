const Participation = require("../models/Participation");
const Experiment = require("../models/Experiment");
const eligibilityService = require("../services/eligibilityService");
const {
  IneligibleAgeError,
  InvalidMedicalTermError,
  ConflictingStudyError,
  DuplicateParticipationError,
} = require("../errors/CustomErrors");

// POST /participations/join - Join an experiment (with Eligibility Engine + Cohort Management)
const joinExperiment = async (req, res, next) => {
  try {
    const { userId, userAge, userEmail, experimentId } = req.body;

    // Validate input
    if (!userId || !userAge || !experimentId) {
      return res.status(400).json({
        message: "Missing required fields: userId, userAge, experimentId",
      });
    }

    // PART B.1: COHORT MANAGEMENT - Atomic seat reservation
    // We'll attempt to atomically increment `currentParticipants` on the Experiment
    // only if there is capacity (participantLimit === 0 means unlimited).
    const seatReservedExperiment = await Experiment.findOneAndUpdate(
      {
        _id: experimentId,
        $or: [
          { participantLimit: 0 },
          { $expr: { $lt: ["$currentParticipants", "$participantLimit"] } },
        ],
      },
      { $inc: { currentParticipants: 1 } },
      { new: true }
    );

    if (!seatReservedExperiment) {
      return res.status(409).json({
        error: "CohortFull",
        message: "This study has reached its participant limit.",
      });
    }

    // 1. DUPLICATE PREVENTION: Check if user already joined this experiment
    const existingParticipation = await Participation.findOne({
      userId,
      experimentId,
    });

    if (existingParticipation) {
      throw new DuplicateParticipationError();
    }

    // 2. ELIGIBILITY ENGINE: Run all three validation checks
    // This includes: Protocol Validation, Medical Term Verification, and Conflict Detection
    const user = { id: userId, age: userAge, email: userEmail };

    await eligibilityService.runEligibilityCheck(user, experimentId);

    // 3. CREATION: Create new participation record if all checks pass
    // If creation fails we must rollback the reserved seat above.
    let participation;
    try {
      participation = await Participation.create({
        userId,
        userAge,
        userEmail,
        experimentId,
        status: "joined",
        dateJoined: new Date(),
        isAnonymized: false,
      });
    } catch (createErr) {
      // rollback reserved seat
      await Experiment.findByIdAndUpdate(experimentId, { $inc: { currentParticipants: -1 } });
      throw createErr;
    }

    return res.status(201).json({
      message: "Successfully joined the experiment!",
      participation,
    });
  } catch (err) {
    // Handle custom business logic errors with appropriate HTTP status codes
    if (err instanceof IneligibleAgeError) {
      return res.status(err.statusCode).json({
        error: err.name,
        message: err.message,
      });
    }
    if (err instanceof InvalidMedicalTermError) {
      return res.status(err.statusCode).json({
        error: err.name,
        message: err.message,
      });
    }
    if (err instanceof ConflictingStudyError) {
      return res.status(err.statusCode).json({
        error: err.name,
        message: err.message,
        conflictingStudies: err.conflictingStudies,
      });
    }
    if (err instanceof DuplicateParticipationError) {
      return res.status(err.statusCode).json({
        error: err.name,
        message: err.message,
      });
    }

    // Pass other errors to next middleware
    next(err);
  }
};

// GET /participations/my-studies - Get all studies for logged-in user (with Populate)
const getMyStudies = async (req, res, next) => {
  try {
    // In a real app, userId would come from req.user (JWT auth)
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    // DATA RETRIEVAL: Find all participations for this user
    const myStudies = await Participation.find({ userId }).sort({ dateJoined: -1 });

    // MANUAL POPULATE: Across different database connections
    const enrichedStudies = await Promise.all(myStudies.map(async (p) => {
      const pObj = p.toObject();
      const experiment = await Experiment.findById(p.experimentId).select("title description status eligibilityRules");
      pObj.experimentId = experiment;
      return pObj;
    }));

    return res.status(200).json({
      totalStudies: enrichedStudies.length,
      studies: enrichedStudies,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /participations/:participationId/leave - Leave a study (Anonymization/Withdrawal)
const leaveExperiment = async (req, res, next) => {
  try {
    const { participationId } = req.params;

    // PART B.2: WITHDRAWAL & ANONYMIZATION
    // Instead of deleting, we:
    // 1. Mark status as 'dropped' (preserves database history for researchers)
    // 2. Anonymize personal data for GDPR/ethics compliance
    // 3. Keep aggregated data for analytics

    // Fetch previous participation to know if we should decrement experiment count
    const previous = await Participation.findById(participationId);

    const participation = await Participation.findByIdAndUpdate(
      participationId,
      {
        status: "dropped",
        dateLeft: new Date(),
        isAnonymized: true,
        // Clear PII when user withdraws
        userEmail: "anonymized@withdrawn.local",
        userId: null, // Remove link to actual user for privacy
      },
      { new: true }
    );

    // If the user was previously 'joined', decrement the experiment's currentParticipants
    if (previous && previous.status === "joined") {
      await Experiment.findByIdAndUpdate(participation.experimentId, { $inc: { currentParticipants: -1 } });
    }

    if (!participation) {
      return res.status(404).json({ message: "Participation record not found" });
    }

    return res.status(200).json({
      message: "You have successfully left the study. Your personal data has been anonymized.",
      participation: {
        _id: participation._id,
        experimentId: participation.experimentId,
        status: participation.status,
        dateJoined: participation.dateJoined,
        dateLeft: participation.dateLeft,
        isAnonymized: participation.isAnonymized,
        // Note: userEmail, userId, userAge are not returned to user after anonymization
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /participations/experiment/:experimentId/participants - Get participants list (Researcher only)
const getParticipantsList = async (req, res, next) => {
  try {
    const { experimentId } = req.params;
    const { includeWithdrawn } = req.query;

    // PART B.3: RBAC protected endpoint - only researchers can access
    // This check is enforced by middleware in routes

    const query = { experimentId };

    // By default, only show active participants
    if (includeWithdrawn !== "true") {
      query.status = "joined";
    }

    const participants = await Participation.find(query)
      .select("-userEmail -userId") // Don't show PII unless needed
      .populate("experimentId", "title")
      .sort({ dateJoined: -1 });

    const stats = {
      totalJoined: await Participation.countDocuments({ experimentId, status: "joined" }),
      totalDropped: await Participation.countDocuments({ experimentId, status: "dropped" }),
      totalCompleted: await Participation.countDocuments({ experimentId, status: "completed" }),
    };

    return res.status(200).json({
      stats,
      participants: participants.map(p => ({
        _id: p._id,
        experimentTitle: p.experimentId.title,
        status: p.status,
        dateJoined: p.dateJoined,
        dateLeft: p.dateLeft,
        isAnonymized: p.isAnonymized,
        age: p.userAge, // Age is safe to show (anonymized)
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  joinExperiment,
  getMyStudies,
  leaveExperiment,
  getParticipantsList,
};
