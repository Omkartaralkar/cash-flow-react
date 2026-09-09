import { useEffect, useState } from "react";

import { fetchPeople } from "../services/peopleService";
import PersonTable from "../components/PersonTable";
import SummaryCard from "../components/SummaryCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const EMPTY_MONEY = { raw: 0, formatted: "₹0", words: "Zero rupees" };

export default function People() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    fetchPeople()
      .then((res) => {
        if (!alive) return;
        if (res && typeof res === "object") {
          setData(res);
        } else {
          setData({ totals: {}, people: {} });
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || "Could not load people.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const totals = data?.totals || {};
  const people = data?.people || {};

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
            <SummaryCard
              label="Total given"
              money={totals.total_given || totals.given || EMPTY_MONEY}
              tone="negative"
              icon="→"
            />
            <SummaryCard
              label="Total returned"
              money={totals.total_returned || totals.returned || EMPTY_MONEY}
              tone="positive"
              icon="←"
            />
            <SummaryCard
              label="Currently outstanding"
              money={totals.current_given || EMPTY_MONEY}
              tone="neutral"
              icon="●"
            />
          </div>

          <div className="card">
            <PersonTable people={people} />
          </div>
        </>
      )}
    </div>
  );
}