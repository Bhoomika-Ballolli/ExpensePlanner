"""
database.py
------------
Sets up the SQLAlchemy database connection for ExpensePlanner.

We use SQLite because it needs no separate server - the whole
database lives in a single file called "expenses.db".
"""

from flask_sqlalchemy import SQLAlchemy

# This single db object is shared across the whole backend.
# models.py, app.py and ml_model.py all import "db" from here.
db = SQLAlchemy()


def init_db(app):
    """
    Attach the SQLAlchemy database to the Flask app and create
    all tables (if they don't already exist).
    """
    # SQLite database file will be created inside backend/ folder
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///expenses.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()
