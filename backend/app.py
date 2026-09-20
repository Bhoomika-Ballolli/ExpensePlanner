"""
app.py
------
Main Flask application for ExpensePlanner.

Run with:
    python app.py

This starts a local server at http://localhost:5000
"""

from datetime import datetime, date
from calendar import monthrange

from flask import Flask, request, jsonify
from flask_cors import CORS

from database import db, init_db
from models import Expense, Budget
import ml_model
import ocr

app = Flask(__name__)

# Allow the React frontend (running on a different port) to call this API
CORS(app)

init_db(app)


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def error_response(message, status_code=400):
    """Return a clean JSON error instead of an HTML/Python traceback."""
    return jsonify({"success": False, "error": message}), status_code


def parse_date(date_str):
    """Convert a 'YYYY-MM-DD' string into a Python date object."""
    return datetime.strptime(date_str, "%Y-%m-%d").date()


# ---------------------------------------------------------------------------
# Expense APIs
# ---------------------------------------------------------------------------

@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    """
    Return all expenses, most recent first.
    Supports optional query params: ?category=Food&month=9&year=2026&search=coffee
    """
    try:
        query = Expense.query

        category = request.args.get("category")
        if category and category != "All":
            query = query.filter(Expense.category == category)

        month = request.args.get("month")
        year = request.args.get("year")
        if month:
            query = query.filter(db.extract("month", Expense.date) == int(month))
        if year:
            query = query.filter(db.extract("year", Expense.date) == int(year))

        search = request.args.get("search")
        if search:
            query = query.filter(Expense.description.ilike(f"%{search}%"))

        expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()
        return jsonify({"success": True, "expenses": [e.to_dict() for e in expenses]})

    except Exception as exc:
        return error_response("Could not fetch expenses.", 500)


@app.route("/api/expenses", methods=["POST"])
def add_expense():
    """Add a new expense. Expects JSON: {date, amount, category, description}"""
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON.")

    # ---- Validation ----
    date_str = data.get("date")
    amount = data.get("amount")
    category = data.get("category")
    description = data.get("description", "")

    if not date_str:
        return error_response("Date is required.")
    if not category:
        return error_response("Category is required.")
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return error_response("Amount must be a valid number.")
    if amount <= 0:
        return error_response("Amount must be greater than 0.")

    try:
        expense_date = parse_date(date_str)
    except ValueError:
        return error_response("Date must be in YYYY-MM-DD format.")

    try:
        expense = Expense(
            date=expense_date,
            amount=amount,
            category=category,
            description=description,
        )
        db.session.add(expense)
        db.session.commit()
        return jsonify({"success": True, "expense": expense.to_dict()}), 201

    except Exception:
        db.session.rollback()
        return error_response("Could not save expense to database.", 500)


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    """Delete a single expense by its id."""
    expense = Expense.query.get(expense_id)
    if not expense:
        return error_response("Expense not found.", 404)

    try:
        db.session.delete(expense)
        db.session.commit()
        return jsonify({"success": True, "message": "Expense deleted."})
    except Exception:
        db.session.rollback()
        return error_response("Could not delete expense.", 500)


# ---------------------------------------------------------------------------
# Budget APIs
# ---------------------------------------------------------------------------

@app.route("/api/budget", methods=["GET"])
def get_budget():
    """
    Get the budget for a given month/year.
    Defaults to the current month if not specified.
    Query params: ?month=9&year=2026
    """
    today = date.today()
    month = int(request.args.get("month", today.month))
    year = int(request.args.get("year", today.year))

    budget = Budget.query.filter_by(month=month, year=year).first()
    if budget:
        return jsonify({"success": True, "budget": budget.to_dict()})

    return jsonify({"success": True, "budget": None, "month": month, "year": year})


