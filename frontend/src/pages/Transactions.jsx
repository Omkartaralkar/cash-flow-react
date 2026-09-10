import { useEffect, useState, useMemo } from "react";
import { fetchTransactions, addTransaction, deleteTransaction } from "../services/transactionService";
import TransactionTable from "../components/TransactionTable";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  // Form State
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [person, setPerson] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTransactions();
      const list = Array.isArray(data) ? data : data?.transactions || [];
      setTransactions(list);
    } catch (err) {
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [transactions]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    setSubmitting(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        date,
        person: person.trim() || null,
        reason: reason.trim() || "",
      });
      setAmount("");
      setPerson("");
      setReason("");
      setFormOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || "Could not add transaction");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete transaction");
    }
  }

  if (loading) return <Loading label="Loading transactions…" />;
  if (error) return <EmptyState title="Couldn't load transactions" description={error} />;

  return (
    <div className="page transactions-page">
      <div className="page__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Transactions</h1>
        <button className="btn btn--primary" onClick={() => setFormOpen((prev) => !prev)}>
          {formOpen ? "Cancel" : "+ Add Transaction"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: "1.5rem", display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div>
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="given">Given</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div>
            <label>Amount (₹)</label>
            <input type="number" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label>Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label>Person (Optional)</label>
            <input type="text" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="e.g. Rudved" />
          </div>
          <div>
            <label>Reason / Note</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Office work" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" disabled={submitting} className="btn btn--primary" style={{ width: "100%" }}>
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="card">
        {sortedTransactions.length === 0 ? (
          <EmptyState title="No transactions found" description="Add your first transaction above." />
        ) : (
          <TransactionTable transactions={sortedTransactions} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}