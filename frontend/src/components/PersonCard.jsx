import { Link } from "react-router-dom";

export default function PersonCard({ name, person }) {
  return (
    <Link to={`/people/${encodeURIComponent(name)}`} className="person-card">
      <div className="person-card__avatar" aria-hidden="true">
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className="person-card__info">
        <span className="person-card__name">{name}</span>
        <span className="person-card__outstanding">
          ₹{person.current_given.formatted} outstanding
        </span>
      </div>
      <div className="person-card__breakdown">
        <div>
          <span className="label">Given</span>
          <span>₹{person.total_given.formatted}</span>
        </div>
        <div>
          <span className="label">Returned</span>
          <span>₹{person.total_returned.formatted}</span>
        </div>
      </div>
    </Link>
  );
}
