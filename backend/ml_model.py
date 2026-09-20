"""
ml_model.py
-----------
This file contains the ACTUAL machine learning logic for ExpensePlanner.

We predict "next month's total expense" using scikit-learn's
LinearRegression model, trained on the user's own historical
monthly spending totals stored in SQLite.

HOW IT WORKS (in simple terms):
1. We pull every expense from the database.
2. We group them by (year, month) and sum the amounts -> this gives us
   a table like:
        Month Index | Total Expense
             0       |   12000
             1       |   13500
             2       |   12800
             ...
3. "Month Index" (0, 1, 2, 3...) is our INPUT feature (X).
   "Total Expense" is our TARGET (y).
4. We fit a LinearRegression model: it finds the best straight line
   that fits these points (y = m*x + c).
5. To predict next month, we simply plug in the next month index
   into that line and read off the predicted y value.

This is a genuine, trained regression model - not a hardcoded number
and not just an average.
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
from models import Expense

MIN_MONTHS_REQUIRED = 3  # we need at least 3 months of history to train


def _get_monthly_totals():
    """
    Query all expenses and aggregate them into monthly totals.
    Returns a pandas DataFrame sorted by date with columns:
        year, month, month_label, total
    """
    expenses = Expense.query.all()

    if not expenses:
        return pd.DataFrame(columns=["year", "month", "month_label", "total"])

    # Build a simple DataFrame from the raw expense rows
    data = [{"date": e.date, "amount": e.amount} for e in expenses]
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    # Group by year+month and sum the amounts spent that month
    monthly = (
        df.groupby(["year", "month"])["amount"]
        .sum()
        .reset_index()
        .rename(columns={"amount": "total"})
    )

    # Sort chronologically (important! regression needs ordered time steps)
    monthly = monthly.sort_values(["year", "month"]).reset_index(drop=True)
    monthly["month_label"] = monthly.apply(
        lambda r: f"{int(r['year'])}-{int(r['month']):02d}", axis=1
    )

    return monthly


def predict_next_month():
    """
    Trains a Linear Regression model on historical monthly totals
    and predicts the next month's total expense.

    Returns a dictionary describing the result. If there isn't enough
    data, it returns a friendly message instead of a prediction.
    """
    monthly = _get_monthly_totals()
    months_available = len(monthly)

    if months_available < MIN_MONTHS_REQUIRED:
        return {
            "success": False,
            "message": "Not enough historical data for prediction.",
            "months_available": months_available,
            "months_required": MIN_MONTHS_REQUIRED,
        }

    # X = month index (0, 1, 2, 3 ...) representing the order of months
    # y = total amount spent that month
    X = np.arange(len(monthly)).reshape(-1, 1)
    y = monthly["total"].values

    model = LinearRegression()
    model.fit(X, y)

    # The next month is simply the next index after our last data point
    next_index = np.array([[len(monthly)]])
    predicted_value = model.predict(next_index)[0]

    # Never predict a negative expense - clip at 0
    predicted_value = max(0, round(float(predicted_value), 2))

    # A simple in-sample error measure, useful to show model fit quality
    # (this is NOT an "accuracy percentage" - just the average error in rupees)
    predictions_on_training_data = model.predict(X)
    mae = round(float(mean_absolute_error(y, predictions_on_training_data)), 2)

    last_month_label = monthly.iloc[-1]["month_label"]
    last_month_value = float(monthly.iloc[-1]["total"])

    return {
        "success": True,
        "predicted_next_month_expense": predicted_value,
        "months_used_for_training": months_available,
        "last_month_label": last_month_label,
        "last_month_expense": last_month_value,
        "mean_absolute_error": mae,
        "history": monthly[["month_label", "total"]].to_dict(orient="records"),
        "explanation": (
            "Prediction is based on your historical monthly spending pattern "
            "using Linear Regression."
        ),
    }
