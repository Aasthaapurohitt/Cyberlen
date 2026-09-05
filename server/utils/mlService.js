const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const TIMEOUT = Number(process.env.ML_SERVICE_TIMEOUT_MS) || 8000;

/**
 * Calls the Python FastAPI /predict endpoint with the scraped page payload.
 * Falls back to a deterministic mock response if the ML service is
 * unreachable — useful so the Express + extension flow can be developed
 * and demoed before the ML service is fully wired up.
 */
const getRiskAssessment = async ({ url, domHtml, forms, scripts }) => {
  try {
    const { data } = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      { url, domHtml, forms, scripts },
      { timeout: TIMEOUT }
    );
    // Expecting: { riskScore, verdict, reasons }
    return data;
  } catch (err) {
    console.warn(
      `[mlService] Falling back to mock response (${err.code || err.message}).`
    );
    return mockAssessment(url);
  }
};

const mockAssessment = (url) => {
  const suspiciousHints = ["login", "verify", "secure", "update", "bank"];
  const hasHint = suspiciousHints.some((h) => url.toLowerCase().includes(h));
  const riskScore = hasHint ? 78 : 22;
  return {
    riskScore,
    verdict:
      riskScore >= 70 ? "high risk" : riskScore >= 40 ? "medium risk" : "low risk",
    reasons: hasHint
      ? [
          "URL contains suspicious keywords commonly used in phishing",
          "Mock response — ML service unreachable",
        ]
      : ["No suspicious lexical patterns detected", "Mock response — ML service unreachable"],
  };
};

module.exports = { getRiskAssessment };
