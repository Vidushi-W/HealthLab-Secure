const axios = require("axios");
const Participation = require("../models/Participation");
const Experiment = require("../models/Experiment");
const {
  IneligibleAgeError,
  InvalidMedicalTermError,
  ConflictingStudyError,
  DuplicateParticipationError,
} = require("../errors/CustomErrors");

/**
 * PART A: ELIGIBILITY & PROTOCOL ENGINE
 * The "Brain" that validates participants before enrollment
 */

class EligibilityService {
  /**
   * 1. PROTOCOL VALIDATION SERVICE
   * Validates user eligibility against experiment requirements
   */
  async validateProtocol(user, experiment) {
    // Extract protocol requirements from experiment
    const { eligibilityRules } = experiment;

    if (!eligibilityRules || Object.keys(eligibilityRules).length === 0) {
      return { valid: true, reason: "No eligibility rules defined" };
    }

    // Check minimum age requirement
    if (eligibilityRules.minAge && user.age < eligibilityRules.minAge) {
      throw new IneligibleAgeError(user.age, eligibilityRules.minAge);
    }

    // Check maximum age requirement
    if (eligibilityRules.maxAge && user.age > eligibilityRules.maxAge) {
      throw new IneligibleAgeError(user.age, eligibilityRules.maxAge);
    }

    // Check other custom rules
    if (eligibilityRules.requiredConditions && Array.isArray(eligibilityRules.requiredConditions)) {
      for (const condition of eligibilityRules.requiredConditions) {
        if (!user.medicalConditions || !user.medicalConditions.includes(condition)) {
          throw new Error(`User must have ${condition} to participate`);
        }
      }
    }

    return { valid: true, reason: "User passed all protocol checks" };
  }

  /**
   * 2. THIRD-PARTY TERMINOLOGY INTEGRATION
   * Validates medical terms against external Medical API (NIH/NCBI)
   * Shows "Additional Feature" capability
   */
  async validateMedicalTerm(medicalTerm) {
    try {
      // Call NIH NCBI Medical API to validate the term
      // This is a real API call that verifies the medical condition exists
      const response = await axios.get("https://clinicaltrialsapi.nlm.nih.gov/api/v2/conditions", {
        params: {
          q: medicalTerm,
          pageSize: 1,
        },
        timeout: 5000,
      });

      // Check if results found
      if (response.data.results && response.data.results.length > 0) {
        return {
          valid: true,
          term: medicalTerm,
          ncbiId: response.data.results[0].term,
          verified: true,
        };
      } else {
        throw new InvalidMedicalTermError(medicalTerm);
      }
    } catch (error) {
      // If API call fails, throw error
      if (error.name === "InvalidMedicalTermError") {
        throw error;
      }
      throw new InvalidMedicalTermError(medicalTerm);
    }
  }

  /**
   * 3. CONFLICT DETECTION
   * Checks if user's existing studies conflict with new enrollment
   * Example: Can't join both "Keto Diet Study" and "Low-Carb Study"
   */
  async detectConflicts(userId, newExperimentId) {
    // Get all active studies for this user
    const activeParticipations = await Participation.find({
      userId,
      status: "joined",
    }).populate("experimentId");

    if (activeParticipations.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    // Get the new experiment to check
    const newExperiment = await Experiment.findById(newExperimentId);

    if (!newExperiment || !newExperiment.eligibilityRules?.conflictsWith) {
      return { hasConflict: false, conflicts: [] };
    }

    // Find conflicts
    const conflicts = [];
    for (const participation of activeParticipations) {
      const existingExperiment = participation.experimentId;
      
      // Check if new experiment conflicts with existing ones
      if (
        newExperiment.eligibilityRules.conflictsWith &&
        newExperiment.eligibilityRules.conflictsWith.includes(existingExperiment._id.toString())
      ) {
        conflicts.push(existingExperiment);
      }

      // Check if existing experiment conflicts with new one
      if (
        existingExperiment.eligibilityRules?.conflictsWith &&
        existingExperiment.eligibilityRules.conflictsWith.includes(newExperimentId)
      ) {
        conflicts.push(existingExperiment);
      }
    }

    if (conflicts.length > 0) {
      throw new ConflictingStudyError(conflicts);
    }

    return { hasConflict: false, conflicts: [] };
  }

  /**
   * MAIN ENROLLMENT CHECK
   * Runs all three engines: Protocol, Medical Term, Conflict Detection
   */
  async runEligibilityCheck(user, experimentId) {
    // Fetch experiment
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
      throw new Error("Experiment not found");
    }

    // Check 1: Protocol Validation (age, medical conditions)
    await this.validateProtocol(user, experiment);

    // Check 2: Validate medical terms used in eligibility rules
    if (experiment.eligibilityRules?.medicalConditions) {
      for (const condition of experiment.eligibilityRules.medicalConditions) {
        await this.validateMedicalTerm(condition);
      }
    }

    // Check 3: Conflict Detection
    await this.detectConflicts(user.id, experimentId);

    return { eligible: true, message: "User passed all eligibility checks" };
  }
}

module.exports = new EligibilityService();
