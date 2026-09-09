import traceback
from flask import Blueprint, jsonify

from storage import load_data, current_transactions
from api_utils import login_required
from calculations import (
    compute_ledger,
    money,
    person_money,
    sorted_people_by_outstanding,
)
from helpers import format_inr, to_words

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard")
@dashboard_bp.route("/api/dashboard")
@login_required
def dashboard():
    try:
        data = load_data()
        transactions = current_transactions(data) or []

        # Sort chronologically (oldest first) so running ledger balance computes accurately
        transactions_chronological = sorted(
            transactions,
            key=lambda t: (str(t.get("date", "")), int(t.get("id") or 0))
        )

        ledger, totals, people = compute_ledger(transactions_chronological)
        people = sorted_people_by_outstanding(people) if people else {}

        ledger_out = []
        for row in (ledger or []):
            credit = row.get("credit") or 0
            debit = row.get("debit") or 0
            balance = row.get("balance") or 0
            ledger_out.append({
                **row,
                "credit_fmt": format_inr(credit) if credit else "",
                "debit_fmt": format_inr(debit) if debit else "",
                "balance_fmt": format_inr(balance),
                "credit_words": to_words(credit) if credit else "",
                "debit_words": to_words(debit) if debit else "",
                "balance_words": to_words(balance),
            })

        people_out = {
            name: person_money(person)
            for name, person in (people or {}).items()
        }

        return jsonify({
            "balance": money(totals.get("balance", 0)),
            "totals": {
                "income": money(totals.get("income", 0)),
                "expense": money(totals.get("expense", 0)),
                "given": money(totals.get("given", 0)),
                "returned": money(totals.get("returned", 0)),
                "current_given": money(totals.get("current_given", 0)),
            },
            "transactions": ledger_out,
            "people": people_out,
        })
    except Exception as exc:
        return jsonify({
            "error": f"Dashboard calculation error: {str(exc)}",
            "traceback": traceback.format_exc()
        }), 500