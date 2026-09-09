import traceback
from urllib.parse import unquote
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


@people_bp.route("/people/<path:name>", methods=["GET"])
@people_bp.route("/api/people/<path:name>", methods=["GET"])
@login_required
def get_person(name):
    try:
        decoded_name = unquote(name).strip()
        data = load_data()
        transactions = current_transactions(data) or []

        _ledger, _totals, people = compute_ledger(transactions)

        # Case-insensitive match on person's name
        matched_key = next((k for k in people.keys() if k.lower() == decoded_name.lower()), None)
        if not matched_key:
            return jsonify({"error": f"Person '{decoded_name}' not found."}), 404

        person_data = people[matched_key]
        entries = person_data.get("transactions", [])

        formatted_entries = []
        for row in entries:
            amt = float(row.get("amount", 0) or 0)
            is_given = row.get("type") == "given"
            is_ret = row.get("type") == "return"
            bal = float(row.get("balance", 0) or 0)

            formatted_entries.append({
                **row,
                "amount_fmt": format_inr(amt),
                "given_fmt": format_inr(amt) if is_given else "",
                "returned_fmt": format_inr(amt) if is_ret else "",
                "outstanding_fmt": format_inr(bal),
                "given": amt if is_given else 0,
                "returned": amt if is_ret else 0,
            })

        p_money = person_money(person_data)
        return jsonify({
            "name": matched_key,
            "total_given": p_money.get("total_given", money(0)),
            "total_returned": p_money.get("total_returned", money(0)),
            "current_given": p_money.get("current_given", money(0)),
            "transactions": formatted_entries,
        })
    except Exception as exc:
        return jsonify({
            "error": f"Error fetching person: {str(exc)}",
            "traceback": traceback.format_exc(),
        }), 500