import { formatDate, typeMeta } from "../utils/format";

export default function TransactionRow({ transaction, onEdit, onDelete, compact }) {
  const meta = typeMeta(transaction.type);
  const amount = transaction.credit || transaction.debit;
  const isCredit = Boolean(transaction.credit);

  return (
    <tr className="transaction-row">
      <td data-label="Date">{formatDate(transaction.date)}</td>
      <td data-label="Name">{transaction.name || "—"}</td>
      <td data-label="Reason / Source">{transaction.reason || "—"}</td>
      <td data-label="Type">
        <span className={`type-pill type-pill--${meta.tone}`}>
          {meta.label}
        </span>
      </td>
      <td data-label="Amount" className={isCredit ? "amount-pos" : "amount-neg"}>
        {isCredit ? "+" : "−"}₹{amount ? amount.toLocaleString("en-IN") : 0}
      </td>
      <td data-label="Balance">₹{transaction.balance_fmt}</td>
      {!compact && (
        <td data-label="Actions" className="row-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onEdit(transaction)}
            aria-label="Edit transaction"
          >
            Edit
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            onClick={() => onDelete(transaction)}
            aria-label="Delete transaction"
          >
            Delete
          </button>
        </td>
      )}
    </tr>
  );
}
