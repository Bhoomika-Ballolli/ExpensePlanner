import { useEffect, useState } from "react";
import { Search, Trash2, Plus, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { getExpenses, deleteExpense } from "../services/api.js";
import { formatCurrency, formatDate, CATEGORIES, CATEGORY_COLORS } from "../services/format.js";
import { getCategoryIcon } from "../services/categoryIcons.js";
import { LoadingState, ErrorState, EmptyState } from "../components/StateViews.jsx";

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "1", label: "January" }, { value: "2", label: "February" },
  { value: "3", label: "March" }, { value: "4", label: "April" },
  { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" },
  { value: "9", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, month]);

  async function loadExpenses() {
    setLoading(true);
    setError("");
    try {
      const result = await getExpenses({ search, category, month });
      setExpenses(result.expenses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="eyebrow">Transactions</div>
            <h2>Expenses</h2>
            <p>View, search, filter and manage all your recorded expenses.</p>
          </div>
          <Link to="/add-expense" className="btn btn-primary">
            <Plus size={16} /> Add Expense
          </Link>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            className="form-control"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-control" value={month} onChange={(e) => setMonth(e.target.value)}>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <LoadingState message="Loading expenses..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            subtitle="Try changing your filters, or add a new expense to get started."
          />
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span className="text-muted" style={{ fontSize: "0.83rem", fontWeight: 500 }}>
                {expenses.length} transaction{expenses.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                {formatCurrency(total)} total
              </span>
            </div>
            <div className="table-wrap">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => {
                    const CategoryIcon = getCategoryIcon(e.category);
                    const color = CATEGORY_COLORS[e.category] || "#8884d8";
                    return (
                      <tr key={e.id}>
                        <td>
                          <div className="row-with-icon">
                            <div className="category-icon-badge" style={{ background: `${color}22`, color }}>
                              <CategoryIcon size={16} />
                            </div>
                            <span style={{ fontWeight: 600 }}>{e.description || "-"}</span>
                          </div>
                        </td>
                        <td className="text-muted">{formatDate(e.date)}</td>
                        <td>
                          <span
                            className="category-pill"
                            style={{ background: `${color}22`, color }}
                          >
                            {e.category}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(e.amount)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-danger"
                            style={{ padding: "6px 10px" }}
                            onClick={() => handleDelete(e.id)}
                            disabled={deletingId === e.id}
                            aria-label="Delete expense"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
