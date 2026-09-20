# INTERVIEW_NOTES.md — ExpensePlanner

This document helps you explain ExpensePlanner confidently in a placement
interview, from a 30-second pitch to detailed technical answers.

---

## 1. 30-Second Project Explanation

"ExpensePlanner is a full-stack web app that helps users track daily expenses,
set monthly budgets, and predict next month's spending using a Linear
Regression model trained on their own expense history. It also has an
optional feature where you can upload a photo of a receipt and OCR extracts
the amount and details automatically. I built it with React on the frontend
and Flask with SQLite on the backend."

---

## 2. 1-Minute Project Explanation

"ExpensePlanner solves a simple problem — most people don't track where their
money goes, and they have no idea how much they'll spend next month until it
happens. My app lets a user manually log expenses with a date, amount,
category, and description. All of this is stored in a SQLite database using
SQLAlchemy.

The dashboard then shows a summary — total spending, this month's spending,
budget status, and charts for monthly trends and category-wise breakdown,
using Recharts.

The core technical feature is the forecast page. I take the user's historical
monthly totals, treat each month as a point in time, and train a scikit-learn
Linear Regression model on that data to predict next month's total expense.
If there isn't enough data, the app tells the user honestly instead of
guessing.

I also added an optional receipt scanner using OpenCV for image
pre-processing and Tesseract OCR for text extraction, with a simple
keyword-based rule to suggest a category. The user always gets to review and
edit before saving, since OCR isn't perfect."

---

## 3. Problem Statement

Many people, especially students, don't have a simple way to track daily
expenses and plan ahead. Spreadsheets are tedious, and most expense apps
either don't give any predictive insight or use black-box, unexplainable
"AI" features. ExpensePlanner solves this by combining simple expense
tracking with a genuinely explainable machine learning forecast.

---

## 4. Why I Built This Project

I wanted a project that:
- Solves a problem I personally face (tracking my own expenses)
- Uses a real, explainable machine learning model instead of a black box
- Covers a complete stack: frontend, backend, database, and ML
- Is something I could fully understand and defend line-by-line in an interview

---

## 5. Architecture

```
┌─────────────┐      HTTP (JSON / REST)      ┌──────────────┐
│   React      │  ───────────────────────▶   │   Flask API   │
│  (Vite, JS)  │  ◀───────────────────────    │  (Python)     │
└─────────────┘                               └──────┬───────┘
                                                        │
                                          ┌─────────────┼──────────────┐
                                          ▼             ▼              ▼
                                    ┌──────────┐  ┌────────────┐ ┌───────────┐
                                    │ SQLite DB │  │ ml_model.py │ │  ocr.py   │
                                    │ (SQLAlchemy)│ │ (scikit-learn)│ │ (Tesseract)│
                                    └──────────┘  └────────────┘ └───────────┘
```

The frontend never talks to the database or ML model directly — it always
goes through the Flask REST API. This separation of concerns is a standard
web architecture pattern (client–server).

---

## 6. Frontend Explanation

- Built with **React + Vite** for fast development and hot reloading.
- Uses **React Router** for page navigation (Dashboard, Expenses, Add Expense,
  Forecast, Budget, Receipt Scanner).
- All backend calls go through a single file, `services/api.js`, instead of
  scattering `fetch()` calls everywhere — this makes the code easier to
  maintain and debug.
- **Recharts** is used for all charts (line chart for trends, pie chart for
  categories, bar chart for budget vs actual).
- **Lucide React** provides clean, consistent icons.
- Plain CSS with CSS variables (`src/styles/index.css`) defines a small design
  system (colors, spacing, shadows) so the whole app looks consistent without
  needing a CSS framework.
- Every page handles three states: **loading**, **error**, and **empty** —
  so the UI never looks broken if the backend is down or there's no data yet.

---

## 7. Backend Explanation

- Built with **Flask**, a lightweight Python web framework.
- `app.py` contains all REST API routes (expenses, budget, dashboard,
  forecast, OCR).
- `models.py` defines two SQLAlchemy models: `Expense` and `Budget`.
- `database.py` initializes the SQLAlchemy connection to SQLite.
- **Flask-CORS** is used so the React frontend (port 5173) can call the Flask
  backend (port 5000) during local development — browsers block
  cross-origin requests by default without this.
- Every route validates its input (e.g. amount must be > 0) and returns a
  clean JSON error instead of leaking a Python stack trace to the user.

---

## 8. Database Explanation

SQLite was chosen because it needs no separate server — the whole database is
one file (`expenses.db`). This is perfect for a local, single-user project
like this.

**Expense table:**
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| date | Date | Expense date |
| amount | Float | Must be > 0 |
| category | String | One of 9 fixed categories |
| description | String | Optional |
| created_at | DateTime | Auto-set when the row is created |

**Budget table:**
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| month | Integer | 1–12 |
| year | Integer | e.g. 2026 |
| amount | Float | Budget for that month |

