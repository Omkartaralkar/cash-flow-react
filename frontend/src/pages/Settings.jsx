import { useRef, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { importExcel } from "../services/importService";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError("");
    setResult(null);

    try {
      const data = await importExcel(file);
      setResult(data);
      showToast(`Imported ${data.imported} transactions.`);
    } catch (err) {
      setError(err.message || "Could not import this file.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Settings</h1>
          <p className="page__subtitle">Account, appearance, and data tools.</p>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2>Account</h2>
        </div>
        <div className="settings-row">
          <span className="settings-row__label">Signed in as</span>
          <span>{user}</span>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2>Appearance</h2>
        </div>
        <div className="settings-row">
          <span className="settings-row__label">Theme</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2>Excel import</h2>
        </div>
        <p className="page__subtitle">
          Import transactions from an .xlsx workbook with Date, Reason / कारण,
          Income / जमा, and Expense / खर्च columns. Rows are appended to your
          account — nothing existing is changed or removed.
        </p>

        <div className="settings-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm"
            onChange={handleFileChange}
            disabled={importing}
          />
        </div>

        {importing && <p className="page__subtitle">Importing…</p>}

        {error && <div className="form-alert">{error}</div>}

        {result && (
          <div className="import-result">
            <p>
              Imported <strong>{result.imported}</strong> transactions
              {result.skipped > 0 && ` (${result.skipped} blank rows skipped)`}.
            </p>
            <p className="page__subtitle">
              {result.before_count} → {result.after_count} total transactions.
            </p>
          </div>
        )}

        <p className="settings-hint">
          Prefer the command line? The original importer still works:
          <code> python backend/import_swamiraj.py "Swamiraj.xlsx"</code>
        </p>
      </div>

      <div className="card">
        <div className="card__header">
          <h2>Data safety</h2>
        </div>
        <p className="page__subtitle">
          A timestamped backup of your data is created automatically every
          time the server starts, in <code>data/backups/</code>.
        </p>
      </div>
    </div>
  );
}
