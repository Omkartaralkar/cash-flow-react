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

      if (data && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else if (data && data.error) {
        setError(data.error);
        setTransactions([]);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError(err.message || "Could not load transactions.");
      setTransactions([]);
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
    const list = Array.isArray(transactions) ? [...transactions] : [];
    if (!list.length) return [];

    // 1. Calculate running balance chronologically across the entire dataset
    const chrono = [...list].sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      return timeA - timeB || (a.id || 0) - (b.id || 0);
    });

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

    // 2. Attach the computed running balance to each item
    const listWithBalance = list.map((t) => ({
      ...t,
      balance:
        t.balance !== undefined && t.balance !== null
          ? t.balance
          : balanceMap.get(t.id),
    }));

    // 3. Sort by actual calendar date (falling back to ID for same-day entries)
    listWithBalance.sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();

      if (sortOrder === "newest") {
        return timeB - timeA || (b.id || 0) - (a.id || 0);
      }
      if (sortOrder === "oldest") {
        return timeA - timeB || (a.id || 0) - (b.id || 0);
      }
      if (sortOrder === "highest") {
        return (b.amount || 0) - (a.amount || 0) || timeB - timeA;
      }
      if (sortOrder === "lowest") {
        return (a.amount || 0) - (b.amount || 0) || timeA - timeB;
      }
      return 0;
    });

    return listWithBalance;
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
    try {
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
    } catch (err) {
      showToast(err.message || "Operation failed.", "error");
    }
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
          id="transactions-search"
          name="search"
          type="search"
          placeholder="Search name, reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-bar__search"
        />

        <select
          id="transactions-type-filter"
          name="typeFilter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="given">Given</option>
          <option value="return">Returned</option>
        </select>

        <input
          id="transactions-date-from"
          name="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="From date"
        />
        <input
          id="transactions-date-to"
          name="dateTo"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="To date"
        />

        <select
          id="transactions-sort-order"
          name="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
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