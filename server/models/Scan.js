const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    domHtmlSnapshot: { type: String, select: false }, // stored but excluded by default (can be large)
    forms: { type: Array, default: [] },
    scripts: { type: Array, default: [] },
    status: {
      type: String,
      enum: ["pending", "complete", "failed"],
      default: "pending",
    },
    riskScore: { type: Number, min: 0, max: 100 },
    verdict: {
      type: String,
      enum: ["safe", "low risk", "medium risk", "high risk"],
    },
    reasons: { type: [String], default: [] },
    error: { type: String },
  },
  { timestamps: true }
);

scanSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Scan", scanSchema);
