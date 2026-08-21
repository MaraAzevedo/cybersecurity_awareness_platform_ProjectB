"""
Automated tests mapped to the test cases in the Assessment 1 report (Table 7).
Run with: pytest -v
"""
from app.models import User, Progress, PhishingCampaign, PhishingEvent
from .conftest import login


def test_tc01_registration_creates_account(client, app):
    resp = client.post(
        "/auth/register",
        data={"email": "new.employee@example.com", "password": "SafePass123!", "confirm": "SafePass123!"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    with app.app_context():
        assert User.query.filter_by(email="new.employee@example.com").first() is not None


def test_tc02_valid_login_reaches_dashboard(client, seeded):
    resp = login(client, "employee@example.com", "EmployeePass123!")
    assert resp.status_code == 200
    assert b"My assigned training" in resp.data or b"training" in resp.data.lower()


def test_tc02b_invalid_login_rejected(client, seeded):
    resp = client.post(
        "/auth/login",
        data={"email": "employee@example.com", "password": "wrong-password"},
        follow_redirects=True,
    )
    assert b"Invalid email or password" in resp.data


def test_tc03_password_never_stored_in_plaintext(app, seeded):
    with app.app_context():
        user = User.query.filter_by(email="employee@example.com").first()
        assert user.password_hash != "EmployeePass123!"
        assert user.check_password("EmployeePass123!")


def test_tc04_module_progress_persists(client, app, seeded):
    login(client, "employee@example.com", "EmployeePass123!")
    module_id = seeded["module_id"]
    client.get(f"/training/modules/{module_id}")  # creates in_progress row
    client.post(f"/training/modules/{module_id}/complete", follow_redirects=True)
    with app.app_context():
        progress = Progress.query.filter_by(
            user_id=seeded["employee_id"], module_id=module_id
        ).first()
        assert progress.status == "completed"


def test_tc05_quiz_scoring_pass_and_fail(client, seeded):
    login(client, "employee@example.com", "EmployeePass123!")
    quiz_id = seeded["quiz_id"]

    correct = client.post(f"/training/quiz/{quiz_id}", data={"q0": "1"}, follow_redirects=True)
    assert b"Passed" in correct.data

    wrong = client.post(f"/training/quiz/{quiz_id}", data={"q0": "0"}, follow_redirects=True)
    assert b"Not yet passed" in wrong.data


def test_tc06_phishing_click_recorded(client, app, seeded):
    login(client, "admin@example.com", "AdminPass123!")
    launch = client.post("/phishing/admin/launch", data={"template": "it_helpdesk"}, follow_redirects=True)
    assert launch.status_code == 200

    with app.app_context():
        campaign = PhishingCampaign.query.first()
        assert campaign is not None
        from app.phishing import make_tracking_link
        link = make_tracking_link(campaign.id, seeded["employee_id"])

    token = link.split("/track/")[1]
    resp = client.get(f"/phishing/track/{token}", follow_redirects=True)
    assert resp.status_code == 200

    with app.app_context():
        event = PhishingEvent.query.filter_by(
            campaign_id=campaign.id, user_id=seeded["employee_id"], event_type="click"
        ).first()
        assert event is not None


def test_tc07_admin_dashboard_reflects_seed_data(client, seeded):
    login(client, "admin@example.com", "AdminPass123!")
    resp = client.get("/admin/dashboard")
    assert resp.status_code == 200
    assert b"Test Module" in resp.data


def test_tc08_employee_cannot_access_admin_dashboard(client, seeded):
    login(client, "employee@example.com", "EmployeePass123!")
    resp = client.get("/admin/dashboard")
    assert resp.status_code == 403


def test_tc08b_unauthenticated_user_redirected_from_protected_route(client):
    resp = client.get("/training/modules", follow_redirects=False)
    assert resp.status_code in (302, 401)
