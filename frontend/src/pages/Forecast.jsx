import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Sparkles, AlertTriangle, CalendarRange, History } from "lucide-react";
import { getForecast } from "../services/api.js";
import { formatCurrency } from "../services/format.js";
import { LoadingState, ErrorState } from "../components/StateViews.jsx";

const HOW_IT_WORKS_STEPS = [
  "Historical expenses are grouped by month to compute a monthly total.",
  "Each month is converted into a simple numerical index (0, 1, 2, 3...).",
  "A scikit-learn Linear Regression model is trained where the index is the input (X) and the monthly total is the target (y).",
  "The next month's index is passed into the trained model.",
  "The model's predicted value is returned as next month's forecasted expense.",
];

const tooltipStyle = {
  background: "#141827",
  border: "1px solid #2b3149",
  borderRadius: 10,
  fontSize: "0.82rem",
  color: "#f2f3f9",
};
const axisTick = { fontSize: 11, fill: "#7a7f97" };

export default function Forecast() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadForecast();
  }, []);

  async function loadForecast() {
    setLoading(true);
    setError("");
    try {
      const result = await getForecast();
      setForecast(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingState message="Training model and generating forecast..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Machine learning</div>
        <h2>Next Month Expense Forecast</h2>
        <p>A Linear Regression model trained on your own historical spending.</p>
      </div>

      {!forecast.success ? (
        <div className="card">
          <div className="alert alert-warning">
            <AlertTriangle size={18} />
            <span>{forecast.message}</span>
          </div>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            You currently have data for {forecast.months_available} month(s). At least{" "}
            {forecast.months_required} months of history are needed to train the model.
            Run <code>python seed_data.py</code> in the backend folder to load sample data,
            or keep adding expenses over time.
          </p>
        </div>
      ) : (
        <>
          {/* Hero prediction card */}
          <div className="forecast-hero fade-in">
            <div className="label">
              <TrendingUp size={16} /> Next Month Forecast
            </div>
            <div className="value">{formatCurrency(forecast.predicted_next_month_expense)}</div>
            <p className="caption">
              {forecast.explanation} This is an estimate based on past patterns and is not
              guaranteed to be accurate.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <span className="model-tag"><Sparkles size={13} /> Linear Regression</span>
              <span className="model-tag"><History size={13} /> {forecast.months_used_for_training} months of history</span>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarRange size={16} style={{ color: "var(--primary-purple)" }} />
                Months Used for Training
              </div>
              <h3 style={{ fontSize: "1.6rem" }}>{forecast.months_used_for_training}</h3>
            </div>
            <div className="card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <History size={16} style={{ color: "var(--primary-purple)" }} />
                Last Month's Expense ({forecast.last_month_label})
              </div>
              <h3 style={{ fontSize: "1.6rem" }}>{formatCurrency(forecast.last_month_expense)}</h3>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Historical Expense → Predicted Expense</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={[
                  ...forecast.history.map((h) => ({ label: h.month_label, total: h.total })),
                  { label: "Next Month", total: null, predicted: forecast.predicted_next_month_expense },
                ]}
                margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2436" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "#1f2436" }} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} />
                <Tooltip
                  formatter={(v) => (v !== null && v !== undefined ? formatCurrency(v) : "-")}
                  contentStyle={tooltipStyle}
                />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: "#8b5cf6" }} connectNulls={false} />
                <Line type="monotone" dataKey="predicted" stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 5, fill: "#22d3ee" }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#8b5cf6", borderRadius: "50%", marginRight: 6 }} />Historical</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#22d3ee", borderRadius: "50%", marginRight: 6 }} />Predicted</span>
            </div>
          </div>

          {/* How it works */}
          <div className="card">
            <div className="card-title">How the prediction works</div>
            <div className="how-it-works-steps">
              {HOW_IT_WORKS_STEPS.map((step, i) => (
                <div className="how-it-works-step" key={i}>
                  <div className="step-number">{i + 1}</div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
            <hr className="divider" />
            <p className="text-faint" style={{ fontSize: "0.8rem" }}>
              Average error on historical data (mean absolute error):{" "}
              <strong style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(forecast.mean_absolute_error)}
              </strong>
              . This measures how far the model's own training predictions were from the
              actual monthly totals, on average — it is not an accuracy percentage or a
              guarantee about the future.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
