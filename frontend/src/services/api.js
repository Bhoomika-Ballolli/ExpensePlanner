/**
 * api.js
 * ------
 * A single, clean place for every call to the Flask backend.
 * Pages/components should NOT use fetch() directly - they should
 * import functions from here instead. This makes the code easier
 * to read, debug, and explain in an interview.
 */

const BASE_URL = "http://localhost:5000/api";

/**
 * Generic helper that wraps fetch() with consistent error handling.
 * Every function below uses this instead of repeating try/catch logic.
 */
async function request(path, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    // Even error responses (400/500) are still valid JSON from our Flask app
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error || "Something went wrong. Please try again.";
      throw new Error(message);
    }

    return data;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      throw new Error(
        "Could not reach the server. Please make sure the backend is running on http://localhost:5000."
      );
    }
    throw err;
  }
}

// ---------------- Expenses ----------------

export function getExpenses(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/expenses${query}`);
}

export function addExpense(expense) {
  return request("/expenses", {
    method: "POST",
    body: JSON.stringify(expense),
  });
}

export function deleteExpense(id) {
  return request(`/expenses/${id}`, { method: "DELETE" });
}

// ---------------- Dashboard ----------------

export function getDashboard() {
  return request("/dashboard");
}

// ---------------- Forecast ----------------

export function getForecast() {
  return request("/forecast");
}

// ---------------- Budget ----------------

export function getBudget(month, year) {
  return request(`/budget?month=${month}&year=${year}`);
}

export function setBudget(budget) {
  return request("/budget", {
    method: "POST",
    body: JSON.stringify(budget),
  });
}

// ---------------- OCR (Receipt Scanner) ----------------

export async function scanReceipt(file) {
  const formData = new FormData();
  formData.append("receipt", file);

  try {
    const response = await fetch(`${BASE_URL}/ocr`, {
      method: "POST",
      body: formData, // no Content-Type header - browser sets it automatically
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Could not process the receipt.");
    }
    return data;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      throw new Error(
        "Could not reach the server. Please make sure the backend is running."
      );
    }
    throw err;
  }
}
