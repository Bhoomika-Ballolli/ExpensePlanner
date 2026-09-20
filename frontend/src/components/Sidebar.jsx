import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  TrendingUp,
  Wallet,
  ScanLine,
  Wallet2,
} from "lucide-react";

// Every nav item lives in this array so adding a page later is a one-line change.
const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/add-expense", label: "Add Expense", icon: PlusCircle },
  { to: "/forecast", label: "Forecast", icon: TrendingUp },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/receipt-scanner", label: "Receipt Scanner", icon: ScanLine },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="logo-icon">
            <Wallet2 size={20} />
          </div>
          <div>
            <h1>ExpensePlanner</h1>
            <span className="tagline">Expense intelligence</span>
          </div>
        </div>

        <div className="sidebar-section-label">Menu</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-motivation">
            <strong>Small steps</strong>
            lead to big savings
          </div>

          <div className="sidebar-profile">
            <div className="avatar">EP</div>
            <div>
              <div className="name">Guest User</div>
              <div className="role">Personal account</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
