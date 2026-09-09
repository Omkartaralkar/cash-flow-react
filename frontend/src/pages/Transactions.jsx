import { useCallback, useEffect, useMemo, useState } from "react";

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

const PAGE_SIZE = 15;

export default function Transactions() {
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTransactions({
        type: typeFilter,
        from: dateFrom,
        to: dateTo,
        q: search,
      });
      setTransactions(data.transactions);
    } catch (err) {
      setError(err.message || "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    const t = window.setTimeout(load, 250); // debounce search
    return () => window.clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, dateFrom, dateTo, sortOrder]);

  const sorted = useMemo(() => {
    const list = [...transactions];
    list.sort((a, b) => {
      if (sortOrder === "newest") return b.id - a.id;
      if (sortOrder === "oldest") return a.id - b.id;
      if (sortOrder === "highest") return b.amount - a.amount;
      if (sortOrder === "lowest") return a.amount - b.amount;
      return 0;
    });
    return list;
  }, [transactions, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      showToast("Transaction updated.");
    } else {
      await addTransaction(payload);
      showToast("Transaction added.");
    }
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTransaction(deleting.id);
      showToast("Transaction deleted.");
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
          <h1>Transactions</h1>
          <p className="page__subtitle">Every income, expense, given and returned entry.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          Add transaction
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search name, reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-bar__search"
        />

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="given">Given</option>
          <option value="return">Returned</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="To date"
        />

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : error ? (
          <EmptyState title="Couldn't load transactions" description={error} />
        ) : (
          <>
            <TransactionTable
              transactions={pageItems}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
            {sorted.length > PAGE_SIZE && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit transaction" : "Add transaction"}
      >
        <TransactionForm
          type="any"
          initial={editing || { type: "income" }}
          submitLabel={editing ? "Save changes" : "Add transaction"}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this transaction?"
        message={
          deleting
            ? `This will permanently remove the ${deleting.type} entry of ₹${deleting.amount?.toLocaleString(
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
