const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function safeUser(u) {
  return { user_id: u.user_id, full_name: u.full_name, email: u.email, role: u.role, created_at: u.created_at };
}

// POST /api/users — admin creates an employee account — FR-01
router.post("/", requireAuth, requireAdmin, (req, res) => {
  const { full_name, email, password, role } = req.body || {};
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: "full_name, email, and password are required" });
  }
  const existing = db.prepare("SELECT user_id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "A user with this email already exists" });

  const hash = bcrypt.hashSync(password, 10);
  const finalRole = role === "admin" ? "admin" : "employee";
  const result = db
    .prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)")
    .run(full_name, email, hash, finalRole);
  const created = db.prepare("SELECT * FROM users WHERE user_id = ?").get(result.lastInsertRowid);
  res.status(201).json(safeUser(created));
});

// GET /api/users — admin lists all users
router.get("/", requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM users ORDER BY user_id").all();
  res.json(rows.map(safeUser));
});

// GET /api/users/:id — admin or self
router.get("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role !== "admin" && req.user.user_id !== id) {
    return res.status(403).json({ error: "Not authorized to view this user" });
  }
  const u = db.prepare("SELECT * FROM users WHERE user_id = ?").get(id);
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json(safeUser(u));
});

// PUT /api/users/:id — admin or self
router.put("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role !== "admin" && req.user.user_id !== id) {
    return res.status(403).json({ error: "Not authorized to update this user" });
  }
  const u = db.prepare("SELECT * FROM users WHERE user_id = ?").get(id);
  if (!u) return res.status(404).json({ error: "User not found" });

  const full_name = req.body.full_name ?? u.full_name;
  const email = req.body.email ?? u.email;
  db.prepare("UPDATE users SET full_name = ?, email = ? WHERE user_id = ?").run(full_name, email, id);
  res.json(safeUser(db.prepare("SELECT * FROM users WHERE user_id = ?").get(id)));
});

// DELETE /api/users/:id — admin only
router.delete("/:id", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const u = db.prepare("SELECT * FROM users WHERE user_id = ?").get(id);
  if (!u) return res.status(404).json({ error: "User not found" });
  db.prepare("DELETE FROM users WHERE user_id = ?").run(id);
  res.json({ message: "User removed" });
});

module.exports = router;
