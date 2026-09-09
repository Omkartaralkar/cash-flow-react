import { useEffect, useState } from "react";

import { fetchPeople } from "../services/peopleService";
import PersonTable from "../components/PersonTable";
import SummaryCard from "../components/SummaryCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

export default function People() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    fetchPeople()
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err.message || "Could not load people."))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Money with people</h1>
          <p className="page__subtitle">
            Everyone you've given money to, and what's still outstanding.
          </p>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <EmptyState title="Couldn't load people" description={error} />
      ) : (
        <>
          <div className="summary-grid summary-grid--tight">
            <SummaryCard label="Total given" money={data.totals.total_given} tone="negative" icon="→" />
            <SummaryCard label="Total returned" money={data.totals.total_returned} tone="positive" icon="←" />
            <SummaryCard label="Currently outstanding" money={data.totals.current_given} tone="neutral" icon="●" />
          </div>

          <div className="card">
            <PersonTable people={data.people} />
          </div>
        </>
      )}
    </div>
  );
}
