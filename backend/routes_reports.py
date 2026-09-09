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

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.route("", methods=["GET"])
@login_required
def reports():
    data = load_data()
    transactions = current_transactions(data)

    ledger, totals, people = compute_ledger(transactions)
    people = sorted_people_by_outstanding(people)

    # Same rule as the original /dashboard route: only people who
    # currently have outstanding money owed are shown.
    outstanding_people = {
        name: money(person["current_given"])
        for name, person in people.items()
        if person["current_given"] > 0
    }

    months = monthly_breakdown(ledger)
    months_out = [
        {
            "month": m["month"],
            "income": m["income"],
            "expense": m["expense"],
            "given": m["given"],
            "returned": m["returned"],
            "net": m["income"] - m["expense"],
        }
        for m in months
    ]

    this_month = datetime.now().strftime("%Y-%m")
    current_month_row = next(
        (m for m in months if m["month"] == this_month),
        {"income": 0.0, "expense": 0.0}
    )

    return jsonify({
        "totals": {
            "income": money(totals["income"]),
            "expense": money(totals["expense"]),
            "given": money(totals["given"]),
            "returned": money(totals["returned"]),
            "balance": money(totals["income"] - totals["expense"]),
            "current_given": money(totals["current_given"]),
        },
        "current_month": {
            "label": this_month,
            "income": money(current_month_row["income"]),
            "expense": money(current_month_row["expense"]),
            "savings": money(
                current_month_row["income"] - current_month_row["expense"]
            ),
        },
        "outstanding_people": outstanding_people,
        "monthly": months_out,
    })
