const { GoogleGenAI } = require("@google/genai");
const benefitService = require("./benefitService");

function extractResponseText(response) {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();

  return text || "";
}

function buildSummaryFailure(errorMessage, statusCode = 503, errorCode = "GEMINI_UNAVAILABLE") {
  return {
    ok: false,
    text: "",
    statusCode,
    errorCode,
    errorMessage,
  };
}

async function generateSummaryResult(prompt) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_api_key_here") {
    console.warn("Gemini API: Missing apiKey.");
    return buildSummaryFailure(
      "Gemini API key is missing. Set GEMINI_API_KEY in backend/.env and restart the backend.",
      503,
      "GEMINI_MISSING_KEY"
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = extractResponseText(response);
    if (!text) {
      return buildSummaryFailure(
        "Gemini returned an empty response for the summary request.",
        502,
        "GEMINI_EMPTY_RESPONSE"
      );
    }

    return {
      ok: true,
      text,
      statusCode: 200,
      errorCode: null,
      errorMessage: null,
    };
  } catch (err) {
    const details =
      err?.message ||
      err?.error?.message ||
      err?.statusText ||
      "Unknown Gemini API error";
    const statusCode = Number(err?.status) || Number(err?.code) || 503;

    console.error("Gemini API Error:", details);
    return buildSummaryFailure(`Gemini API request failed: ${details}`, statusCode);
  }
}

/**
 * Generate a text summary using the Gemini API.
 * @param {string} prompt - The prompt text to send to the model.
 * @returns {Promise<string>} - The generated text response.
 */
async function generateSummary(prompt) {
  const result = await generateSummaryResult(prompt);
  return result.ok ? result.text : "FALLBACK_MODE";
}

/**
 * Perform semantic matching between user conditions and study exclusions.
 * This provides "Professional Conflict Detection" using NLP.
 */
async function verifyClinicalEligibility(userConditions, excludedConditions) {
  if (!excludedConditions || excludedConditions.length === 0) {
    return { eligible: true };
  }

  const prompt = `
    Role: Senior Clinical Data Architect
    Task: Semantic Conflict Detection for Clinical Trial Eligibility
    
    Participant Medical History: [${userConditions.join(", ")}]
    Study Exclusion Criteria: [${excludedConditions.join(", ")}]

    Determine if there is a clinical conflict. 
    A conflict exists if:
    1. A condition in the history is a SUBTYPE or SYNONYM of an exclusion criteria (e.g., "Type 2 Diabetes" matches "Diabetes").
    2. A condition falls under the same clinical CLASS (e.g., "Asthma" matches "Chronic Obstructive Pulmonary Diseases").

    Format your response as a JSON object:
    {
      "isConflicted": boolean,
      "conflictReason": "Professional clinical justification (1 sentence)",
      "clinicalExplanation": "Detailed explanation mentioning the specific mapping found"
    }
  `;

  const result = await generateSummary(prompt);

  if (result === "FALLBACK_MODE") {
    // Basic rule-based semantic fallback for demo mode.
    const conflict = userConditions.find((u) =>
      excludedConditions.some((e) => u.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(u.toLowerCase()))
    );

    if (conflict) {
      return {
        isConflicted: true,
        conflictReason: "Clinical Conflict Detected (Simulated)",
        clinicalExplanation: `Our semantic engine detected a potential overlap between your condition '${conflict}' and the study exclusions. Even in simulated mode, this constitutes a protocol risk.`,
      };
    }
    return { isConflicted: false };
  }

  try {
    // Attempt to extract JSON from the response.
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { isConflicted: false };
  } catch (e) {
    console.error("Gemini Medical Parsing Error:", e);
    return { isConflicted: false };
  }
}

/**
 * Generate a personalized benefit analysis for a user joining an experiment.
 * This highlights "Participant Lifecycle" engagement and "Technical Depth".
 */
async function generatePersonalizedBenefitAnalysis(user, experiment) {
  // Generate rule-based insights first because they are deterministic and useful as fallback.
  const ruleBasedInsights = benefitService.generateInsights(user, experiment);

  const profile = {
    age: user.age,
    gender: user.gender,
    weight: user.weight,
    bmi: user.bmi,
    sleepPatterns: user.sleepPatterns || "Not provided",
    smokingStatus: user.smokingStatus || "Not provided",
    activityLevel: user.activityLevel || "Not provided",
    medicalHistory: (user.medicalConditions || []).join(", "),
  };

  const prompt = `
    Role: Senior Clinical Study Consultant
    Task: Decision Support Narrative Generation
    
    User Profile:
    - Age: ${profile.age}
    - Gender: ${profile.gender}
    - Weight: ${profile.weight}kg
    - BMI: ${profile.bmi}
    - Habits: Sleep [${profile.sleepPatterns}], Smoking [${profile.smokingStatus}], Activity [${profile.activityLevel}]
    - History: [${profile.medicalHistory}]
    
    Experiment context:
    - Title: "${experiment.title}"
    - Description: "${experiment.description}"
    - Key Focus Tags: [${(experiment.tags || []).join(", ")}]

    Deterministic Clinical Insights:
    ${ruleBasedInsights.map((i) => `- ${i}`).join("\n")}
    
    INSTRUCTIONS:
    Build upon the Deterministic Clinical Insights above. 
    Synthesize them into a cohesive, 2-3 sentence professional narrative that WOWs the user. 
    Explain exactly "Why" this study is a strategic fit for their health journey.
    Maintain a professional, medical-grade tone.
  `;

  console.log(`[Insight Engine] Generating narrative for ${user.email} (Study: "${experiment.title}")`);
  const result = await generateSummary(prompt);

  // High-quality non-AI fallback.
  if (result === "FALLBACK_MODE") {
    console.log("[Insight Engine] AI unavailable. Returning deterministic rule-based insights.");
    return ruleBasedInsights.join(" ");
  }

  return result;
}

module.exports = {
  generateSummary,
  generateSummaryResult,
  verifyClinicalEligibility,
  generatePersonalizedBenefitAnalysis,
};
