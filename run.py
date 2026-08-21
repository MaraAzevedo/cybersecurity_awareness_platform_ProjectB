"""
Development entry point.

Usage:
    pip install -r requirements.txt
    python seed.py      # creates the SQLite DB and demo/test accounts
    python run.py        # starts the dev server at http://127.0.0.1:5000
"""
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import create_app  # type: ignore[reportMissingImports]

app = create_app()

if __name__ == "__main__":
    # debug=True is for local development only — never enable in production.
    app.run(debug=True)
