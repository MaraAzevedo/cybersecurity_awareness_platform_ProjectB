"""
Auth blueprint — FR01 (secure registration/login), FR08 (secure login for
employees), NFR01 (password hashing).
"""
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo

from . import db
from .models import User, AuditLog

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


class RegisterForm(FlaskForm):
    email = StringField("Work email", validators=[DataRequired(), Email(), Length(max=255)])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=8, message="Use at least 8 characters.")])
    confirm = PasswordField("Confirm password", validators=[DataRequired(), EqualTo("password", message="Passwords must match.")])
    submit = SubmitField("Create account")


class LoginForm(FlaskForm):
    email = StringField("Work email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    submit = SubmitField("Sign in")


def _log(user_id, action):
    db.session.add(AuditLog(user_id=user_id, action=action, ip_address=request.remote_addr))
    db.session.commit()


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    form = RegisterForm()
    if form.validate_on_submit():
        existing = User.query.filter_by(email=form.email.data.lower().strip()).first()
        if existing:
            flash("An account with that email already exists.", "error")
            return render_template("register.html", form=form)
        user = User(email=form.email.data.lower().strip(), role="employee")
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        _log(user.id, "account_registered")
        flash("Account created. Please sign in.", "success")
        return redirect(url_for("auth.login"))
    return render_template("register.html", form=form)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("index"))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data.lower().strip()).first()
        # Deliberately generic error message: do not reveal whether the
        # email exists (basic account-enumeration hardening, NFR01 intent).
        if user and user.check_password(form.password.data):
            login_user(user)
            _log(user.id, "login_success")
            return redirect(url_for("index"))
        flash("Invalid email or password.", "error")
        if user:
            _log(user.id, "login_failed")
    return render_template("login.html", form=form)


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    _log(current_user.id, "logout")
    logout_user()
    return redirect(url_for("auth.login"))
