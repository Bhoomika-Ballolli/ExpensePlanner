/**
 * format.js
 * ---------
 * Small helper functions for formatting currency, dates, etc.
 * Keeping these in one place avoids repeating logic in every page.
 */

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Education",
  "Bills",
  "Healthcare",
  "Entertainment",
  "Other",
];

export const CATEGORY_COLORS = {
  Food: "#ec4899",
  Groceries: "#22c98d",
  Transport: "#f59e0b",
  Shopping: "#f9556b",
  Education: "#4f7dff",
  Bills: "#8b5cf6",
  Healthcare: "#14b8a6",
  Entertainment: "#22d3ee",
  Other: "#94a3b8",
};

/**
 * Returns a friendly, time-of-day-aware greeting for the dashboard header,
 * e.g. "Good morning", "Good afternoon", "Good evening".
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Returns the current month and year as a readable string, e.g. "September 2026".
 * Used so headers/subtitles never hardcode a date.
 */
export function getCurrentMonthLabel() {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
