// seed.js — populates the dev database with demo/test data only (per Section 3.3 assumptions:
// simulated/test accounts, never real employee data).
const bcrypt = require("bcryptjs");
const db = require("./db");

const DEMO_PASSWORD = "Password123!";

function reset() {
  db.exec(`
    DELETE FROM phishing_events;
    DELETE FROM phishing_campaigns;
    DELETE FROM quiz_results;
    DELETE FROM quiz_questions;
    DELETE FROM training_assignments;
    DELETE FROM training_modules;
    DELETE FROM users;
  `);
}

function seed() {
  reset();
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  const insertUser = db.prepare(
    "INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)"
  );
  const admin = insertUser.run("Alex Morgan", "alex.morgan@acme.test", hash, "admin");
  const u1 = insertUser.run("Jordan Lee", "jordan.lee@acme.test", hash, "employee");
  const u2 = insertUser.run("Sam Rivera", "sam.rivera@acme.test", hash, "employee");
  const u3 = insertUser.run("Casey Kim", "casey.kim@acme.test", hash, "employee");

  const insertModule = db.prepare(
    "INSERT INTO training_modules (title, description, content_url, sequence_order) VALUES (?,?,?,?)"
  );
  const m1 = insertModule.run(
    "Recognizing Phishing Emails",
    "Spot the red flags that give away a phishing attempt before you click.",
    "Phishing emails often create a false sense of urgency (e.g. 'your account will be suspended in 24 hours'), use lookalike sender addresses, and contain links that don't match their display text. Before clicking any link, hover over it to check the real destination, and verify unexpected requests through a separate channel rather than replying directly.",
    1
  );
  const m2 = insertModule.run(
    "Password Hygiene",
    "Build passwords and habits that hold up under real-world attacks.",
    "Strong passwords are long, unique per account, and stored in a password manager rather than reused or written down. Enable multi-factor authentication wherever it is offered. Never share your password with anyone, including IT staff, who will never legitimately ask for it.",
    2
  );
  const m3 = insertModule.run(
    "Social Engineering Awareness",
    "Recognize manipulation tactics used to bypass technical security controls.",
    "Social engineering exploits trust and urgency rather than technical flaws. Always verify identity through an independent channel before granting access or sharing information, no matter how confident or authoritative the requester sounds.",
    3
  );

  const insertQ = db.prepare(
    "INSERT INTO quiz_questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?,?,?,?,?,?,?)"
  );
  insertQ.run(m1.lastInsertRowid, "Which of these is a common phishing red flag?", "A calm, no-rush tone", "Urgent threats or deadlines", "A sender you recognize", "Perfect grammar", "b");
  insertQ.run(m1.lastInsertRowid, "What should you do before clicking a link in an unexpected email?", "Click it quickly before it expires", "Hover to check the real destination", "Forward it to a friend", "Reply asking if it is real", "b");
  insertQ.run(m2.lastInsertRowid, "What makes a password strongest against modern attacks?", "Short but complex", "Reused across all accounts", "Long and unique per account", "Written on a sticky note", "c");
  insertQ.run(m2.lastInsertRowid, "Who should you share your password with?", "IT support if they ask", "Your manager", "No one", "A trusted coworker", "c");
  insertQ.run(m3.lastInsertRowid, "Social engineering primarily exploits...", "Software vulnerabilities", "Human trust and urgency", "Network hardware", "Outdated browsers", "b");
  insertQ.run(m3.lastInsertRowid, "Best response to an unverified caller claiming to be IT asking for your password?", "Give it, they probably need it", "Verify independently before sharing anything", "Ask a coworker what to do", "Change the subject", "b");

  const insertAssign = db.prepare(
    "INSERT INTO training_assignments (user_id, module_id, status, completed_at) VALUES (?,?,?,?)"
  );
  insertAssign.run(u1.lastInsertRowid, m1.lastInsertRowid, "completed", new Date().toISOString());
  insertAssign.run(u1.lastInsertRowid, m2.lastInsertRowid, "assigned", null);
  insertAssign.run(u1.lastInsertRowid, m3.lastInsertRowid, "assigned", null);
  insertAssign.run(u2.lastInsertRowid, m1.lastInsertRowid, "completed", new Date().toISOString());
  insertAssign.run(u2.lastInsertRowid, m2.lastInsertRowid, "assigned", null);
  insertAssign.run(u3.lastInsertRowid, m1.lastInsertRowid, "assigned", null);

  const insertResult = db.prepare(
    "INSERT INTO quiz_results (user_id, module_id, score, total_questions) VALUES (?,?,?,?)"
  );
  insertResult.run(u1.lastInsertRowid, m1.lastInsertRowid, 2, 2);
  insertResult.run(u2.lastInsertRowid, m1.lastInsertRowid, 1, 2);

  const insertCampaign = db.prepare(
    "INSERT INTO phishing_campaigns (name, template_subject, template_body, launched_by) VALUES (?,?,?,?)"
  );
  const camp = insertCampaign.run(
    "Q3 Printer Notice",
    "Your print job failed — action required",
    "Click here to view your failed print job and resend it.",
    admin.lastInsertRowid
  );

  const insertEvent = db.prepare(
    "INSERT INTO phishing_events (campaign_id, user_id, status, clicked_at, reported_at) VALUES (?,?,?,?,?)"
  );
  insertEvent.run(camp.lastInsertRowid, u1.lastInsertRowid, "reported", null, new Date().toISOString());
  insertEvent.run(camp.lastInsertRowid, u2.lastInsertRowid, "clicked", new Date().toISOString(), null);
  insertEvent.run(camp.lastInsertRowid, u3.lastInsertRowid, "no_action", null, null);

  console.log("Seed complete.");
  console.log("Demo login password for all accounts:", DEMO_PASSWORD);
  console.log("Admin:    alex.morgan@acme.test");
  console.log("Employee: jordan.lee@acme.test");
  console.log("Employee: sam.rivera@acme.test");
  console.log("Employee: casey.kim@acme.test");
}

seed();
