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

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


@dashboard_bp.route("/dashboard")
@login_required
def dashboard():
    data = load_data()
    transactions = current_transactions(data)

    ledger, totals, people = compute_ledger(transactions)
    people = sorted_people_by_outstanding(people)

    ledger_out = []
    for row in ledger:
        ledger_out.append({
            **row,
            "credit_fmt": format_inr(row["credit"]) if row["credit"] else "",
            "debit_fmt": format_inr(row["debit"]) if row["debit"] else "",
            "balance_fmt": format_inr(row["balance"]),
            "credit_words": to_words(row["credit"]) if row["credit"] else "",
            "debit_words": to_words(row["debit"]) if row["debit"] else "",
            "balance_words": to_words(row["balance"]),
        })

    people_out = {
        name: person_money(person)
        for name, person in people.items()
    }

    return jsonify({
        "balance": money(totals["balance"]),
        "totals": {
            "income": money(totals["income"]),
            "expense": money(totals["expense"]),
            "given": money(totals["given"]),
            "returned": money(totals["returned"]),
            "current_given": money(totals["current_given"]),
        },
        "transactions": ledger_out,
        "people": people_out,
    })
