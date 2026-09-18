const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/reports/dashboard — admin summary — FR-07
router.get("/dashboard", requireAuth, requireAdmin, (req, res) => {
  const totals = db.prepare("SELECT COUNT(*) AS total FROM training_assignments").get().total;
  const completed = db
    .prepare("SELECT COUNT(*) AS n FROM training_assignments WHERE status = 'completed'")
    .get().n;
  const completion_rate = totals ? Math.round((completed / totals) * 100) : 0;

  const avgScoreRow = db
    .prepare("SELECT AVG(CAST(score AS FLOAT) / total_questions) AS avg_ratio FROM quiz_results")
    .get();
  const average_quiz_score = avgScoreRow.avg_ratio ? Math.round(avgScoreRow.avg_ratio * 100) : 0;

  const totalEvents = db.prepare("SELECT COUNT(*) AS n FROM phishing_events").get().n;
  const clickedEvents = db
    .prepare("SELECT COUNT(*) AS n FROM phishing_events WHERE status = 'clicked'")
    .get().n;
  const phishing_click_rate = totalEvents ? Math.round((clickedEvents / totalEvents) * 100) : 0;

  res.json({ completion_rate, average_quiz_score, phishing_click_rate });
});

module.exports = router;
