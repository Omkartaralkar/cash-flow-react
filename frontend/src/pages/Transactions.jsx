import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { fetchDashboard } from "../services/dashboardService";
import { fetchReports } from "../services/reportService";
import BalanceCard from "../components/BalanceCard";
import SummaryCard from "../components/SummaryCard";
import TransactionTable from "../components/TransactionTable";
import PersonCard from "../components/PersonCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { monthLabel } from "../utils/format";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [dashboardData, reportsData] = await Promise.all([
          fetchDashboard(),
          fetchReports(),
        ]);

        if (!alive) return;

        setDashboard(dashboardData || null);
        setMonthly(reportsData && reportsData.monthly ? reportsData.monthly : []);
      } catch (err) {
        if (alive) setError(err.message || "Could not load the dashboard.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const rawTransactions = Array.isArray(dashboard?.transactions)
    ? dashboard.transactions
    : [];

  // Sort strictly by calendar date (newest date first, tie-break by ID)
  const recent = useMemo(() => {
    return [...rawTransactions]
      .sort((a, b) => {
        const timeA = new Date(a.date || 0).getTime();
        const timeB = new Date(b.date || 0).getTime();
        return timeB - timeA || (b.id || 0) - (a.id || 0);
      })
      .slice(0, 8);
  }, [rawTransactions]);

  if (loading) return <Loading label="Loading your dashboard…" />;
  if (error) return <EmptyState title="Couldn't load dashboard" description={error} />;
  if (!dashboard) return null;

  const peopleEntries = Object.entries(dashboard.people || {}).slice(0, 4);
  const safeMonthly = Array.isArray(monthly) ? monthly : [];

  const chartData = safeMonthly.map((m) => ({
    month: monthLabel(m.month),
    Income: m.income || 0,
    Expense: m.expense || 0,
  }));

  const givenReturnedData = safeMonthly.map((m) => ({
    month: monthLabel(m.month),
    Given: m.given || 0,
    Returned: m.returned || 0,
  }));

  const totals = dashboard.totals || {
    income: { formatted: "₹0", words: "Zero" },
    expense: { formatted: "₹0", words: "Zero" },
    given: { formatted: "₹0", words: "Zero" },
    returned: { formatted: "₹0", words: "Zero" },
    current_given: { formatted: "₹0", words: "Zero" },
  };

  return (
    <div className="page dashboard-page">
      <div className="dashboard-grid">
        <BalanceCard balance={dashboard.balance || { formatted: "₹0", words: "Zero" }} />

        <div className="summary-grid">
          <SummaryCard label="Income" money={totals.income} tone="positive" icon="↓" />
          <SummaryCard label="Expense" money={totals.expense} tone="negative" icon="↑" />
          <SummaryCard label="Given" money={totals.given} tone="negative" icon="→" />
          <SummaryCard label="Returned" money={totals.returned} tone="positive" icon="←" />
          <SummaryCard
            label="Outstanding"
            money={totals.current_given}
            tone="neutral"
            icon="●"
          />
        </div>
      </div>

      <div className="chart-grid">
        <div className="card chart-card">
          <div className="card__header">
            <h2>Income vs expense</h2>
            <span className="card__hint">Last {chartData.length} months</span>
          </div>
          {chartData.length === 0 ? (
            <EmptyState title="Not enough data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--positive)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--negative)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--negative)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="Income"
                  stroke="var(--positive)"
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Expense"
                  stroke="var(--negative)"
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card chart-card">
          <div className="card__header">
            <h2>Given vs returned</h2>
            <span className="card__hint">By month</span>
          </div>
          {givenReturnedData.length === 0 ? (
            <EmptyState title="Not enough data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={givenReturnedData}>
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
                <Bar dataKey="Given" fill="var(--negative)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Returned" fill="var(--positive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2>People with outstanding money</h2>
          <Link to="/people" className="card__link">
            View all
          </Link>
        </div>
        {peopleEntries.length === 0 ? (
          <EmptyState
            title="No outstanding balances"
            description="Record a 'Given' transaction to start tracking."
          />
        ) : (
          <div className="people-grid">
            {peopleEntries.map(([name, person]) => (
              <PersonCard key={name} name={name} person={person} />
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <h2>Recent transactions</h2>
          <Link to="/transactions" className="card__link">
            View all
          </Link>
        </div>
        <TransactionTable transactions={recent} compact />
      </div>
    </div>
  );
}