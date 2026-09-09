import { useState } from "react";

export default function BalanceCard({ balance }) {
  const [hidden, setHidden] = useState(false);

  if (!balance) return null;

  return (
    <div className="balance-card">
      <div className="balance-card__top">
        <span className="balance-card__label">Current cash balance</span>
        <button
          type="button"
          className="balance-card__toggle"
          onClick={() => setHidden((h) => !h)}
        >
          {hidden ? "Show" : "Hide"}
        </button>
      </div>

      <div className="balance-card__amount">
        {hidden ? (
          <span className="balance-card__masked">•••••••</span>
        ) : (
          <>
            <span className="balance-card__currency">₹</span>
            {balance.formatted}
          </>
        )}
      </div>

      {!hidden && (
        <p className="balance-card__words">{balance.words} rupees</p>
      )}
    </div>
  );
}
