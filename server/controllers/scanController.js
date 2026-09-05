const Scan = require("../models/Scan");
const { getRiskAssessment } = require("../utils/mlService");

// @route POST /api/scan   (called by the browser extension)
const createScan = async (req, res, next) => {
  try {
    const { url, domHtml, forms, scripts } = req.body;
    if (!url) {
      return res.status(400).json({ message: "url is required" });
    }

    // 1. Save a pending record immediately
    const scan = await Scan.create({
      user: req.user._id,
      url,
      domHtmlSnapshot: domHtml,
      forms: forms || [],
      scripts: scripts || [],
      status: "pending",
    });

    // 2. Call the Python ML microservice (internal call, invisible to the extension)
    try {
      const result = await getRiskAssessment({ url, domHtml, forms, scripts });

      scan.status = "complete";
      scan.riskScore = result.riskScore;
      scan.verdict = result.verdict;
      scan.reasons = result.reasons || [];
      await scan.save();
    } catch (mlErr) {
      scan.status = "failed";
      scan.error = mlErr.message;
      await scan.save();
    }

    // 3. Relay the final result back to the extension
    res.status(201).json({
      scanId: scan._id,
      status: scan.status,
      riskScore: scan.riskScore,
      verdict: scan.verdict,
      reasons: scan.reasons,
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/history   (used by the React dashboard)
const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const [scans, total] = await Promise.all([
      Scan.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Scan.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      scans,
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/history/:id
const getScanById = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, user: req.user._id });
    if (!scan) return res.status(404).json({ message: "Scan not found" });
    res.json({ scan });
  } catch (err) {
    next(err);
  }
};

module.exports = { createScan, getHistory, getScanById };
