import TransactionRow from "./TransactionRow";
import EmptyState from "./EmptyState";

export default function TransactionTable({ transactions, onEdit, onDelete, compact }) {
  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Add your first income, expense, given or returned entry to see it here."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Reason / Source</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Balance</th>
            {!compact && <th></th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              onEdit={onEdit}
              onDelete={onDelete}
              compact={compact}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
