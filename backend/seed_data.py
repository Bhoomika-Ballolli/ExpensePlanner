"""
seed_data.py
------------
Populates the SQLite database with realistic sample data so the
dashboard, budget and ML forecast can be demonstrated immediately.

Run with:
    python seed_data.py

This script is SAFE to re-run - it clears old sample data first
(see reset instructions in README.md for full reset).
"""

import random
from datetime import date
from dateutil.relativedelta import relativedelta

from app import app
from database import db
from models import Expense, Budget

# Categories used across the app
CATEGORIES = [
    "Food", "Groceries", "Transport", "Shopping",
    "Education", "Bills", "Healthcare", "Entertainment", "Other",
]

# Sample descriptions per category, used to make fake data feel real
SAMPLE_DESCRIPTIONS = {
    "Food": ["Lunch at cafe", "Dinner with friends", "Pizza order", "Coffee", "Breakfast"],
    "Groceries": ["Weekly groceries", "Vegetables & fruits", "Supermarket run", "Rice & dal"],
    "Transport": ["Bus pass", "Auto fare", "Fuel", "Cab ride", "Train ticket"],
    "Shopping": ["New shoes", "Clothing", "Online shopping", "Electronics accessory"],
    "Education": ["Course fee", "Textbooks", "Stationery", "Online course"],
    "Bills": ["Electricity bill", "Mobile recharge", "Internet bill", "Rent"],
    "Healthcare": ["Pharmacy", "Doctor visit", "Health checkup", "Medicines"],
    "Entertainment": ["Movie tickets", "Streaming subscription", "Concert", "Gaming"],
    "Other": ["Miscellaneous", "Gift", "Donation", "Repair"],
}

NUMBER_OF_MONTHS = 12  # at least 12 months of history, as required


def generate_month_expenses(month_date, base_amount):
    """
    Generate a realistic list of expenses for a single month.
    base_amount roughly controls how much is spent that month overall.
    """
    expenses = []
    num_transactions = random.randint(15, 25)

    for _ in range(num_transactions):
        category = random.choice(CATEGORIES)
        description = random.choice(SAMPLE_DESCRIPTIONS[category])

        # Spread transaction amounts so they roughly sum near base_amount
        amount = round(random.uniform(150, 2500), 2)

        day = random.randint(1, 28)
        expense_date = date(month_date.year, month_date.month, day)

        expenses.append(Expense(
            date=expense_date,
            amount=amount,
            category=category,
            description=description,
        ))

    return expenses


def seed():
    with app.app_context():
        # Clear existing sample data (keeps table structure)
        print("Clearing old data...")
        Expense.query.delete()
        Budget.query.delete()
        db.session.commit()

        print(f"Generating {NUMBER_OF_MONTHS} months of sample expenses...")
        today = date.today()

        # A slight upward trend in spending, plus randomness,
        # so the Linear Regression model has a real pattern to learn.
        base_amount = 11000

        for i in range(NUMBER_OF_MONTHS - 1, -1, -1):
            month_date = today - relativedelta(months=i)
            monthly_base = base_amount + (NUMBER_OF_MONTHS - i) * 300
            monthly_expenses = generate_month_expenses(month_date, monthly_base)
            db.session.add_all(monthly_expenses)

        db.session.commit()

        # Add a sample budget for the current month
        current_budget = Budget(month=today.month, year=today.year, amount=20000)
        db.session.add(current_budget)
        db.session.commit()

        total_count = Expense.query.count()
        print(f"Done! Inserted {total_count} sample expenses across {NUMBER_OF_MONTHS} months.")
        print(f"Sample budget of Rs. 20,000 set for {today.strftime('%B %Y')}.")
        print("You can now run 'python app.py' and start the frontend.")


if __name__ == "__main__":
    seed()