A unique constraint on `(month, year)` ensures there's only ever one budget
row per month.

---

## 9. OCR Explanation

The receipt scanner uses a 3-step pipeline:

1. **Preprocessing (OpenCV):** Convert the image to grayscale, then apply
   Otsu's thresholding to turn it into clean black-and-white text. This
   significantly improves OCR accuracy on photos with uneven lighting.
2. **Text extraction (pytesseract / Tesseract):** Runs the OCR engine on the
   processed image and returns raw text.
3. **Information extraction (regex + keywords):**
   - Amount: looks for lines containing "total"/"amount" followed by a
     number, falling back to the largest number found.
   - Date: matches common date formats (dd/mm/yyyy, yyyy-mm-dd, etc.).
   - Description: uses the first non-empty line (often the store name).
   - Category: a simple keyword dictionary (e.g. "pizza" → Food) — no ML
     classifier needed here, since it's simple and fully explainable.

If confidence is low (e.g. no amount was found), the app clearly tells the
user to review the fields manually instead of pretending it worked.

---

## 10. ML Explanation

The forecasting feature is in `backend/ml_model.py`. It:

1. Fetches every expense from the database.
2. Groups them by (year, month) to compute a **monthly total**.
3. Sorts these totals chronologically.
4. Assigns each month a numeric index: 0, 1, 2, 3, ...
5. Trains a **scikit-learn `LinearRegression`** model where the index is the
   input feature (X) and the monthly total is the target (y).
6. Predicts the value for the *next* index — this is the forecast for next
   month.

If there are fewer than 3 months of data, the model isn't trained at all —
the API returns a clear "not enough data" message.

---

## 11. Why Linear Regression

- It's simple, fast, and easy to explain — perfect for a time-series with a
  general upward/downward trend like monthly spending.
- It doesn't require large amounts of data to produce a reasonable estimate.
- It's transparent: the prediction is literally "the next point on the
  best-fit straight line," which is easy to justify in an interview compared
  to a black-box neural network.
- More complex models (like ARIMA or LSTM) need much more historical data and
  add complexity without a clear benefit for a single user's monthly totals.

---

## 12. How Prediction Works (Step by Step)

1. User has, say, 12 months of expense data in the database.
2. Backend aggregates this into 12 (month_index, total) pairs.
3. `LinearRegression().fit(X, y)` finds the values of `m` (slope) and `c`
   (intercept) in `y = m*x + c` that best fit these 12 points (minimizing
   squared error).
4. To predict month 13, the backend computes `y = m*13 + c`.
5. The predicted value is rounded and returned to the frontend, along with
   the historical data so it can be charted alongside the prediction.

---

## 13. How Data Flows Through the System

**Adding an expense:**
```
User fills form (React) → POST /api/expenses → Flask validates input
→ SQLAlchemy saves row to SQLite → Response sent back → React updates UI
```

**Viewing the forecast:**
```
User opens Forecast page → GET /api/forecast → Flask queries all expenses
→ ml_model.py aggregates by month & trains LinearRegression
→ Prediction returned as JSON → React renders chart + predicted value
```

**Scanning a receipt:**
```
User uploads image → POST /api/ocr (multipart/form-data)
→ OpenCV preprocesses image → pytesseract extracts text
→ regex/keywords extract amount/date/category → Result sent to React
→ User reviews/edits fields → POST /api/expenses to save
```

---

## 14. Important APIs

| Endpoint | Purpose |
|---|---|
| `POST /api/expenses` | Add a new expense (core feature) |
| `GET /api/dashboard` | Powers the entire dashboard in a single call |
| `GET /api/forecast` | Returns the ML prediction and training details |
| `POST /api/budget` | Set/update the monthly budget |
| `POST /api/ocr` | Optional — extract expense details from a receipt image |

---

## 15. Challenges Faced

- **Aggregating expenses into monthly totals correctly** — had to make sure
  months were sorted chronologically (not alphabetically) before training the
  regression model, otherwise the trend would be meaningless.
- **Making OCR robust** — raw OCR text from receipts is messy; had to write
  regex patterns that handle multiple date/amount formats and gracefully
  fail when nothing reliable is found.
- **Keeping the "not enough data" case honest** — it would have been easy to
  fall back to a fake average, but I made sure the API clearly says
  prediction isn't possible yet if there's less than 3 months of history.
- **CORS during local development** — had to explicitly enable Flask-CORS so
  the React dev server (a different port) could call the Flask API.

---

## 16. Future Improvements

- Add category-wise forecasting (predict spending per category, not just total).
- Add multiple regression features (e.g. day-of-week spending patterns, or
  including category proportions as additional input features).
- Add user authentication so multiple users can have separate data.
- Deploy the backend with a production server (Gunicorn) and host the
  frontend separately (Vercel/Netlify).
- Add recurring expense support (e.g. auto-log rent every month).

---

## 17. 20 Likely Interviewer Questions & Answers

