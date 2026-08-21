"""
Seeds the database with TEST accounts and demo content only.

Per the approved brief's assumptions (report Section 2): "Testing will use
simulated/test accounts, not real employee data." Do not point this
prototype at a real employee directory or real email addresses.
"""
import importlib
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
for candidate in (PROJECT_ROOT, PROJECT_ROOT.parent):
    candidate_str = str(candidate)
    if candidate_str not in sys.path:
        sys.path.insert(0, candidate_str)

app_module = None
for module_name in ("app", "prototype.app"):
    try:
        app_module = importlib.import_module(module_name)
        break
    except ModuleNotFoundError:
        pass

if app_module is None:
    raise ModuleNotFoundError("Could not import the Flask app package.")

create_app = app_module.create_app
db = app_module.db
models_module = importlib.import_module(f"{app_module.__name__}.models")
User = models_module.User
TrainingModule = models_module.TrainingModule
Quiz = models_module.Quiz

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    admin = User(email="admin@example.com", role="admin")
    admin.set_password("AdminPass123!")
    employee = User(email="employee@example.com", role="employee")
    employee.set_password("EmployeePass123!")
    db.session.add_all([admin, employee])
    db.session.commit()

    modules = [
        TrainingModule(
            title="Recognising Phishing Emails",
            content_type="text",
            order_index=1,
            content_body=(
                "<p>Phishing emails often create urgency, impersonate a trusted sender, "
                "and ask you to click a link or open an attachment. Always check the "
                "sender's real address and hover over links before clicking.</p>"
            ),
        ),
        TrainingModule(
            title="Strong Passwords & Password Managers",
            content_type="text",
            order_index=2,
            content_body=(
                "<p>Use a unique, long passphrase for every account, and store them in a "
                "password manager rather than reusing passwords or writing them down.</p>"
            ),
        ),
        TrainingModule(
            title="Reporting a Suspicious Email",
            content_type="text",
            order_index=3,
            content_body=(
                "<p>If an email looks suspicious, use the report button rather than "
                "clicking links or replying. Reporting early helps protect the whole "
                "organisation, and there is no penalty for reporting a false alarm.</p>"
            ),
        ),
    ]
    db.session.add_all(modules)
    db.session.commit()

    quiz_bank = [
        [
            {"question": "What is a common sign of a phishing email?", "choices": ["A generic greeting and urgent request", "Coming from a colleague you expect", "No links at all"], "answer_index": 0},
            {"question": "Before clicking a link, you should:", "choices": ["Click immediately", "Hover to preview the real destination", "Forward it to a friend"], "answer_index": 1},
        ],
        [
            {"question": "The safest way to manage many passwords is to:", "choices": ["Reuse one strong password everywhere", "Use a password manager", "Write them on a sticky note"], "answer_index": 1},
        ],
        [
            {"question": "If you're not sure an email is safe, you should:", "choices": ["Click the link to check", "Reply asking if it's real", "Use the report button"], "answer_index": 2},
        ],
    ]
    for m, questions in zip(modules, quiz_bank):
        db.session.add(Quiz(module_id=m.id, pass_threshold=70, questions_json=json.dumps(questions)))
    db.session.commit()

    print("Seeded database with 1 admin, 1 employee, and 3 training modules with quizzes.")
    print("Admin login:    admin@example.com / AdminPass123!")
    print("Employee login: employee@example.com / EmployeePass123!")