@app.route("/api/budget", methods=["POST"])
def set_budget():
    """
    Create or update the budget for a month/year.
    Expects JSON: {month, year, amount}
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body must be JSON.")

    try:
        month = int(data.get("month"))
        year = int(data.get("year"))
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return error_response("Month, year and amount must be valid numbers.")

    if amount <= 0:
        return error_response("Budget amount must be greater than 0.")
    if not (1 <= month <= 12):
        return error_response("Month must be between 1 and 12.")

    try:
        budget = Budget.query.filter_by(month=month, year=year).first()
        if budget:
            budget.amount = amount
        else:
            budget = Budget(month=month, year=year, amount=amount)
            db.session.add(budget)

        db.session.commit()
        return jsonify({"success": True, "budget": budget.to_dict()})

    except Exception:
        db.session.rollback()
        return error_response("Could not save budget.", 500)


# ---------------------------------------------------------------------------
# Dashboard API
# ---------------------------------------------------------------------------

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """
    Returns everything the dashboard page needs in one call:
    - total expenses (all time)
    - this month's spending
    - budget info for this month
    - monthly spending trend (for line chart)
    - category-wise breakdown (for pie chart)
    - recent expenses
    - a quick forecast preview
    """
    try:
        today = date.today()

        all_expenses = Expense.query.all()
        total_expenses = sum(e.amount for e in all_expenses)

        this_month_expenses = [
            e for e in all_expenses
            if e.date.month == today.month and e.date.year == today.year
        ]
        this_month_total = sum(e.amount for e in this_month_expenses)

        # Budget for current month
        budget = Budget.query.filter_by(month=today.month, year=today.year).first()
        budget_amount = budget.amount if budget else 0
        remaining_budget = budget_amount - this_month_total if budget else None

        # Monthly trend: group all expenses by year-month
        trend_map = {}
        for e in all_expenses:
            key = f"{e.date.year}-{e.date.month:02d}"
            trend_map[key] = trend_map.get(key, 0) + e.amount
        monthly_trend = [
            {"month": k, "total": round(v, 2)}
            for k, v in sorted(trend_map.items())
        ]

        # Category breakdown (all-time, so the pie chart isn't empty for new users)
        category_map = {}
        for e in all_expenses:
            category_map[e.category] = category_map.get(e.category, 0) + e.amount
        category_breakdown = [
            {"category": k, "total": round(v, 2)} for k, v in category_map.items()
        ]

        # Recent expenses (last 5)
        recent = sorted(all_expenses, key=lambda e: (e.date, e.id), reverse=True)[:5]

        # Forecast preview (reuse the ML model)
        forecast = ml_model.predict_next_month()

        return jsonify({
            "success": True,
            "total_expenses": round(total_expenses, 2),
            "this_month_total": round(this_month_total, 2),
            "budget_amount": budget_amount,
            "remaining_budget": round(remaining_budget, 2) if remaining_budget is not None else None,
            "monthly_trend": monthly_trend,
            "category_breakdown": category_breakdown,
            "recent_expenses": [e.to_dict() for e in recent],
            "forecast": forecast,
        })

    except Exception as exc:
        return error_response("Could not load dashboard data.", 500)


# ---------------------------------------------------------------------------
# Forecast API (ML)
# ---------------------------------------------------------------------------

@app.route("/api/forecast", methods=["GET"])
def get_forecast():
    """Return the ML-based prediction for next month's expense."""
    try:
        result = ml_model.predict_next_month()
        return jsonify(result)
    except Exception as exc:
        return error_response("Could not generate forecast.", 500)


# ---------------------------------------------------------------------------
# OCR API (Optional feature)
# ---------------------------------------------------------------------------

@app.route("/api/ocr", methods=["POST"])
def scan_receipt():
    """Accepts an uploaded receipt image and returns extracted expense details."""
    if "receipt" not in request.files:
        return error_response("No receipt file uploaded. Field name must be 'receipt'.")

    file = request.files["receipt"]
    if file.filename == "":
        return error_response("No file selected.")

    allowed_extensions = {"jpg", "jpeg", "png"}
    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in allowed_extensions:
        return error_response("Only JPG, JPEG and PNG files are supported.")

    result = ocr.process_receipt(file)
    return jsonify(result)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"success": True, "message": "ExpensePlanner backend is running."})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
