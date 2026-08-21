import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app import create_app, db
from app.models import User, TrainingModule, Quiz


@pytest.fixture
def app():
    app = create_app("config.TestConfig")
    with app.app_context():
        yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def seeded(app):
    with app.app_context():
        admin = User(email="admin@example.com", role="admin")
        admin.set_password("AdminPass123!")
        employee = User(email="employee@example.com", role="employee")
        employee.set_password("EmployeePass123!")
        db.session.add_all([admin, employee])
        db.session.commit()

        module = TrainingModule(title="Test Module", content_type="text", content_body="<p>Content</p>")
        db.session.add(module)
        db.session.commit()

        quiz = Quiz(
            module_id=module.id,
            pass_threshold=70,
            questions_json=json.dumps([
                {"question": "2+2?", "choices": ["3", "4"], "answer_index": 1},
            ]),
        )
        db.session.add(quiz)
        db.session.commit()

        return {
            "admin_id": admin.id,
            "employee_id": employee.id,
            "module_id": module.id,
            "quiz_id": quiz.id,
        }


def login(client, email, password):
    return client.post("/auth/login", data={"email": email, "password": password}, follow_redirects=True)
