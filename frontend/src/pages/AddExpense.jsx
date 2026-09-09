import TransactionTypeView from "./TransactionTypeView";

export default function AddExpense() {
  return (
    <TransactionTypeView
      type="expense"
      title="Expense"
      addLabel="Add expense"
      description="Money going out — bills, purchases, or any other cost."
    />
  );
}
