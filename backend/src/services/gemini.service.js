const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate a text summary using the Gemini API.
 * @param {string} prompt - The prompt text to send to the model.
 * @returns {Promise<string>} - The generated text response.
 */
async function generateSummary(prompt) {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    contents: prompt,
  });
  if (typeof response.text === "string") return response.text;
  if (response.candidates && response.candidates[0]) {
    const part = response.candidates[0].content?.parts?.[0];
    if (part && typeof part.text === "string") return part.text;
  }
  return "";
}

module.exports = {
  generateSummary,
};
