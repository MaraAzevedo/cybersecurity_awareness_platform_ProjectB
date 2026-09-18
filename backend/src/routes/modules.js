const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/modules — any authenticated user
router.get("/", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT module_id, title, description, sequence_order FROM training_modules ORDER BY sequence_order").all();
  res.json(rows);
});

// GET /api/modules/:id — full detail including content
router.get("/:id", requireAuth, (req, res) => {
  const m = db.prepare("SELECT * FROM training_modules WHERE module_id = ?").get(req.params.id);
  if (!m) return res.status(404).json({ error: "Module not found" });
  res.json(m);
});

// POST /api/modules — admin creates a module
router.post("/", requireAuth, requireAdmin, (req, res) => {
  const { title, description, content_url, sequence_order } = req.body || {};
  if (!title) return res.status(400).json({ error: "title is required" });
  const result = db
    .prepare("INSERT INTO training_modules (title, description, content_url, sequence_order) VALUES (?,?,?,?)")
    .run(title, description || "", content_url || "", sequence_order || 1);
  const created = db.prepare("SELECT * FROM training_modules WHERE module_id = ?").get(result.lastInsertRowid);
  res.status(201).json(created);
});

// GET /api/modules/:id/quiz — questions without revealing the correct answer — FR-04
router.get("/:id/quiz", requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT question_id, question_text, option_a, option_b, option_c, option_d FROM quiz_questions WHERE module_id = ?")
    .all(req.params.id);
  if (!rows.length) return res.status(404).json({ error: "No quiz found for this module" });
  res.json(rows);
});

module.exports = router;
