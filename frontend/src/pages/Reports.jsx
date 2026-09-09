import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { fetchReports } from "../services/reportService";
import SummaryCard from "../components/SummaryCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { monthLabel } from "../utils/format";

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    fetchReports()
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err.message || "Could not load reports."))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Loading />;
  if (error) return <EmptyState title="Couldn't load reports" description={error} />;
  if (!data) return null;

  const cashFlowData = data.monthly.map((m) => ({
    month: monthLabel(m.month),
    Net: m.net,
    Income: m.income,
    Expense: m.expense,
  }));

  const outstandingEntries = Object.entries(data.outstanding_people || {});

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Reports</h1>
          <p className="page__subtitle">A closer look at your cash flow over time.</p>
        </div>
      </div>

      <div className="summary-grid">
        <SummaryCard label="Total income" money={data.totals.income} tone="positive" icon="↓" />
        <SummaryCard label="Total expense" money={data.totals.expense} tone="negative" icon="↑" />
        <SummaryCard label="Total given" money={data.totals.given} tone="negative" icon="→" />
        <SummaryCard label="Total returned" money={data.totals.returned} tone="positive" icon="←" />
      </div>

      <div className="card">
        <div className="card__header">
          <h2>This month ({monthLabel(data.current_month.label)})</h2>
        </div>
        <div className="summary-grid summary-grid--tight">
          <SummaryCard label="Income" money={data.current_month.income} tone="positive" icon="↓" />
          <SummaryCard label="Expense" money={data.current_month.expense} tone="negative" icon="↑" />
          <SummaryCard label="Net savings" money={data.current_month.savings} tone="neutral" icon="●" />
        </div>
      </div>

      <div className="card chart-card">
        <div className="card__header">
          <h2>Cash flow trend</h2>
          <span className="card__hint">Net = income − expense, by month</span>
        </div>
        {cashFlowData.length === 0 ? (
          <EmptyState title="Not enough data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted)" width={40} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Income" fill="var(--positive)" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="Expense" fill="var(--negative)" radius={[4, 4, 0, 0]} barSize={18} />
              <Line
                type="monotone"
                dataKey="Net"
                stroke="var(--accent)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <h2>Outstanding by person</h2>
        </div>
        {outstandingEntries.length === 0 ? (
          <EmptyState title="No one currently owes money" />
        ) : (
          <div className="table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {outstandingEntries.map(([name, amount]) => (
                  <tr key={name}>
                    <td data-label="Person">{name}</td>
                    <td data-label="Outstanding" className="amount-neg">
                      ₹{amount.formatted}
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
