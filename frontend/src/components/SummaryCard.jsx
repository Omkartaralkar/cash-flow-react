export default function SummaryCard({ label, money, tone = "neutral", icon }) {
  if (!money) return null;

  return (
    <div className={`summary-card summary-card--${tone}`}>
      <div className="summary-card__icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <span className="summary-card__label">{label}</span>
        <div className="summary-card__amount">₹{money.formatted}</div>
      </div>
    </div>
  );
}
