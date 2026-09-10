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

  // Form fields
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

    const parsedAmount = parseFloat(amount);
    const tempId = "temp-" + Date.now();
    const payload = {
      id: tempId,
      type: type.toLowerCase() === "returned" ? "return" : type.toLowerCase(),
      amount: parsedAmount,
      date: date,
      person: person.trim() || "",
      name: person.trim() || "",
      reason: reason.trim() || "",
      category: reason.trim() || "",
    };

    // Optimistic UI update
    setTransactions((prev) => [payload, ...prev]);
    setAmount("");
    setPerson("");
    setReason("");
    setFormOpen(false);

    setSubmitting(true);
    try {
      await addTransaction(payload);
      await loadData();
    } catch (err) {
      alert("Failed to save transaction: " + (err.message || "Unknown error"));
      setTransactions((prev) => prev.filter((t) => (t.id ?? t._id) !== tempId));
      setFormOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(target) {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    // Defensively resolve scalar ID if an object was passed
    const id = typeof target === "object" && target !== null 
      ? (target.id ?? target._id ?? target.index) 
      : target;

    if (id === undefined || id === null || id === "" || id === "[object Object]") {
      alert("Invalid transaction identifier.");
      return;
    }

    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => (t.id ?? t._id) !== id));
    } catch (err) {
      alert(err.message || "Failed to delete transaction");
    }
  }

  if (loading) return <Loading label="Loading transactions…" />;
  if (error) return <EmptyState title="Couldn't load transactions" description={error} />;

  return (
    <div className="page transactions-page">
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>Transactions</h2>
            <span className="card__hint">{sortedTransactions.length} records</span>
          </div>
          <button 
            type="button" 
            className="btn btn--primary" 
            onClick={() => setFormOpen((prev) => !prev)}
          >
            {formOpen ? "Cancel" : "+ Add Transaction"}
          </button>
        </div>

        {formOpen && (
          <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="given">Given</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Amount (₹)</label>
                <input 
                  type="number" 
                  step="any" 
                  required 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Date</label>
                <input 
                  type="date" 
                  required 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Person (Optional)</label>
                <input 
                  type="text" 
                  value={person} 
                  onChange={(e) => setPerson(e.target.value)} 
                  placeholder="e.g. Rudved" 
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Reason / Note</label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="e.g. Office Work" 
                  style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button 
                type="button" 
                className="btn btn--ghost" 
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="btn btn--primary"
              >
                {submitting ? "Saving…" : "Save Transaction"}
              </button>
            </div>
          </form>
        )}
      </div>

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