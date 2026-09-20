import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { addExpense } from "../services/api.js";
import { CATEGORIES, CATEGORY_COLORS } from "../services/format.js";
import { getCategoryIcon } from "../services/categoryIcons.js";
import { ErrorState } from "../components/StateViews.jsx";

const today = new Date().toISOString().split("T")[0];

export default function AddExpense() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: today,
    amount: "",
    category: "",
    description: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const errors = {};
    if (!form.date) errors.date = "Date is required.";
    if (!form.category) errors.category = "Category is required.";
    const amountNum = parseFloat(form.amount);
    if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
      errors.amount = "Amount must be greater than 0.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSuccess(false);

    if (!validate()) return;

    setSubmitting(true);
    try {
      await addExpense({
        date: form.date,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
      });
      setSuccess(true);
      setForm({ date: today, amount: "", category: "", description: "" });

      // Give the user a moment to see the success message, then go to dashboard
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">New transaction</div>
        <h2>Add Expense</h2>
        <p>Record a new expense manually — it's saved straight to your database.</p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>Expense added successfully! Redirecting to dashboard...</span>
          </div>
        )}
        {submitError && <ErrorState message={submitError} />}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="e.g. 450"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
              />
              {fieldErrors.amount && <div className="form-error">{fieldErrors.amount}</div>}
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                className="form-control"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
              {fieldErrors.date && <div className="form-error">{fieldErrors.date}</div>}
            </div>
          </div>

          <div className="form-group">
            <label>Category</label>
            <div className="category-select-grid">
              {CATEGORIES.map((c) => {
                const Icon = getCategoryIcon(c);
                const selected = form.category === c;
                return (
                  <button
                    type="button"
                    key={c}
                    className={`category-option ${selected ? "selected" : ""}`}
                    onClick={() => handleChange("category", c)}
                    style={selected ? { color: CATEGORY_COLORS[c] } : undefined}
                  >
                    <Icon size={15} />
                    {c}
                  </button>
                );
              })}
            </div>
            {fieldErrors.category && <div className="form-error">{fieldErrors.category}</div>}
          </div>

          <div className="form-group">
            <label>Description <span className="optional-tag">(optional)</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Lunch with friends"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? "Saving..." : "Save Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
