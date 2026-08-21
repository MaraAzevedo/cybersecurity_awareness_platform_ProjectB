# Employee Cybersecurity Awareness Platform — Prototype

> Project B - Cybersecurity Awareness Platform for the MIT course that simulates access of stakeholders, quizzes, assigned tasks and dashboard with the percentage/results of it.


A working Flask prototype for Assessment 1, implementing FR01–FR08 as described in the
accompanying report (`Task1_Assessment1_Report.docx`), Section 6 (Technical Specifications)
and Table 6 (API Specifications).

**Important — test data only.** This prototype must only ever be run against simulated/test
accounts, never real employee email addresses or real phishing targets (see report Section 2,
Assumptions and Constraints, and Section 6.E, Ethics).

## What's implemented

| Requirement | Where |
|---|---|
| FR01/FR08 secure register/login | `app/auth.py`, hashed passwords via `werkzeug.security` |
| FR02/FR03 role-based modules + progress tracking | `app/training.py` |
| FR02/FR03 quiz engine | `app/training.py` (`take_quiz`) |
| FR04–FR06 phishing simulation + click/report tracking | `app/phishing.py` |
| FR07 admin dashboard | `app/admin.py` |
| NFR01 password hashing | `app/models.py` (`User.set_password`) |
| NFR02 privacy / access control | role checks in every blueprint route |
| NFR06 accessibility | semantic HTML, labels, skip-link, contrast-checked CSS in `app/templates`, `app/static/style.css` |

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                   # creates awareness.db with 1 admin + 1 employee TEST account
python run.py                    # runs at http://127.0.0.1:5000
```

Demo accounts (test data only):
- Admin: `admin@example.com` / `AdminPass123!`
- Employee: `employee@example.com` / `EmployeePass123!`

## How to demo the phishing-simulation flow

This prototype does **not** send real email (no budget for a paid SMTP provider — see report
Section 2). Instead:

1. Sign in as the admin and open **Launch phishing test**.
2. Choose a template and launch — you'll see a table of signed tracking links, one per test
   employee, exactly as would normally be emailed to them.
3. Open one of those links (simulating the employee clicking it in their inbox) — you'll land
   on the non-punitive education page, and a `click` event is recorded.
4. Go back to the admin dashboard to see the click rate update.

## Running the tests

```bash
pip install -r requirements.txt   # includes pytest, pytest-flask
python -m pytest tests/ -v
```

Ten tests are included, covering test cases TC-01–TC-08 from the report's Table 7 (Test Plan).

## Known simplifications vs. the full design in the report

- The `ROLE` entity in Figure 2 (ERD) is simplified to a `role` string column on `User` rather
  than a separate table with a foreign key, to keep the two-day build in scope.
- Quiz questions are stored as JSON on the `Quiz` row rather than a separate `QUESTION` table.
- No real SMTP integration — see "How to demo" above.
- Password hashing uses Werkzeug's default (PBKDF2-SHA256) for zero extra native dependencies
  in a sandboxed environment; the report's technical specification (Section 6.E) recommends
  moving to Argon2id per current OWASP guidance before any real deployment.
- No automated WCAG scan is wired into CI; run one manually (e.g. axe or Lighthouse) per
  Test Plan test case TC-09.

## Project layout

```
prototype/
  app/
    __init__.py       # application factory, blueprint registration
    models.py          # SQLAlchemy models (Figure 2 ERD)
    auth.py             # FR01, FR08, NFR01
    training.py          # FR02, FR03
    phishing.py           # FR04, FR05, FR06
    admin.py                # FR07
    templates/                # Jinja2 templates
    static/style.css           # accessible, high-contrast styling (NFR06)
  tests/
    conftest.py         # pytest fixtures (test app, test client, seeded data)
    test_app.py           # TC-01..TC-08 automated tests
  config.py
  seed.py               # creates TEST accounts + demo content only
  run.py                 # dev server entry point
  requirements.txt
```
