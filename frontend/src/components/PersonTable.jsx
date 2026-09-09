import { Link } from "react-router-dom";
import EmptyState from "./EmptyState";

export default function PersonTable({ people }) {
  const entries = Object.entries(people || {});

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No one has outstanding money yet"
        description="People show up here once you record a 'Given' transaction."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Total given</th>
            <th>Total returned</th>
            <th>Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, person]) => (
            <tr key={name}>
              <td data-label="Person">
                <Link to={`/people/${encodeURIComponent(name)}`}>{name}</Link>
              </td>
              <td data-label="Total given">₹{person.total_given.formatted}</td>
              <td data-label="Total returned">
                ₹{person.total_returned.formatted}
              </td>
              <td data-label="Outstanding" className="amount-neg">
                ₹{person.current_given.formatted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
