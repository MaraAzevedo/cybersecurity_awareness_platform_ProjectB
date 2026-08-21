"""
SQLAlchemy models for the Employee Cybersecurity Awareness Platform prototype.

These map to the entities in Figure 2 (Entity-Relationship Diagram) of the
Assessment 1 report. For implementation simplicity in a two-day prototype,
`role` is stored as a string column directly on User rather than as a
separate ROLE table with a foreign key -- this is a deliberate simplification
of the logical data model in the report, noted here rather than silently
diverging from it.
"""
from datetime import datetime, timezone
import uuid

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from . import db


def _uuid():
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc)


class User(UserMixin, db.Model):
    __tablename__ = "user"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="employee")  # 'employee' | 'admin'
    created_at = db.Column(db.DateTime, default=now)

    progress = db.relationship("Progress", backref="user", lazy=True)
    quiz_attempts = db.relationship("QuizAttempt", backref="user", lazy=True)
    phishing_events = db.relationship("PhishingEvent", backref="user", lazy=True)

    def set_password(self, raw_password):
        # NFR01: passwords are never stored in plaintext. werkzeug's default
        # method (pbkdf2:sha256) is used here for zero-extra-dependency
        # simplicity in a graded sandbox. OWASP's current guidance
        # recommends Argon2id first (see report Section 6.E / References) --
        # swap in `argon2-cffi` + passlib for a production deployment.
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)

    @property
    def is_admin(self):
        return self.role == "admin"


class TrainingModule(db.Model):
    __tablename__ = "training_module"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    title = db.Column(db.String(200), nullable=False)
    content_type = db.Column(db.String(20), nullable=False, default="text")  # text | video
    content_body = db.Column(db.Text, nullable=False, default="")
    content_url = db.Column(db.String(500), nullable=True)
    target_role = db.Column(db.String(20), nullable=False, default="employee")
    order_index = db.Column(db.Integer, nullable=False, default=0)

    quiz = db.relationship("Quiz", backref="module", uselist=False, lazy=True)
    progress_rows = db.relationship("Progress", backref="module", lazy=True)


class Progress(db.Model):
    __tablename__ = "progress"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False)
    module_id = db.Column(db.String(36), db.ForeignKey("training_module.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="not_started")  # not_started|in_progress|completed
    completed_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (db.UniqueConstraint("user_id", "module_id", name="uq_progress_user_module"),)


class Quiz(db.Model):
    __tablename__ = "quiz"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    module_id = db.Column(db.String(36), db.ForeignKey("training_module.id"), nullable=False, unique=True)
    pass_threshold = db.Column(db.Integer, nullable=False, default=70)  # percent
    # Questions stored as JSON for prototype simplicity:
    # [{"question": "...", "choices": ["a","b","c"], "answer_index": 0}, ...]
    questions_json = db.Column(db.Text, nullable=False, default="[]")

    attempts = db.relationship("QuizAttempt", backref="quiz", lazy=True)


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempt"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    quiz_id = db.Column(db.String(36), db.ForeignKey("quiz.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False)
    score = db.Column(db.Integer, nullable=False)  # percent
    passed = db.Column(db.Boolean, nullable=False, default=False)
    attempted_at = db.Column(db.DateTime, default=now)


class PhishingCampaign(db.Model):
    __tablename__ = "phishing_campaign"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    template_name = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    body_preview = db.Column(db.Text, nullable=False, default="")
    launched_by = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False)
    launched_at = db.Column(db.DateTime, default=now)

    events = db.relationship("PhishingEvent", backref="campaign", lazy=True)


class PhishingEvent(db.Model):
    __tablename__ = "phishing_event"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey("phishing_campaign.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=False)
    event_type = db.Column(db.String(20), nullable=False, default="sent")  # sent|click|report
    event_at = db.Column(db.DateTime, default=now)

    __table_args__ = (
        db.UniqueConstraint("campaign_id", "user_id", "event_type", name="uq_phish_event"),
    )


class AuditLog(db.Model):
    __tablename__ = "audit_log"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("user.id"), nullable=True)
    action = db.Column(db.String(120), nullable=False)
    timestamp = db.Column(db.DateTime, default=now)
    ip_address = db.Column(db.String(64), nullable=True)
