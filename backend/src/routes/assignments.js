const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/assignments — admin assigns a module to an employee — FR-02
router.post("/", requireAuth, requireAdmin, (req, res) => {
  const { user_id, module_id } = req.body || {};
  if (!user_id || !module_id) return res.status(400).json({ error: "user_id and module_id are required" });

  const existing = db
    .prepare("SELECT assignment_id FROM training_assignments WHERE user_id = ? AND module_id = ?")
    .get(user_id, module_id);
  if (existing) return res.status(409).json({ error: "This module is already assigned to this user" });

  const result = db
    .prepare("INSERT INTO training_assignments (user_id, module_id, status) VALUES (?,?,'assigned')")
    .run(user_id, module_id);
  const created = db.prepare("SELECT * FROM training_assignments WHERE assignment_id = ?").get(result.lastInsertRowid);
  res.status(201).json(created);
});

// GET /api/assignments?user_id=me — employee views their own assignments — FR-03
// GET /api/assignments?user_id=<id> — admin can view any user's assignments
router.get("/", requireAuth, (req, res) => {
  let targetId = req.query.user_id;
  if (targetId === "me" || !targetId) targetId = req.user.user_id;
  targetId = Number(targetId);

  if (req.user.role !== "admin" && req.user.user_id !== targetId) {
    return res.status(403).json({ error: "Not authorized to view another user's assignments" });
  }

  const rows = db
    .prepare(
      `SELECT a.*, m.title AS module_title, m.description AS module_description
       FROM training_assignments a
       JOIN training_modules m ON m.module_id = a.module_id
       WHERE a.user_id = ?
       ORDER BY a.assignment_id`
    )
    .all(targetId);
  res.json(rows);
});

// PATCH /api/assignments/:id/complete — employee marks their own assignment complete
router.patch("/:id/complete", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const a = db.prepare("SELECT * FROM training_assignments WHERE assignment_id = ?").get(id);
  if (!a) return res.status(404).json({ error: "Assignment not found" });
  if (req.user.role !== "admin" && req.user.user_id !== a.user_id) {
    return res.status(403).json({ error: "Not authorized to update this assignment" });
  }
  const completedAt = new Date().toISOString();
  db.prepare("UPDATE training_assignments SET status = 'completed', completed_at = ? WHERE assignment_id = ?").run(completedAt, id);
  res.json(db.prepare("SELECT * FROM training_assignments WHERE assignment_id = ?").get(id));
});

module.exports = router;
