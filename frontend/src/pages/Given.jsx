import TransactionTypeView from "./TransactionTypeView";

export default function Given() {
  return (
    <TransactionTypeView
      type="given"
      title="Given"
      addLabel="Record money given"
      description="Money you've lent or handed to someone."
    />
  );
}
