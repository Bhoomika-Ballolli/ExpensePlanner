# ExpensePlanner – Intelligent Expense Analysis & Forecasting System

ExpensePlanner is a full-stack expense management web application that helps you
track your spending, set monthly budgets, and predict next month's expenses
using a real, trained Machine Learning model (Linear Regression). It also
includes an optional receipt scanner that uses OCR to auto-fill expense
details from a photo.

This project was built to be genuinely functional, easy to run locally, and
easy to explain in a placement interview — see `INTERVIEW_NOTES.md` for that.

---

## 1. Features

- **Manual expense entry** — add expenses with date, amount, category, description
- **Expense management** — search, filter by category/month, delete expenses
- **Dashboard** — total spending, this month's spending, budget, predicted next
  month, monthly trend chart, category breakdown chart, budget vs actual chart
- **Monthly budget tracking** — set a budget, see a progress bar and
  "Within budget" / "Budget exceeded" status
- **ML-based forecasting** — a scikit-learn `LinearRegression` model trained on
  your historical monthly totals predicts next month's expense
- **Receipt scanning (optional)** — upload a receipt photo, OCR (Tesseract)
  extracts amount/date/description, and a simple keyword rule suggests a
  category. You can edit everything before saving. The app works perfectly
  without ever using this feature.

---

## 2. Technology Stack

**Frontend:** React (JavaScript, not TypeScript), Vite, Recharts, Lucide React icons, plain CSS

**Backend:** Python, Flask, Flask-CORS, SQLAlchemy

**Database:** SQLite (a single file, no server needed)

**Machine Learning:** pandas, numpy, scikit-learn (`LinearRegression`)

**OCR:** Tesseract OCR, pytesseract, OpenCV, Pillow

---

## 3. Folder Structure

```
ExpensePlanner/
│
├── frontend/                  React + Vite frontend
│   ├── src/
│   │   ├── components/        Reusable UI pieces (Sidebar, Layout, cards, states)
│   │   ├── pages/              One file per page (Dashboard, Expenses, etc.)
│   │   ├── services/           api.js (all backend calls) + format.js (helpers)
│   │   ├── styles/index.css    Global design system (CSS variables, layout)
│   │   ├── App.jsx             Route definitions
│   │   └── main.jsx            React entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   Flask backend
│   ├── app.py                  All REST API routes
│   ├── models.py               SQLAlchemy models: Expense, Budget
│   ├── database.py             DB setup/initialization
│   ├── ml_model.py             Linear Regression forecasting logic
│   ├── ocr.py                  Receipt OCR + keyword categorization
│   ├── seed_data.py            Generates 12 months of sample data
│   └── requirements.txt
│
├── README.md
├── INTERVIEW_NOTES.md
└── .gitignore
```

---

## 4. Prerequisites

You need the following installed on your Windows machine:

1. **Python 3.10+** — download from https://www.python.org/downloads/
   - During installation, tick **"Add Python to PATH"**.
2. **Node.js 18+** (includes npm) — download from https://nodejs.org/
3. **Tesseract OCR** (only required if you want to use the Receipt Scanner feature)

### Installing Tesseract OCR on Windows

1. Download the Windows installer from the official Tesseract project:
   https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer. Note the install path — by default it is:
   ```
   C:\Program Files\Tesseract-OCR\tesseract.exe
   ```
3. Add Tesseract to your system PATH:
   - Search "Environment Variables" in the Start Menu
   - Edit the `Path` variable under "System variables"
   - Add a new entry: `C:\Program Files\Tesseract-OCR`
4. Verify installation by opening a new Command Prompt and running:
   ```
   tesseract --version
   ```
   If it prints a version number, you're good to go.

> If Tesseract is not installed, every other feature of the app still works.
> The Receipt Scanner page will simply return a message asking you to enter
> details manually.

---

## 5. Backend Setup

Open a terminal (Command Prompt / PowerShell) in the project folder:

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
python app.py
```

This will:
1. Create a Python virtual environment (`venv`)
2. Activate it
3. Install Flask, SQLAlchemy, scikit-learn, OpenCV, pytesseract, etc.
4. Populate the SQLite database with 12 months of realistic sample expenses
5. Start the Flask server at **http://localhost:5000**

Keep this terminal open while you use the app.

### Resetting / removing sample data

`seed_data.py` clears all existing expenses and budgets every time you run it,
then inserts a fresh batch of sample data. To start with a **completely empty**
database instead, simply delete the `backend/expenses.db` file and restart
`app.py` — Flask will automatically recreate empty tables.

---

## 6. Frontend Setup

Open a **second terminal** (leave the backend running in the first one):

```
cd frontend
npm install
npm run dev
```

This starts the React development server, usually at **http://localhost:5173**.
Open that URL in your browser.

---

## 7. Running the Application (Quick Reference)

**Terminal 1 (Backend):**
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
python app.py
```

