const express = require("express");
const { createScan, getHistory, getScanById } = require("../controllers/scanController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/scan", protect, createScan);
router.get("/history", protect, getHistory);
router.get("/history/:id", protect, getScanById);

module.exports = router;
