import { useState } from "react";

import { todayISO } from "../utils/format";

const emptyForm = (type) => ({
  type,
  name: "",
  reason: "",
  amount: "",
  date: todayISO(),
});

export default function TransactionForm({
  type,
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    ...emptyForm(type),
    ...(initial || {}),
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const nextErrors = {};

    if (!String(form.name).trim() && !String(form.reason).trim()) {
      nextErrors.name = "Enter a name or a reason / source.";
      nextErrors.reason = "Enter a name or a reason / source.";
    }

    const amountNumber = Number(form.amount);
    if (!form.amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      nextErrors.amount = "Enter an amount greater than zero.";
    }

    if (!form.date) {
      nextErrors.date = "Choose a date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        type: form.type,
        name: String(form.name).trim(),
        reason: String(form.reason).trim(),
        amount: Number(form.amount),
        date: form.date,
      });
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const showTypeSelect = type === "any";

  return (
    <form className="tx-form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="form-alert">{formError}</div>}

      {showTypeSelect && (
        <div className="field">
          <label htmlFor="tx-type">Type</label>
          <select
            id="tx-type"
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="given">Given</option>
            <option value="return">Returned</option>
          </select>
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="tx-name">
            {form.type === "given" || form.type === "return"
              ? "Person's name"
              : "Name"}
          </label>
          <input
            id="tx-name"
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Ganesh"
            aria-invalid={Boolean(errors.name)}
          />
        </div>

        <div className="field">
          <label htmlFor="tx-reason">Reason / Source</label>
          <input
            id="tx-reason"
            type="text"
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            placeholder="e.g. Office income"
            aria-invalid={Boolean(errors.reason)}
          />
        </div>
      </div>
      {(errors.name || errors.reason) && (
        <p className="field-error">{errors.name || errors.reason}</p>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="tx-amount">Amount (₹)</label>
          <input
            id="tx-amount"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            aria-invalid={Boolean(errors.amount)}
          />
          {errors.amount && <p className="field-error">{errors.amount}</p>}
        </div>

        <div className="field">
          <label htmlFor="tx-date">Date</label>
          <input
            id="tx-date"
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            aria-invalid={Boolean(errors.date)}
          />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>
      </div>

      <div className="modal__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
