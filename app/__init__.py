"""
Application factory for the Employee Cybersecurity Awareness Platform prototype.

Structured as Flask blueprints (auth, training, phishing, admin) so that,
per NFR07 (maintainability), new modules/features can be added after the
semester without restructuring the whole app.
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf import CSRFProtect

db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()


def create_app(config_object="config.Config"):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"
    csrf.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, user_id)

    from .auth import auth_bp
    from .training import training_bp
    from .phishing import phishing_bp
    from .admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(training_bp)
    app.register_blueprint(phishing_bp)
    app.register_blueprint(admin_bp)

    from flask import redirect, url_for
    from flask_login import current_user

    @app.route("/")
    def index():
        if current_user.is_authenticated:
            if current_user.is_admin:
                return redirect(url_for("admin.dashboard"))
            return redirect(url_for("training.my_modules"))
        return redirect(url_for("auth.login"))

    with app.app_context():
        db.create_all()

    return app
