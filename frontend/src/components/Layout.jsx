import { useState } from "react";
import { Menu, Wallet2 } from "lucide-react";
import Sidebar from "./Sidebar.jsx";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mobile-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: "var(--gradient-primary)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Wallet2 size={16} />
            </div>
            <strong style={{ fontSize: "0.95rem" }}>ExpensePlanner</strong>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
