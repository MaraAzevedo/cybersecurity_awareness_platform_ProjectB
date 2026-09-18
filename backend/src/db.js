// db.js
// Development database: SQLite (per Section 3.7.A/B).
// Schema mirrors the production PostgreSQL schema in Section 3.7.C,
// translated to SQLite syntax (INTEGER PRIMARY KEY AUTOINCREMENT instead of SERIAL,
// TEXT instead of VARCHAR, CHECK constraints preserved).

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data.sqlite");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    user_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name      TEXT NOT NULL,
    email          TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    role           TEXT NOT NULL CHECK (role IN ('admin','employee')),
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_modules (
    module_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    description     TEXT,
    content_url     TEXT,
    sequence_order  INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_assignments (
    assignment_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    module_id      INTEGER NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
    assigned_at    TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at   TEXT NULL,
    status         TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed')),
    UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    question_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id       INTEGER NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    option_a        TEXT NOT NULL,
    option_b        TEXT NOT NULL,
    option_c        TEXT NOT NULL,
    option_d        TEXT NOT NULL,
    correct_option  TEXT NOT NULL CHECK (correct_option IN ('a','b','c','d'))
);

CREATE TABLE IF NOT EXISTS quiz_results (
    result_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    module_id        INTEGER NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
    score            INTEGER NOT NULL,
    total_questions  INTEGER NOT NULL,
    completed_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS phishing_campaigns (
    campaign_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    template_subject TEXT NOT NULL,
    template_body    TEXT NOT NULL,
    launched_by      INTEGER NOT NULL REFERENCES users(user_id),
    launched_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS phishing_events (
    event_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id    INTEGER NOT NULL REFERENCES phishing_campaigns(campaign_id) ON DELETE CASCADE,
    user_id        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    email_sent_at  TEXT NOT NULL DEFAULT (datetime('now')),
    clicked_at     TEXT NULL,
    reported_at    TEXT NULL,
    status         TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','clicked','reported','no_action'))
);
`);

module.exports = db;
