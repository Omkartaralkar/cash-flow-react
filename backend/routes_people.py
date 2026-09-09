from flask import Blueprint, jsonify

from storage import load_data, current_transactions
from api_utils import login_required
from calculations import (
    compute_ledger,
    money,
    person_money,
    sorted_people_by_outstanding,
)

people_bp = Blueprint("people", __name__, url_prefix="/api/people")


@people_bp.route("", methods=["GET"])
@login_required
def list_people():
    data = load_data()
    transactions = current_transactions(data)

    _ledger, totals, people = compute_ledger(transactions)
    people = sorted_people_by_outstanding(people)

    people_out = {
        name: person_money(person)
        for name, person in people.items()
    }

    return jsonify({
        "people": people_out,
        "totals": {
            "total_given": money(totals["given"]),
            "total_returned": money(totals["returned"]),
            "current_given": money(totals["current_given"]),
        },
    })


@people_bp.route("/<path:name>", methods=["GET"])
@login_required
def person_detail(name):
    data = load_data()
    transactions = current_transactions(data)

    ledger, _totals, _people = compute_ledger(transactions)

    person_rows = [
        row for row in ledger
        if row["type"] in ("given", "return") and row["name"] == name
    ]

    if not person_rows:
        return jsonify({"error": "Person not found."}), 404

    total_given = 0.0
    total_returned = 0.0
    history = []

    for row in person_rows:
        given = row["amount"] if row["type"] == "given" else 0.0
        returned = row["amount"] if row["type"] == "return" else 0.0

        total_given += given
        total_returned += returned

        running_outstanding = max(total_given - total_returned, 0)

        history.append({
            "id": row["id"],
            "date": row["date"],
            "reason": row["reason"],
            "given": given,
            "returned": returned,
            "given_fmt": money(given)["formatted"],
            "returned_fmt": money(returned)["formatted"],
            "given_words": money(given)["words"],
            "returned_words": money(returned)["words"],
            "outstanding": running_outstanding,
            "outstanding_fmt": money(running_outstanding)["formatted"],
            "outstanding_words": money(running_outstanding)["words"],
        })

    current_given = max(total_given - total_returned, 0)

    return jsonify({
        "name": name,
        "transactions": history,
        "total_given": money(total_given),
        "total_returned": money(total_returned),
        "current_given": money(current_given),
    })
