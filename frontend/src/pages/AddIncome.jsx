import TransactionTypeView from "./TransactionTypeView";

export default function AddIncome() {
  return (
    <TransactionTypeView
      type="income"
      title="Income"
      addLabel="Add income"
      description="Money coming in — salary, sales, or any other source."
    />
  );
}