**Terminal 2 (Frontend):**
```
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 8. Common Errors and Solutions

| Problem | Solution |
|---|---|
| `'python' is not recognized` | Reinstall Python and tick "Add Python to PATH", or use `py` instead of `python`. |
| `pip install` fails on `opencv-python` or `numpy` | Make sure you're using Python 3.10–3.12. Upgrade pip: `python -m pip install --upgrade pip`. |
| Frontend shows "Could not reach the server" | Make sure the Flask backend (`python app.py`) is running on port 5000 before using the frontend. |
| Forecast page shows "Not enough historical data" | Run `python seed_data.py` in the backend to load 12 months of sample data, or keep adding expenses manually across different months. |
| Receipt Scanner says OCR is not installed | Install Tesseract OCR (see Section 4) and make sure it's added to your PATH. Restart the backend after installing. |
| CORS error in browser console | Make sure `Flask-CORS` is installed (`pip install -r requirements.txt`) and that you're accessing the frontend via `http://localhost:5173`. |
| Port 5000 or 5173 already in use | Stop other running servers, or change the port in `app.py` (`app.run(port=...)`) / `vite.config.js`. |

---

## 9. How the ML Prediction Works

See `backend/ml_model.py`. In short:

1. All expenses are grouped by month to get a monthly total (e.g. Jan: ₹12,000, Feb: ₹13,500, ...).
2. Each month is converted into a simple number: 0, 1, 2, 3, ... representing its order in time.
3. A `LinearRegression` model from scikit-learn is trained where:
   - **Input (X):** the month index (0, 1, 2, ...)
   - **Target (y):** that month's total expense
4. The model learns the best-fit straight line through these points.
5. To predict next month, we plug in the next index and read the predicted value off that line.

If there are fewer than 3 months of data, the API returns:
`"Not enough historical data for prediction."` instead of guessing.

This is a genuinely trained regression model — not an average, and not a
hardcoded number.

---

## 10. How OCR Works

See `backend/ocr.py`. Flow:

1. The uploaded receipt image is read using OpenCV.
2. It's converted to grayscale and thresholded (Otsu's method) to make text
   stand out clearly for the OCR engine.
3. `pytesseract` (a Python wrapper around Tesseract OCR) extracts raw text
   from the processed image.
4. Simple regex patterns look for a total amount and a date in the text.
5. The first non-empty line is used as a description guess (often the store name).
6. A simple keyword dictionary (e.g. "pizza" → Food, "bus" → Transport) suggests
   a category — this is intentionally rule-based, not a ML classifier, so it's
   easy to explain and modify.
7. All extracted fields are shown to the user as **editable** form fields —
   nothing is saved until the user reviews and clicks "Save Expense".

If OCR fails or the image is unclear, the app tells the user to enter details
manually rather than guessing or crashing.

---

## 11. Building for Production

**Frontend:**
```
cd frontend
npm run build
```
This creates a `frontend/dist` folder with static HTML/CSS/JS you can deploy
to any static host (Netlify, Vercel, GitHub Pages, etc.). You can preview it
locally with `npm run preview`.

**Backend:**
The included Flask dev server (`python app.py`) is fine for local use and
demos. For a real deployment, run it behind a production WSGI server such as
Gunicorn or Waitress, and update `frontend/src/services/api.js`'s `BASE_URL`
to point at your deployed backend URL.

---

## 12. Example API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | List expenses (supports `?category=`, `?month=`, `?year=`, `?search=`) |
| POST | `/api/expenses` | Add a new expense |
| DELETE | `/api/expenses/<id>` | Delete an expense |
| GET | `/api/dashboard` | Get all dashboard data in one call |
| GET | `/api/forecast` | Get the ML-predicted next month expense |
| GET | `/api/budget?month=&year=` | Get the budget for a given month |
| POST | `/api/budget` | Create/update a monthly budget |
| POST | `/api/ocr` | Upload a receipt image (`multipart/form-data`, field name `receipt`) for OCR extraction |
| GET | `/api/health` | Simple health check |

Example: adding an expense with `curl`
```
curl -X POST http://localhost:5000/api/expenses ^
  -H "Content-Type: application/json" ^
  -d "{\"date\":\"2026-09-15\",\"amount\":450,\"category\":\"Food\",\"description\":\"Lunch\"}"
```

---

## 13. Notes

- Manual expense entry is the core feature and works with zero setup beyond
  the backend + frontend.
- Receipt scanning is a bonus feature that requires Tesseract OCR to be
  installed; everything else works without it.
- All dashboard numbers, budget calculations, and predictions come directly
  from the SQLite database — nothing is hardcoded.
