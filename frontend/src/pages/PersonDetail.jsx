import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { fetchPerson } from "../services/peopleService";
import SummaryCard from "../components/SummaryCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { formatDate } from "../utils/format";

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
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err.message || "Could not load this person."))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [name]);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link to="/people" className="back-link">
            ← People
          </Link>
          <h1>{name}</h1>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <EmptyState title="Couldn't load person" description={error} />
      ) : (
        <>
          <div className="summary-grid summary-grid--tight">
            <SummaryCard label="Total given" money={data.total_given} tone="negative" icon="→" />
            <SummaryCard label="Total returned" money={data.total_returned} tone="positive" icon="←" />
            <SummaryCard label="Currently outstanding" money={data.current_given} tone="neutral" icon="●" />
          </div>

          <div className="card">
            <div className="card__header">
              <h2>Transaction history</h2>
            </div>

            {data.transactions.length === 0 ? (
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
                    {data.transactions.map((t) => (
                      <tr key={t.id}>
                        <td data-label="Date">{formatDate(t.date)}</td>
                        <td data-label="Reason / Source">{t.reason || "—"}</td>
                        <td data-label="Given" className={t.given ? "amount-neg" : ""}>
                          {t.given ? `₹${t.given_fmt}` : "—"}
                        </td>
                        <td data-label="Returned" className={t.returned ? "amount-pos" : ""}>
                          {t.returned ? `₹${t.returned_fmt}` : "—"}
                        </td>
                        <td data-label="Outstanding">₹{t.outstanding_fmt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
