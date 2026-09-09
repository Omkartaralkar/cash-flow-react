from flask import Blueprint, request, jsonify

from storage import load_data, save_data, current_transactions
from api_utils import login_required
from excel_import import parse_workbook

import_bp = Blueprint("import", __name__, url_prefix="/api/import")


@import_bp.route("/excel", methods=["POST"])
@login_required
def import_excel():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    upload = request.files["file"]

    if not upload.filename:
        return jsonify({"error": "No file selected."}), 400

    if not upload.filename.lower().endswith((".xlsx", ".xlsm")):
        return jsonify({"error": "Please upload an .xlsx file."}), 400

    try:
        new_transactions, skipped = parse_workbook(upload.stream)
    except Exception as exc:
        return jsonify({"error": f"Could not read workbook: {exc}"}), 400

    data = load_data()
    transactions = current_transactions(data)

    before_count = len(transactions)

    # Same rule as the original importer: append everything,
    # never remove or de-duplicate existing transactions.
    transactions.extend(new_transactions)
    save_data(data)

    return jsonify({
        "ok": True,
        "imported": len(new_transactions),
        "skipped": skipped,
        "before_count": before_count,
        "after_count": len(transactions),
    })
