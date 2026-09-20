import { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, ScanLine, ReceiptText } from "lucide-react";
import { scanReceipt, addExpense } from "../services/api.js";
import { CATEGORIES, CATEGORY_COLORS } from "../services/format.js";
import { getCategoryIcon } from "../services/categoryIcons.js";
import { ErrorState } from "../components/StateViews.jsx";

const today = new Date().toISOString().split("T")[0];

export default function ReceiptScanner() {
  const fileInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ date: today, amount: "", category: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    handleFile(file);
  }

  function handleFile(file) {
    setError("");
    setScanResult(null);
    setSaved(false);

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, JPEG and PNG files are supported.");
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    runOcr(file);
  }

  async function runOcr(file) {
    setScanning(true);
    try {
      const result = await scanReceipt(file);
      setScanResult(result);

      if (result.success && result.extracted) {
        setForm({
          date: result.extracted.date || today,
          amount: result.extracted.amount ? String(result.extracted.amount) : "",
          category: result.extracted.category || "",
          description: result.extracted.description || "",
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const errors = {};
    if (!form.date) errors.date = "Date is required.";
    if (!form.category) errors.category = "Category is required.";
    const amountNum = parseFloat(form.amount);
    if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
      errors.amount = "Amount must be greater than 0.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveExpense(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setSaving(true);
    try {
      await addExpense({
        date: form.date,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
      });
      setSaved(true);
      setForm({ date: today, amount: "", category: "", description: "" });
      setImagePreview(null);
      setScanResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Optional feature</div>
        <h2>Scan a Receipt</h2>
        <p>Upload a photo of a receipt to auto-fill an expense — manual entry always works too.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ReceiptText size={16} style={{ color: "var(--primary-purple)" }} />
            Upload Receipt
          </div>

          {!imagePreview ? (
            <div
              className="upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="upload-icon-wrap">
                <UploadCloud size={26} />
              </div>
              <p style={{ fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Click to browse or drag a receipt here</p>
              <p style={{ fontSize: "0.8rem" }}>Supports JPG, JPEG, PNG</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div>
              <img src={imagePreview} alt="Receipt preview" className="receipt-preview" />
              <button
                className="btn btn-secondary"
                style={{ marginTop: 12, width: "100%" }}
                onClick={() => {
                  setImagePreview(null);
                  setScanResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Upload a different image
              </button>
            </div>
          )}

          {error && <div style={{ marginTop: 14 }}><ErrorState message={error} /></div>}

          {scanning && (
            <div className="alert alert-warning" style={{ marginTop: 14, marginBottom: 0 }}>
              <ScanLine size={18} />
              <span>Processing receipt with OCR...</span>
            </div>
          )}

          {scanResult && !scanning && (
            <>
              {scanResult.success ? (
                scanResult.confident ? (
                  <div className="alert alert-success" style={{ marginTop: 14 }}>
                    <CheckCircle size={18} />
                    <span>Details extracted. Please verify before saving.</span>
                  </div>
                ) : (
                  <div className="alert alert-warning" style={{ marginTop: 14 }}>
                    <AlertTriangle size={18} />
                    <span>Could not confidently extract all information. Please review and enter details manually.</span>
                  </div>
                )
              ) : (
                <div className="alert alert-warning" style={{ marginTop: 14 }}>
                  <AlertTriangle size={18} />
                  <span>{scanResult.message}</span>
                </div>
              )}

              {scanResult.raw_text && (
                <div style={{ marginTop: 12 }}>
                  <div className="card-title" style={{ fontSize: "0.78rem", marginBottom: 8 }}>OCR Extracted Text</div>
                  <div className="raw-text-box">{scanResult.raw_text}</div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">Verify &amp; Save Expense</div>

          {saved && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              <span>Expense saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveExpense}>
            <div className="form-row">
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 450"
                  value={form.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                />
                {fieldErrors.amount && <div className="form-error">{fieldErrors.amount}</div>}
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
                {fieldErrors.date && <div className="form-error">{fieldErrors.date}</div>}
              </div>
            </div>

            <div className="form-group">
              <label>
                Category{" "}
                {scanResult?.extracted?.category && (
                  <span className="optional-tag">(suggested)</span>
                )}
              </label>
              <div className="category-select-grid">
                {CATEGORIES.map((c) => {
                  const Icon = getCategoryIcon(c);
                  const selected = form.category === c;
                  return (
                    <button
                      type="button"
                      key={c}
                      className={`category-option ${selected ? "selected" : ""}`}
                      onClick={() => handleChange("category", c)}
                      style={selected ? { color: CATEGORY_COLORS[c] } : undefined}
                    >
                      <Icon size={15} />
                      {c}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.category && <div className="form-error">{fieldErrors.category}</div>}
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Grocery store"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Saving..." : "Save Expense"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
