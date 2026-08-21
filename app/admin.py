"""
Admin blueprint — FR07 (administrator dashboard illustrating completion
rates and quiz results). NFR02: this entire blueprint is admin-only;
every route checks current_user.is_admin server-side (not just hidden in
the UI), and only aggregate figures are shown for phishing results so no
individual employee is identifiable in the dashboard view (psychological
safety, see report Section 2).
"""
from flask import Blueprint, render_template, abort
from flask_login import login_required, current_user
from sqlalchemy import func

from . import db
from .models import User, TrainingModule, Progress, Quiz, QuizAttempt, PhishingCampaign, PhishingEvent

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _require_admin():
    if not current_user.is_admin:
        abort(403)


@admin_bp.route("/dashboard")
@login_required
def dashboard():
    _require_admin()

    total_employees = User.query.filter_by(role="employee").count()
    modules = TrainingModule.query.order_by(TrainingModule.order_index).all()

    module_stats = []
    for m in modules:
        completed = Progress.query.filter_by(module_id=m.id, status="completed").count()
        rate = round(100 * completed / total_employees) if total_employees else 0
        avg_score = (
            db.session.query(func.avg(QuizAttempt.score))
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .filter(Quiz.module_id == m.id)
            .scalar()
        )
        module_stats.append({
            "title": m.title,
            "completed": completed,
            "total": total_employees,
            "completion_rate": rate,
            "avg_quiz_score": round(avg_score) if avg_score is not None else None,
        })

    campaigns = PhishingCampaign.query.order_by(PhishingCampaign.launched_at.desc()).all()
    campaign_stats = []
    for c in campaigns:
        sent = PhishingEvent.query.filter_by(campaign_id=c.id, event_type="sent").count()
        clicked = PhishingEvent.query.filter_by(campaign_id=c.id, event_type="click").count()
        reported = PhishingEvent.query.filter_by(campaign_id=c.id, event_type="report").count()
        campaign_stats.append({
            "subject": c.subject,
            "launched_at": c.launched_at,
            "sent": sent,
            "click_rate": round(100 * clicked / sent) if sent else 0,
            "report_rate": round(100 * reported / sent) if sent else 0,
        })

    return render_template(
        "admin_dashboard.html",
        total_employees=total_employees,
        module_stats=module_stats,
        campaign_stats=campaign_stats,
    )
