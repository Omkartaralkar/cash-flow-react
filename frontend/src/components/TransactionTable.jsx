import { useMemo } from "react";
import { formatDate } from "../utils/format";

export default function TransactionTable({
  transactions = [],
  onEdit,
  onDelete,
  compact = false,
}) {
  // Compute running balance if not provided by backend
  const rowsWithBalance = useMemo(() => {
    if (!transactions.length) return [];

    // If transactions already contain a backend balance, use them directly
    if (transactions[0]?.balance !== undefined && transactions[0]?.balance !== null) {
      return transactions;
    }

    // Otherwise calculate running balance:
    // Sort chronologically (oldest to newest) to accumulate balance
    const chrono = [...transactions].sort(
      (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
    );

    let running = 0;
    const balanceMap = new Map();

    chrono.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.type === "income" || t.type === "return") {
        running += amt;
      } else if (t.type === "expense" || t.type === "given") {
        running -= amt;
      }
      balanceMap.set(t.id, running);
    });

    // Return original view order with attached running balance
    return transactions.map((t) => ({
      ...t,
      balance: balanceMap.get(t.id) ?? t.balance,
    }));
  }, [transactions]);

  if (!rowsWithBalance.length) {
    return null;
  }

  const thRight = { textAlign: "right" };
  const tdRight = { textAlign: "right", fontVariantNumeric: "tabular-nums" };

  return (
    <div className="table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th style={thRight}>Credit</th>
            <th style={thRight}>Debit</th>
            <th style={thRight}>Balance</th>
            {!compact && <th style={thRight}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rowsWithBalance.map((t, idx) => {
            const isCredit = t.type === "income" || t.type === "return";
            const isDebit = t.type === "expense" || t.type === "given";

            const formattedAmount = Number(t.amount || 0).toLocaleString("en-IN");
            const hasBalance = t.balance !== undefined && t.balance !== null;
            const formattedBalance = hasBalance
              ? Number(t.balance).toLocaleString("en-IN")
              : null;

            const description = t.person || t.reason || t.source || t.note || t.type || "—";

            return (
              <tr key={t.id || idx}>
                <td data-label="Date">
                  {t.date ? formatDate(t.date) : "—"}
                </td>

                <td data-label="Description" style={{ fontWeight: 500 }}>
                  {description}
                </td>

                {/* Credit */}
                <td data-label="Credit" style={tdRight}>
                  {isCredit ? (
                    <span style={{ color: "#10b981", fontWeight: 600 }}>₹{formattedAmount}</span>
                  ) : (
                    <span style={{ opacity: 0.4 }}>-</span>
                  )}
                </td>

                {/* Debit */}
                <td data-label="Debit" style={tdRight}>
                  {isDebit ? (
                    <span style={{ color: "#ef4444", fontWeight: 600 }}>₹{formattedAmount}</span>
                  ) : (
                    <span style={{ opacity: 0.4 }}>-</span>
                  )}
                </td>

                {/* Running Balance */}
                <td data-label="Balance" style={{ ...tdRight, fontWeight: 600 }}>
                  {formattedBalance !== null ? `₹${formattedBalance}` : "-"}
                </td>

                {!compact && (
                  <td data-label="Actions" style={tdRight} className="actions-col">
                    {onEdit && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--xs"
                        onClick={() => onEdit(t)}
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="btn btn--danger-ghost btn--xs"
                        onClick={() => onDelete(t)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}