/**
 * SummaryCard.jsx
 * ---------------
 * A reusable premium dashboard stat card.
 *
 * `glow` is a CSS gradient value (e.g. "var(--gradient-primary)") used for
 * both the icon badge and the soft decorative glow in the card's corner -
 * this is what gives each summary card its own accent color.
 */
export default function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  subIcon: SubIcon,
  glow = "var(--gradient-primary)",
  trend, // optional: { direction: "up" | "down", label: "12.5%" }
}) {
  return (
    <div className="summary-card fade-in" style={{ "--card-glow": glow }}>
      <div className="icon-badge">
        <Icon size={18} />
      </div>
      <span className="label">{label}</span>
      <span className="value" title={typeof value === "string" ? value : undefined}>
        {value}
      </span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {sub && (
          <span className="sub">
            {SubIcon && <SubIcon size={12} />}
            {sub}
          </span>
        )}
        {trend && (
          <span className={`trend-pill ${trend.direction === "up" ? "trend-up" : "trend-down"}`}>
            {trend.direction === "up" ? "↑" : "↓"} {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
