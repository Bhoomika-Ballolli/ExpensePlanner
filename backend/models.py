"""
models.py
---------
Defines the database tables (as Python classes) used by ExpensePlanner.

Two tables:
1. Expense - every expense the user adds (manually or via OCR)
2. Budget  - the monthly budget the user sets for a given month/year
"""

from datetime import datetime
from database import db


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert this row into a plain dict so Flask can turn it into JSON."""
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "amount": self.amount,
            "category": self.category,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    month = db.Column(db.Integer, nullable=False)   # 1-12
    year = db.Column(db.Integer, nullable=False)    # e.g. 2026
    amount = db.Column(db.Float, nullable=False)

    # A user should only have ONE budget per month/year
    __table_args__ = (db.UniqueConstraint("month", "year", name="uq_month_year"),)

    def to_dict(self):
        return {
            "id": self.id,
            "month": self.month,
            "year": self.year,
            "amount": self.amount,
        }
