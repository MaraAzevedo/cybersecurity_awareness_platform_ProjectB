"""
Configuration for the Employee Cybersecurity Awareness Platform prototype.

NOTE (assumption, flagged per Section 2 of the report): SECRET_KEY below is a
development placeholder only. In any real deployment it MUST be replaced with
a long random value supplied via an environment variable, never committed to
version control.
"""
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-placeholder-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'awareness.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Session cookie hardening (NFR01 / security intent — see report Section 6.E)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    # WTF_CSRF_ENABLED defaults to True via Flask-WTF; kept explicit for clarity.
    WTF_CSRF_ENABLED = True


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False

# If it's a third-party library, install it:
#   pip install my_custom_module
# If it's your own code in a non-standard location, add to .vscode/settings.json:
#   {
#       "python.analysis.extraPaths": ["./src", "./lib"]
#   }

try:
    import optional_module  # pyright: ignore[reportMissingImports]
except ImportError:
    optional_module = None