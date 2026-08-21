"""
Phishing-simulation blueprint — FR04 (generate simulated phishing emails and
record click/report rate), FR05 (admin launches a basic simulated phishing
test), FR06 (record employee interaction with simulated phishing emails).

Design note (ethics, see report Sections 2 and 6.E): this prototype never
sends email to real addresses and never asks for or captures a password.
The tracking link only records that a specific TEST account clicked a
specific TEST campaign, then immediately shows a short, non-punitive
educational page -- consistent with the brief's psychological-safety
requirement.
"""
from itsdangerous import URLSafeTimedSerializer, BadSignature
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import login_required, current_user

from . import db
from .models import User, PhishingCampaign, PhishingEvent

phishing_bp = Blueprint("phishing", __name__, url_prefix="/phishing")

TEMPLATES = {
    "password_reset": {
        "subject": "Action required: verify your password reset",
        "body_preview": "We noticed a request to reset your password. If this wasn't you, click below to secure your account.",
    },
    "invoice_overdue": {
        "subject": "Invoice #4471 overdue — please review",
        "body_preview": "Your payment for invoice #4471 could not be processed. Please review the attached statement.",
    },
    "it_helpdesk": {
        "subject": "IT Helpdesk: your mailbox is almost full",
        "body_preview": "Your mailbox has reached 95% capacity. Click below to request additional storage.",
    },
}


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="phishing-track")


def make_tracking_link(campaign_id, user_id):
    token = _serializer().dumps({"c": campaign_id, "u": user_id})
    return url_for("phishing.track", token=token, _external=True)


@phishing_bp.route("/admin/launch", methods=["GET", "POST"])
@login_required
def launch():
    if not current_user.is_admin:
        abort(403)
    employees = User.query.filter_by(role="employee").all()
    if request.method == "POST":
        template_key = request.form.get("template")
        template = TEMPLATES.get(template_key)
        if not template:
            flash("Choose a valid template.", "error")
            return render_template("phishing_launch.html", templates=TEMPLATES, employees=employees)

        campaign = PhishingCampaign(
            template_name=template_key,
            subject=template["subject"],
            body_preview=template["body_preview"],
            launched_by=current_user.id,
        )
        db.session.add(campaign)
        db.session.commit()

        links = []
        for emp in employees:
            db.session.add(PhishingEvent(campaign_id=campaign.id, user_id=emp.id, event_type="sent"))
            links.append((emp.email, make_tracking_link(campaign.id, emp.id)))
        db.session.commit()

        # NOTE: no real SMTP send in this prototype -- links are shown on
        # screen for demo/testing purposes only (see README "How to demo").
        return render_template("phishing_sent.html", campaign=campaign, links=links)

    return render_template("phishing_launch.html", templates=TEMPLATES, employees=employees)


@phishing_bp.route("/track/<token>")
def track(token):
    try:
        data = _serializer().loads(token, max_age=60 * 60 * 24 * 30)  # 30-day link validity
    except BadSignature:
        abort(404)

    campaign_id, user_id = data["c"], data["u"]
    existing = PhishingEvent.query.filter_by(
        campaign_id=campaign_id, user_id=user_id, event_type="click"
    ).first()
    if not existing:
        db.session.add(PhishingEvent(campaign_id=campaign_id, user_id=user_id, event_type="click"))
        db.session.commit()
    return redirect(url_for("phishing.education", token=token))


@phishing_bp.route("/report/<token>", methods=["POST"])
def report(token):
    try:
        data = _serializer().loads(token, max_age=60 * 60 * 24 * 30)
    except BadSignature:
        abort(404)
    campaign_id, user_id = data["c"], data["u"]
    existing = PhishingEvent.query.filter_by(
        campaign_id=campaign_id, user_id=user_id, event_type="report"
    ).first()
    if not existing:
        db.session.add(PhishingEvent(campaign_id=campaign_id, user_id=user_id, event_type="report"))
        db.session.commit()
    flash("Thanks for reporting this — that's exactly the right move.", "success")
    return redirect(url_for("index"))


@phishing_bp.route("/education/<token>")
def education(token):
    # Just-in-time, non-punitive education page (psychological safety —
    # see report Section 2 / 6.E). Deliberately does not name the employee
    # anywhere a manager could see it.
    return render_template("phishing_education.html", token=token)
