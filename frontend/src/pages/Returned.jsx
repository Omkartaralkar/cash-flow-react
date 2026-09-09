import TransactionTypeView from "./TransactionTypeView";

export default function Returned() {
  return (
    <TransactionTypeView
      type="return"
      title="Returned"
      addLabel="Record money returned"
      description="Money that's come back from someone you'd given to."
    />
  );
}
