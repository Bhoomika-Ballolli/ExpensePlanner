import { AlertCircle, Inbox } from "lucide-react";

export function LoadingState({ message = "Loading..." }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="alert alert-error">
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, subtitle, icon: Icon = Inbox }) {
  return (
    <div className="empty-state">
      <div className="icon-wrap">
        <Icon size={24} />
      </div>
      <h3 style={{ marginBottom: 6, fontSize: "1rem", color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p style={{ fontSize: "0.88rem" }}>{subtitle}</p>
    </div>
  );
}
