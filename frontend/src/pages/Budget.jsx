import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, PiggyBank } from "lucide-react";
import { getBudget, setBudget, getDashboard } from "../services/api.js";
import { formatCurrency } from "../services/format.js";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";

const today = new Date();

export default function Budget() {
  const [budgetAmount, setBudgetAmount] = useState("");
  const [currentBudget, setCurrentBudget] = useState(null);
  const [actualSpending, setActualSpending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [budgetResult, dashboardResult] = await Promise.all([
        getBudget(today.getMonth() + 1, today.getFullYear()),
        getDashboard(),
      ]);
      setCurrentBudget(budgetResult.budget);
      setBudgetAmount(budgetResult.budget ? budgetResult.budget.amount : "");
      setActualSpending(dashboardResult.this_month_total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const amountNum = parseFloat(budgetAmount);
    if (!amountNum || amountNum <= 0) {
      setError("Budget amount must be greater than 0.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const result = await setBudget({
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        amount: amountNum,
      });
      setCurrentBudget(result.budget);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading budget..." />;

  const budgetValue = currentBudget ? currentBudget.amount : 0;
  const utilization = budgetValue > 0 ? Math.min((actualSpending / budgetValue) * 100, 100) : 0;
  const exceeded = budgetValue > 0 && actualSpending > budgetValue;
  const remaining = budgetValue - actualSpending;

  const monthName = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Planning</div>
        <h2>Monthly Budget</h2>
        <p>Set your budget for {monthName} and track how you're doing against it.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PiggyBank size={16} style={{ color: "var(--primary-purple)" }} />
            Set Budget
          </div>
          {success && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              <span>Budget saved successfully!</span>
            </div>
          )}
          {error && <ErrorState message={error} />}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Monthly Budget (₹) for {monthName}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="e.g. 20000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Saving..." : currentBudget ? "Update Budget" : "Set Budget"}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Budget Progress</div>

          {!currentBudget ? (
            <p className="text-muted" style={{ fontSize: "0.9rem" }}>
              You haven't set a budget for this month yet. Set one to see your progress here.
            </p>
          ) : (
            <>
              <div className="budget-hero">
                <span className="amount">{formatCurrency(actualSpending)}</span>
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                  of {formatCurrency(budgetValue)}
                </span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${utilization}%`,
                    background: exceeded ? "var(--danger)" : "var(--success)",
                  }}
                />
              </div>

              <p className="text-faint" style={{ fontSize: "0.79rem", marginBottom: 14 }}>
                {utilization.toFixed(1)}% of your budget used
              </p>

              {exceeded ? (
                <div className="status-badge bad" style={{ marginBottom: 10 }}>
                  <AlertTriangle size={14} /> Budget Exceeded
                </div>
              ) : (
                <div className="status-badge ok" style={{ marginBottom: 10 }}>
                  <CheckCircle size={14} /> Within Budget
                </div>
              )}

              {exceeded ? (
                <div className="alert alert-error" style={{ marginBottom: 0 }}>
                  <AlertTriangle size={18} />
                  <span>
                    Spent {formatCurrency(actualSpending)} against a budget of{" "}
                    {formatCurrency(budgetValue)} — exceeded by {formatCurrency(Math.abs(remaining))}.
                  </span>
                </div>
              ) : (
                <div className="alert alert-success" style={{ marginBottom: 0 }}>
                  <CheckCircle size={18} />
                  <span>{formatCurrency(remaining)} remaining this month.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
