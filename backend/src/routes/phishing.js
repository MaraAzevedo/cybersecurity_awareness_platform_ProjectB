const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// POST /api/phishing-campaigns — admin launches a simulated phishing campaign — FR-05
// Body: { name, template_subject, template_body, target_user_ids: [] }
router.post("/", requireAuth, requireAdmin, (req, res) => {
  const { name, template_subject, template_body, target_user_ids } = req.body || {};
  if (!name || !template_subject || !Array.isArray(target_user_ids) || target_user_ids.length === 0) {
    return res.status(400).json({ error: "name, template_subject, and at least one target_user_id are required" });
  }

  const campaign = db
    .prepare("INSERT INTO phishing_campaigns (name, template_subject, template_body, launched_by) VALUES (?,?,?,?)")
    .run(name, template_subject, template_body || "", req.user.user_id);

  const insertEvent = db.prepare(
    "INSERT INTO phishing_events (campaign_id, user_id, status) VALUES (?,?,'sent')"
  );
  for (const uid of target_user_ids) insertEvent.run(campaign.lastInsertRowid, uid);

  // NOTE: In this MVP, no real email is sent (per Section 3.3 assumptions — simulated data only).
  // A production build would queue an email here via the Notification module (C6) / SMTP provider (E2).

  res.status(201).json({
    campaign_id: campaign.lastInsertRowid,
    name,
    launched_at: new Date().toISOString(),
    target_count: target_user_ids.length,
  });
});

// GET /api/phishing-campaigns — admin lists campaigns
router.get("/", requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM phishing_campaigns ORDER BY campaign_id DESC").all();
  res.json(rows);
});

// GET /api/phishing-campaigns/:id/events — admin views results for a campaign — NFR-02: admin-only
router.get("/:id/events", requireAuth, requireAdmin, (req, res) => {
  const campaign = db.prepare("SELECT * FROM phishing_campaigns WHERE campaign_id = ?").get(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  const rows = db
    .prepare(
      `SELECT e.*, u.full_name, u.email
       FROM phishing_events e JOIN users u ON u.user_id = e.user_id
       WHERE e.campaign_id = ? ORDER BY e.event_id`
    )
    .all(req.params.id);
  res.json({ campaign, events: rows });
});

module.exports = router;

// ---- Public (unauthenticated) click-tracking route, mounted separately in server.js ----
// GET /api/phishing-events/:event_id/click
const publicRouter = express.Router();
publicRouter.get("/:event_id/click", (req, res) => {
  const ev = db.prepare("SELECT * FROM phishing_events WHERE event_id = ?").get(req.params.event_id);
  if (!ev) return res.status(404).send("Link not found or expired.");
  db.prepare("UPDATE phishing_events SET status = 'clicked', clicked_at = ? WHERE event_id = ?").run(
    new Date().toISOString(),
    ev.event_id
  );
  // In production this would redirect (302) to an educational "you clicked a simulated
  // phishing link" page rather than returning JSON. Kept simple here for API testing.
  res.status(200).send(
    "<h2>This was a simulated phishing test.</h2><p>Your click has been recorded for your organization's security awareness program. No real harm occurred — this page is part of your training.</p>"
  );
});
module.exports.publicRouter = publicRouter;
