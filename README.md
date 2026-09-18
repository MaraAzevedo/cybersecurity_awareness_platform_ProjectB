# Employee Cybersecurity Awareness Platform — Working Prototype

This is a real, running implementation of the design in Assessment 1 (ICT503),
matching Section 3.7's technical specification:

- **Backend:** Node.js + Express, SQLite (dev database), JWT authentication, bcrypt password hashing
- **Frontend:** React (Vite)
- **Schema:** matches Section 3.7.C exactly (translated to SQLite syntax for local dev)
- **API:** implements every endpoint from Section 3.7.D

This is **not** deployed anywhere — it runs on your own machine. Section 3.7.A's
production plan (Azure App Service + Azure Database for PostgreSQL) is the
deployment target for a real rollout; this local setup is for development,
demonstration, and grading purposes.

## Prerequisites

- [Node.js](https://nodejs.org) v18 or later (this was built and tested on v22)
- npm (comes with Node.js)

## 1. Backend setup

```bash
cd backend
npm install
npm run seed     # creates data.sqlite and loads demo accounts + content
npm run dev       # starts the API on http://localhost:4000
```

Leave this running in its own terminal.

### Demo accounts (all use the same password)

| Role | Email | Password |
|---|---|---|
| Admin | alex.morgan@acme.test | Password123! |
| Employee | jordan.lee@acme.test | Password123! |
| Employee | sam.rivera@acme.test | Password123! |
| Employee | casey.kim@acme.test | Password123! |

⚠️ These are **simulated/test accounts only** (per Section 3.3's assumptions) —
no real employee data is used anywhere in this build.

To reset the database back to its original seed state at any time:

```bash
cd backend
npm run seed
```

(This wipes and reloads all data — useful if a demo session gets messy.)

## 2. Frontend setup

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Then open the URL it prints (typically **http://localhost:5173**).

The frontend is configured (`vite.config.js`) to proxy `/api/*` requests to
the backend at `localhost:4000`, so both servers need to be running at the
same time.

## What's implemented

| Requirement | Where |
|---|---|
| FR-01 Admin creates/manages employees | `POST/GET/PUT/DELETE /api/users` |
| FR-02 Admin assigns training | `POST /api/assignments` |
| FR-03 Employee views/completes modules | `GET /api/assignments`, `PATCH /api/assignments/:id/complete` |
| FR-04 Quiz engine | `GET /api/modules/:id/quiz`, `POST /api/quiz-results` (graded server-side) |
| FR-05 Launch phishing simulation | `POST /api/phishing-campaigns` |
| FR-06 Track phishing interaction | `GET /api/phishing-events/:id/click` (public link, no auth) |
| FR-07 Admin dashboard | `GET /api/reports/dashboard` |
| FR-08 Secure login | `POST /api/auth/login` (bcrypt + JWT) |
| NFR-01 Password hashing | bcrypt, 10 salt rounds, `src/routes/auth.js` / `users.js` |
| NFR-02 Access restricted to relevant employee/admin | Role checks in every route via `middleware/auth.js` |

## Known limitations (honest, by design — see Section 3.3 "Out of Scope")

- **No real email is sent.** Launching a phishing campaign creates the
  campaign/event records but does not dispatch actual email — the "Simulate
  click" button in the UI (and the public `/api/phishing-events/:id/click`
  endpoint) stand in for "an employee clicked the link in their inbox."
- **SQLite is for local development only.** Section 3.7.A specifies Azure
  Database for PostgreSQL for the deployed version — this repo does not include
  that deployment configuration, only the local dev setup.
- **No password reset / email verification flow** — out of scope for the MVP.
- **The frontend keeps the auth token in memory only** (not localStorage), so
  refreshing the page logs you out. This was a deliberate simplification for
  this build; a production version would need a proper persistent-session
  strategy.
- **Rate limiting is not implemented** (documented in Section 3.7.D as a known
  MVP gap).

## Verifying it's "real" (not just a UI mock)

A few ways to convince yourself this isn't just faking it in the browser:

1. Take a quiz as an employee, then run:
   ```bash
   cd backend
   node -e "const db=require('./src/db'); console.log(db.prepare('SELECT * FROM quiz_results').all())"
   ```
   You'll see your actual submitted score stored in the database.
2. Try tampering with a quiz submission (e.g. via curl, sending a fake
   `score: 999` in the request body) — the server ignores it and grades
   independently from `quiz_questions.correct_option`.
3. Log in as an employee and try `GET /api/users` with that employee's token —
   you'll get a 403, proving role-based access control is enforced server-side,
   not just hidden in the UI.

## Project structure

```
cyberaware-app/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app entry point
│   │   ├── db.js              # SQLite schema (Section 3.7.C)
│   │   ├── seed.js            # demo/test data loader
│   │   ├── middleware/auth.js # JWT + role-based access control
│   │   └── routes/            # one file per API resource (Section 3.7.D)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx             # top-level routing (login/employee/admin)
    │   ├── api.js               # fetch wrapper for the backend API
    │   └── components/          # Login, Sidebar, employee & admin screens
    └── package.json
```
```