**Q1: Why did you choose Linear Regression?**
A: It's simple, interpretable, and works reasonably well with limited
time-series data like monthly totals. It's easy to explain exactly why a
prediction came out the way it did — unlike a black-box model.

**Q2: What is Linear Regression?**
A: A statistical method that models the relationship between an input
variable (X) and an output variable (y) as a straight line: `y = m*x + c`.
It finds the `m` and `c` that minimize the squared difference between
predicted and actual values.

**Q3: What is the input to your model?**
A: A numeric index representing the order of the month (0 for the first
month of data, 1 for the second, and so on).

**Q4: What is the target variable?**
A: The total amount spent in that month, computed by summing all expenses
recorded in that month.

**Q5: How did you prepare the data?**
A: I queried all expenses from SQLite, converted them into a pandas
DataFrame, grouped them by year and month using `groupby()`, summed the
amounts, and sorted chronologically before feeding them to the model.

**Q6: Why do you need historical data?**
A: Linear Regression needs multiple data points to find a meaningful trend.
Without enough months of history, any "prediction" would just be a guess,
not something learned from a pattern.

**Q7: What happens if there is insufficient data?**
A: The API checks if there are at least 3 months of data. If not, it returns
`"Not enough historical data for prediction."` instead of training a
meaningless model on 1–2 points.

**Q8: How is the prediction generated?**
A: After training, I pass the next month's index (`len(monthly_data)`) into
the trained model's `.predict()` method, which applies the learned line
equation to produce the forecast.

**Q9: Is the prediction guaranteed to be accurate?**
A: No — it's an estimate based on past patterns. Real spending can be
affected by unexpected events the model has no way of knowing about. I make
this clear in the UI rather than overselling the prediction.

**Q10: What are the limitations of your model?**
A: It assumes a roughly linear trend, which may not capture seasonal spikes
(e.g. festival months) or sudden lifestyle changes. It also needs a
reasonable amount of historical data to be useful.

**Q11: How could you improve the model in the future?**
A: I could add seasonal features (month-of-year), use category-level models,
try polynomial regression for non-linear trends, or use more advanced
time-series models like ARIMA once more data is available.

**Q12: Why did you use SQLite instead of MySQL/PostgreSQL?**
A: SQLite requires no separate database server, which keeps local setup
simple for a single-user project like this. SQLAlchemy makes it easy to
switch to another database later without changing the application code much.

**Q13: Why did you separate the frontend and backend?**
A: This is a standard REST API architecture. It keeps concerns separate —
the frontend only handles UI/UX, and the backend handles data and business
logic. It also means the same backend could serve a mobile app in the future.

**Q14: How does the frontend talk to the backend?**
A: Through HTTP requests (fetch API) to Flask REST endpoints. All this logic
is centralized in `services/api.js` so components don't need to know request
details.

**Q15: How do you handle errors in the app?**
A: The backend always returns JSON with a `success` flag and, on failure, an
`error` message instead of raising an unhandled exception. The frontend
checks this and shows user-friendly alerts instead of raw error text.

**Q16: How does the OCR feature work?**
A: I preprocess the receipt image with OpenCV (grayscale + thresholding),
extract text using pytesseract/Tesseract, then use regex and keyword
matching to pull out the amount, date, description, and a suggested
category. The user can edit all fields before saving.

**Q17: Why is OCR not mandatory?**
A: OCR on real-world receipts is never 100% reliable — lighting, receipt
quality, and printer fonts vary a lot. Making manual entry the core, always-
working path ensures the app is reliable even when OCR fails.

**Q18: How do you calculate "Budget Exceeded" vs "Within Budget"?**
A: The backend computes the current month's total spending by summing all
expenses dated in the current month, then compares it against the budget
amount stored for that month. If spending is greater, it's exceeded;
otherwise, it's within budget.

**Q19: How would you scale this project for multiple users?**
A: Add a `User` table, add a `user_id` foreign key to `Expense` and `Budget`,
implement authentication (e.g. JWT tokens), and filter every query by the
logged-in user's ID.

**Q20: What was the hardest part of this project?**
A: Making the ML forecasting genuinely correct rather than faking it — I had
to carefully aggregate and sort the data chronologically, and add a real
"not enough data" guard rather than always showing a number that might be
meaningless.

---

## 18. Quick Cheat Sheet (for last-minute revision)

- **Frontend:** React + Vite + Recharts + Lucide icons + plain CSS
- **Backend:** Flask + Flask-CORS + SQLAlchemy
- **Database:** SQLite — `Expense` and `Budget` tables
- **ML:** scikit-learn `LinearRegression`, trained on monthly totals,
  input = month index, target = monthly total, needs ≥ 3 months of data
- **OCR:** OpenCV (preprocessing) + pytesseract/Tesseract (text extraction) +
  regex/keywords (field extraction, category suggestion)
- **Core principle:** manual expense entry always works; ML and OCR degrade
  gracefully with clear messages instead of fake results.
