import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { fetchPerson } from "../services/peopleService";
import SummaryCard from "../components/SummaryCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { formatDate } from "../utils/format";

const EMPTY_MONEY = { raw: 0, formatted: "₹0", words: "Zero rupees" };

export default function PersonDetail() {
  const { name } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    fetchPerson(name)
      .then((res) => {
        if (!alive) return;
        if (res && typeof res === "object") {
          setData(res);
        } else {
          setError("No data found for this person.");
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || "Could not load this person.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [name]);

  if (loading) return <Loading />;

  // Prevent accessing null data
  if (error || !data) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <Link to="/people" className="back-link">
              ← People
            </Link>
            <h1>{decodeURIComponent(name || "")}</h1>
          </div>
        </div>
        <EmptyState
          title="Couldn't load person"
          description={error || "Person details are unavailable."}
        />
      </div>
    );
  }

  const transactions = Array.isArray(data.transactions) ? data.transactions : [];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link to="/people" className="back-link">
            ← People
          </Link>
          <h1>{decodeURIComponent(name || "")}</h1>
        </div>
      </div>

      <div className="summary-grid summary-grid--tight">
        <SummaryCard
          label="Total given"
          money={data.total_given || EMPTY_MONEY}
          tone="negative"
          icon="→"
        />
        <SummaryCard
          label="Total returned"
          money={data.total_returned || EMPTY_MONEY}
          tone="positive"
          icon="←"
        />
        <SummaryCard
          label="Currently outstanding"
          money={data.current_given || EMPTY_MONEY}
          tone="neutral"
          icon="●"
        />
      </div>

      <div className="card">
        <div className="card__header">
          <h2>Transaction history</h2>
        </div>

        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" />
        ) : (
          <div className="table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason / Source</th>
                  <th>Given</th>
                  <th>Returned</th>
                  <th>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr key={t.id || idx}>
                    <td data-label="Date">{t.date ? formatDate(t.date) : "—"}</td>
                    <td data-label="Reason / Source">{t.reason || t.source || "—"}</td>
                    <td data-label="Given" className={t.given ? "amount-neg" : ""}>
                      {t.given ? `₹${t.given_fmt || t.amount_fmt || t.given}` : "—"}
                    </td>
                    <td data-label="Returned" className={t.returned ? "amount-pos" : ""}>
                      {t.returned ? `₹${t.returned_fmt || t.amount_fmt || t.returned}` : "—"}
                    </td>
                    <td data-label="Outstanding">
                      ₹{t.outstanding_fmt || t.balance_fmt || t.outstanding || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}