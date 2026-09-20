import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import AddExpense from "./pages/AddExpense.jsx";
import Forecast from "./pages/Forecast.jsx";
import Budget from "./pages/Budget.jsx";
import ReceiptScanner from "./pages/ReceiptScanner.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/receipt-scanner" element={<ReceiptScanner />} />
      </Routes>
    </Layout>
  );
}
