const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/quiz-results — employee submits quiz answers — FR-04
// Body: { module_id, answers: [{ question_id, selected_option }] }
// Grading happens server-side against quiz_questions.correct_option — the client
// never sees correct answers in advance (see GET /api/modules/:id/quiz).
router.post("/", requireAuth, (req, res) => {
  const { module_id, answers } = req.body || {};
  if (!module_id || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "module_id and a non-empty answers array are required" });
  }

  const questions = db.prepare("SELECT question_id, correct_option FROM quiz_questions WHERE module_id = ?").all(module_id);
  if (!questions.length) return res.status(400).json({ error: "No quiz exists for this module" });

  const correctMap = Object.fromEntries(questions.map((q) => [q.question_id, q.correct_option]));
  let score = 0;
  for (const a of answers) {
    if (correctMap[a.question_id] && correctMap[a.question_id] === a.selected_option) score++;
  }
  const total = questions.length;

  const result = db
    .prepare("INSERT INTO quiz_results (user_id, module_id, score, total_questions) VALUES (?,?,?,?)")
    .run(req.user.user_id, module_id, score, total);

  // Mark the assignment completed (FR-03/FR-04 interaction)
  db.prepare(
    "UPDATE training_assignments SET status = 'completed', completed_at = ? WHERE user_id = ? AND module_id = ?"
  ).run(new Date().toISOString(), req.user.user_id, module_id);

  res.status(201).json({ result_id: result.lastInsertRowid, score, total_questions: total });
});

module.exports = router;
