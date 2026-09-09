import { useCallback, useEffect, useState } from "react";

import {
  fetchTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionService";
import TransactionTable from "../components/TransactionTable";
import TransactionForm from "../components/TransactionForm";
import Modal, { ConfirmDialog } from "../components/Modal";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useToast } from "../hooks/useToast";

export default function TransactionTypeView({ type, title, addLabel, description }) {
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTransactions({ type });
      setTransactions([...data.transactions].reverse());
    } catch (err) {
      setError(err.message || "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(transaction) {
    setEditing(transaction);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if (editing) {
      await updateTransaction(editing.id, payload);
      showToast(`${title} entry updated.`);
    } else {
      await addTransaction(payload);
      showToast(`${title} entry added.`);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTransaction(deleting.id);
      showToast(`${title} entry deleted.`);
      setDeleting(null);
      load();
    } catch (err) {
      showToast(err.message || "Could not delete.", "error");
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>{title}</h1>
          {description && <p className="page__subtitle">{description}</p>}
        </div>
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          {addLabel}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : error ? (
          <EmptyState title="Couldn't load entries" description={error} />
        ) : (
          <TransactionTable
            transactions={transactions}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${title.toLowerCase()} entry` : addLabel}
      >
        <TransactionForm
          type={type}
          initial={editing || undefined}
          submitLabel={editing ? "Save changes" : "Add entry"}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this entry?"
        message={
          deleting
            ? `This will permanently remove the ${type} entry of ₹${deleting.amount?.toLocaleString(
                "en-IN"
              )} dated ${deleting.date}.`
            : ""
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
