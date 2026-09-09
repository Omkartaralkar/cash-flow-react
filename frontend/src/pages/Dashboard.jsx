import { useEffect, useState } from "react";
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
        setDashboard(dashboardData);
        setMonthly(reportsData.monthly || []);
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

  if (loading) return <Loading label="Loading your dashboard…" />;
  if (error) return <EmptyState title="Couldn't load dashboard" description={error} />;
  if (!dashboard) return null;

  const recent = [...dashboard.transactions].slice(-8).reverse();
  const peopleEntries = Object.entries(dashboard.people || {}).slice(0, 4);

  const chartData = monthly.map((m) => ({
    month: monthLabel(m.month),
    Income: m.income,
    Expense: m.expense,
  }));

  const givenReturnedData = monthly.map((m) => ({
    month: monthLabel(m.month),
    Given: m.given,
    Returned: m.returned,
  }));

  return (
    <div className="page dashboard-page">
      <div className="dashboard-grid">
        <BalanceCard balance={dashboard.balance} />

        <div className="summary-grid">
          <SummaryCard label="Income" money={dashboard.totals.income} tone="positive" icon="↓" />
          <SummaryCard label="Expense" money={dashboard.totals.expense} tone="negative" icon="↑" />
          <SummaryCard label="Given" money={dashboard.totals.given} tone="negative" icon="→" />
          <SummaryCard label="Returned" money={dashboard.totals.returned} tone="positive" icon="←" />
          <SummaryCard
            label="Outstanding"
            money={dashboard.totals.current_given}
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
          <EmptyState title="No outstanding balances" description="Record a 'Given' transaction to start tracking." />
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
