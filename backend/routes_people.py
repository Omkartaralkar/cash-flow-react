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

people_bp = Blueprint("people", __name__)


@people_bp.route("/people", methods=["GET"])
@people_bp.route("/api/people", methods=["GET"])
@login_required
def list_people():
    try:
        data = load_data()
        transactions = current_transactions(data) or []

        _ledger, totals, people = compute_ledger(transactions)
        people = sorted_people_by_outstanding(people) if people else {}

        people_out = {
            name: person_money(person)
            for name, person in (people or {}).items()
        }

        return jsonify({
            "totals": {
                "total_given": money(totals.get("given", 0)),
                "total_returned": money(totals.get("returned", 0)),
                "current_given": money(totals.get("current_given", 0)),
            },
            "people": people_out,
            "count": len(people_out),
        })
    except Exception as exc:
        return jsonify({
            "error": f"People calculation error: {str(exc)}",
            "traceback": traceback.format_exc(),
            "totals": {
                "total_given": money(0),
                "total_returned": money(0),
                "current_given": money(0),
            },
            "people": {},
            "count": 0,
        }), 500