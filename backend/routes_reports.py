import traceback
from datetime import datetime

from flask import Blueprint, jsonify

from storage import load_data, current_transactions
from api_utils import login_required
from calculations import (
    compute_ledger,
    money,
    sorted_people_by_outstanding,
    monthly_breakdown,
)

reports_bp = Blueprint("reports", __name__)


def _sanitize_transactions(transactions):
    """Ensure all transaction records have safe string dates and numeric amounts."""
    cleaned = []
    for tx in transactions:
        if not isinstance(tx, dict):
            continue
        item = dict(tx)
        # Normalize date to string
        raw_date = item.get("date")
        if not raw_date or not isinstance(raw_date, str):
            item["date"] = datetime.now().strftime("%Y-%m-%d")
        # Normalize amount
        try:
            item["amount"] = float(item.get("amount", 0))
        except (ValueError, TypeError):
            item["amount"] = 0.0
        cleaned.append(item)
    return cleaned


@reports_bp.route("/reports", methods=["GET"])
@reports_bp.route("/api/reports", methods=["GET"])
@login_required
def reports():
    try:
        data = load_data()
        raw_txs = current_transactions(data) or []
        transactions = _sanitize_transactions(raw_txs)

        ledger, totals, people = compute_ledger(transactions)
        people = sorted_people_by_outstanding(people) if people else {}

        outstanding_people = {}
        for name, person in (people or {}).items():
            if isinstance(person, dict) and person.get("current_given", 0) > 0:
                outstanding_people[name] = money(person["current_given"])

        try:
            months = monthly_breakdown(ledger) or []
        except Exception:
            months = []

        months_out = []
        for m in months:
            inc = float(m.get("income", 0.0) or 0.0)
            exp = float(m.get("expense", 0.0) or 0.0)
            months_out.append({
                "month": str(m.get("month", "")),
                "income": inc,
                "expense": exp,
                "given": float(m.get("given", 0.0) or 0.0),
                "returned": float(m.get("returned", 0.0) or 0.0),
                "net": inc - exp,
            })

        this_month = datetime.now().strftime("%Y-%m")
        current_month_row = next(
            (m for m in months_out if m["month"] == this_month),
            {"income": 0.0, "expense": 0.0}
        )

        income_val = totals.get("income", 0.0) or 0.0
        expense_val = totals.get("expense", 0.0) or 0.0
        given_val = totals.get("given", 0.0) or 0.0
        returned_val = totals.get("returned", 0.0) or 0.0
        current_given_val = totals.get("current_given", 0.0) or 0.0

        return jsonify({
            "totals": {
                "income": money(income_val),
                "expense": money(expense_val),
                "given": money(given_val),
                "returned": money(returned_val),
                "balance": money(income_val - expense_val),
                "current_given": money(current_given_val),
            },
            "current_month": {
                "label": this_month,
                "income": money(current_month_row["income"]),
                "expense": money(current_month_row["expense"]),
                "savings": money(current_month_row["income"] - current_month_row["expense"]),
            },
            "outstanding_people": outstanding_people,
            "monthly": months_out,
        })
    except Exception as exc:
        return jsonify({
            "error": f"Reports failure: {str(exc)}",
            "traceback": traceback.format_exc()
        }), 500