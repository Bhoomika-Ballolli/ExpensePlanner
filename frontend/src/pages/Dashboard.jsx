import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import {
  Wallet, TrendingUp, PiggyBank, Receipt, AlertTriangle, CheckCircle2,
  Search, Bell, CalendarDays,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboard } from "../services/api.js";
import { formatCurrency, formatDate, CATEGORY_COLORS, getGreeting, getCurrentMonthLabel } from "../services/format.js";
import { getCategoryIcon } from "../services/categoryIcons.js";
import { LoadingState, ErrorState, EmptyState } from "../components/StateViews.jsx";
import SummaryCard from "../components/SummaryCard.jsx";

// Dark-theme tooltip style shared by every chart on this page
const tooltipStyle = {
  background: "#141827",
  border: "1px solid #2b3149",
  borderRadius: 10,
  fontSize: "0.82rem",
  color: "#f2f3f9",
};
const axisTick = { fontSize: 11, fill: "#7a7f97" };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboard();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingState message="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} />;

  const hasExpenses = data.recent_expenses && data.recent_expenses.length > 0;
  const forecast = data.forecast;
  const budgetExceeded = data.budget_amount > 0 && data.this_month_total > data.budget_amount;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="eyebrow">{getGreeting()} 👋</div>
            <h2>
              Here's your <span className="gradient-text">financial overview</span>
            </h2>
            <p>{getCurrentMonthLabel()} · Understand your spending and plan ahead.</p>
          </div>

          <div className="header-utility-bar">
            <div className="header-month-card">
              <CalendarDays size={15} /> {getCurrentMonthLabel()}
            </div>
            <div className="header-search">
              <Search size={15} />
              <input placeholder="Search..." />
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={17} />
              <span className="dot" />
            </button>
            <div className="header-avatar">EP</div>
          </div>
        </div>
      </div>

      {/* Summary Cards - all four values come directly from /api/dashboard */}
      <div className="summary-grid">
        <SummaryCard
          icon={Receipt}
          label="Total Expenses"
          value={formatCurrency(data.total_expenses)}
          sub="All time spending"
          glow="var(--gradient-primary)"
        />
        <SummaryCard
          icon={Wallet}
          label="This Month"
          value={formatCurrency(data.this_month_total)}
          sub={getCurrentMonthLabel()}
          glow="var(--gradient-pink)"
        />
        <SummaryCard
          icon={PiggyBank}
          label="Monthly Budget"
          value={data.budget_amount ? formatCurrency(data.budget_amount) : "Not set"}
          sub={
            data.remaining_budget !== null
              ? `${formatCurrency(Math.abs(data.remaining_budget))} ${budgetExceeded ? "over budget" : "remaining"}`
              : "Set a budget to track it"
          }
          subIcon={data.budget_amount ? (budgetExceeded ? AlertTriangle : CheckCircle2) : undefined}
          glow="var(--gradient-orange)"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Predicted Next Month"
          value={forecast?.success ? formatCurrency(forecast.predicted_next_month_expense) : "N/A"}
          sub={forecast?.success ? "via Linear Regression" : forecast?.message}
          glow="var(--gradient-cyan)"
        />
      </div>

      {!hasExpenses ? (
        <div className="card">
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            subtitle="Add your first expense or run seed_data.py to see sample data."
          />
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="charts-grid">
            <div className="card">
              <div className="card-title">Monthly Spending Trend</div>
              <div className="card-subtitle">Your total spend, month over month</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.monthly_trend} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#4f7dff" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2436" vertical={false} />
                  <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: "#1f2436" }} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} labelStyle={{ color: "#f2f3f9" }} />
                  <Line type="monotone" dataKey="total" stroke="url(#trendLine)" strokeWidth={3} dot={{ r: 3, fill: "#8b5cf6" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-title">Category Breakdown</div>
              <div className="card-subtitle">Where your money is going</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.category_breakdown}
                    dataKey="total"
                    nameKey="category"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {data.category_breakdown.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#8884d8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 6 }}>
                {data.category_breakdown.map((entry) => {
                  const total = data.category_breakdown.reduce((s, e) => s + e.total, 0);
                  const pct = total > 0 ? ((entry.total / total) * 100).toFixed(0) : 0;
                  return (
                    <div key={entry.category} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[entry.category] || "#8884d8", flexShrink: 0 }} />
                      {entry.category} <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Budget vs Actual + Recent Expenses */}
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Budget vs Actual (This Month)</div>
              <div className="card-subtitle">
                {budgetExceeded ? "You're over budget this month" : "You're on track this month"}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    {
                      name: getCurrentMonthLabel(),
                      Budget: data.budget_amount || 0,
                      Actual: data.this_month_total,
                    },
                  ]}
                  margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2436" vertical={false} />
                  <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: "#1f2436" }} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "0.78rem", color: "var(--text-secondary)" }} iconType="circle" iconSize={8} />
                  <Bar dataKey="Budget" fill="#2b3149" radius={[8, 8, 0, 0]} maxBarSize={64} />
                  <Bar dataKey="Actual" fill={budgetExceeded ? "#f9556b" : "#8b5cf6"} radius={[8, 8, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
              {budgetExceeded && (
                <div className="alert alert-error" style={{ marginTop: 14, marginBottom: 0 }}>
                  <AlertTriangle size={16} />
                  <span>You've exceeded this month's budget.</span>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title-row">
                <div>
                  <div className="card-title" style={{ marginBottom: 2 }}>Recent Expenses</div>
                  <div className="card-subtitle" style={{ marginBottom: 0 }}>Your latest transactions</div>
                </div>
                <Link to="/expenses" className="view-all-link">View all →</Link>
              </div>
              <div className="table-wrap">
                <table className="expense-table">
                  <tbody>
                    {data.recent_expenses.map((e) => {
                      const CategoryIcon = getCategoryIcon(e.category);
                      const color = CATEGORY_COLORS[e.category] || "#8884d8";
                      return (
                        <tr key={e.id}>
                          <td>
                            <div className="row-with-icon">
                              <div className="category-icon-badge" style={{ background: `${color}22`, color }}>
                                <CategoryIcon size={16} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {e.description || "-"}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {formatDate(e.date)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(e.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Forecast preview */}
          {forecast?.success && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-title-row" style={{ marginBottom: 6 }}>
                <span className="card-title" style={{ marginBottom: 0 }}>Forecast Preview</span>
                <Link to="/forecast" className="view-all-link">Full forecast →</Link>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Based on {forecast.months_used_for_training} months of history, your predicted
                spending next month is{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(forecast.predicted_next_month_expense)}
                </strong>.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
