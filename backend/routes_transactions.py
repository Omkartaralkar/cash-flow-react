from datetime import datetime

from flask import Blueprint, request, jsonify

from storage import load_data, save_data, current_transactions
from api_utils import login_required
from calculations import compute_ledger, money
from helpers import (
    validate_name_reason,
    normalize_type,
    normalize_transaction,
)

transactions_bp = Blueprint("transactions", __name__)

VALID_TYPES = ("income", "expense", "given", "return")


def _serialize_row(row):
    return {
        **row,
        "amount_fmt": money(row["amount"])["formatted"],
        "amount_words": money(row["amount"])["words"],
        "balance_fmt": money(row["balance"])["formatted"],
        "balance_words": money(row["balance"])["words"],
    }


def _parse_amount(raw_value):
    amount = int(float(raw_value))
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    return amount


@transactions_bp.route("/transactions", methods=["GET"])
@transactions_bp.route("/api/transactions", methods=["GET"])
@login_required
def list_transactions():
    data = load_data()
    transactions = current_transactions(data)

    ledger, totals, _people = compute_ledger(transactions)
    rows = [_serialize_row(row) for row in ledger]

    type_filter = request.args.get("type")
    if type_filter and type_filter in VALID_TYPES:
        rows = [r for r in rows if r["type"] == type_filter]

    date_from = request.args.get("from")
    if date_from:
        rows = [r for r in rows if r["date"] and r["date"] >= date_from]

    date_to = request.args.get("to")
    if date_to:
        rows = [r for r in rows if r["date"] and r["date"] <= date_to]

    query = (request.args.get("q") or "").strip().lower()
    if query:
        rows = [
            r for r in rows
            if query in (r["name"] or "").lower()
            or query in (r["reason"] or "").lower()
            or query in (r["description"] or "").lower()
        ]

    return jsonify({
        "transactions": rows,
        "count": len(rows),
        "balance": money(totals["balance"]),
    })


@transactions_bp.route("/transactions", methods=["POST"])
@transactions_bp.route("/api/transactions", methods=["POST"])
@login_required
def add_transaction():
    payload = request.get_json(silent=True) or {}

    name = str(payload.get("name", "")).strip()
    reason = str(payload.get("reason", "")).strip()

    if not validate_name_reason(name, reason):
        return jsonify(
            {"error": "Please enter Name or Reason / Source."}
        ), 400

    try:
        amount = _parse_amount(payload.get("amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Please enter a valid amount."}), 400

    transaction_type = normalize_type(payload.get("type", ""))
    if transaction_type not in VALID_TYPES:
        return jsonify({"error": "Please choose a transaction type."}), 400

    data = load_data()
    transactions = current_transactions(data)

    transaction = {
        "type": transaction_type,
        "amount": amount,
        "name": name,
        "reason": reason,
        "person": name,
        "category": reason,
        "date": payload.get("date") or datetime.now().strftime("%Y-%m-%d"),
    }

    transactions.append(transaction)
    save_data(data)

    new_id = len(transactions) - 1

    return jsonify({"ok": True, "id": new_id}), 201


@transactions_bp.route("/transactions/<int:transaction_id>", methods=["GET"])
@transactions_bp.route("/api/transactions/<int:transaction_id>", methods=["GET"])
@login_required
def get_transaction(transaction_id):
    data = load_data()
    transactions = current_transactions(data)

    if transaction_id < 0 or transaction_id >= len(transactions):
        return jsonify({"error": "Transaction not found."}), 404

    transaction = normalize_transaction(transactions[transaction_id])
    transaction["id"] = transaction_id

    return jsonify(transaction)


@transactions_bp.route("/transactions/<int:transaction_id>", methods=["PUT"])
@transactions_bp.route("/api/transactions/<int:transaction_id>", methods=["PUT"])
@login_required
def update_transaction(transaction_id):
    data = load_data()
    transactions = current_transactions(data)

    if transaction_id < 0 or transaction_id >= len(transactions):
        return jsonify({"error": "Transaction not found."}), 404

    transaction = normalize_transaction(transactions[transaction_id])
    payload = request.get_json(silent=True) or {}

    name = str(payload.get("name", "")).strip()
    reason = str(payload.get("reason", "")).strip()

    if not validate_name_reason(name, reason):
        return jsonify(
            {"error": "Please enter Name or Reason / Source."}
        ), 400

    try:
        amount = _parse_amount(payload.get("amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Please enter a valid amount."}), 400

    transaction_type = normalize_type(
        payload.get("type", transaction.get("type", ""))
    )
    if transaction_type not in VALID_TYPES:
        return jsonify({"error": "Please choose a transaction type."}), 400

    transaction["type"] = transaction_type
    transaction["amount"] = amount
    transaction["name"] = name
    transaction["reason"] = reason
    transaction["person"] = name
    transaction["category"] = reason
    transaction["date"] = payload.get("date") or transaction.get("date", "")

    transactions[transaction_id] = transaction
    save_data(data)

    return jsonify({"ok": True, "id": transaction_id})


@transactions_bp.route("/transactions/<int:transaction_id>", methods=["DELETE"])
@transactions_bp.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
@login_required
def delete_transaction(transaction_id):
    data = load_data()
    transactions = current_transactions(data)

    if transaction_id < 0 or transaction_id >= len(transactions):
        return jsonify({"error": "Transaction not found."}), 404

    transactions.pop(transaction_id)
    save_data(data)

    return jsonify({"ok": True})