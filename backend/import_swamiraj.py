#!/usr/bin/env python
"""
Swamiraj Excel importer for Cash_Flow_Manager.

Uses openpyxl only.
Compatible with Python 3.15.

Usage:
    python import_swamiraj.py "Swamiraj.xlsx"

This is the same standalone script as before, just pointed at the
data/ folder and sharing its row-parsing logic with excel_import.py
(used by the new /api/import/excel endpoint). Behavior and output are
unchanged.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

try:
    from openpyxl import load_workbook  # noqa: F401  (import check)
except ImportError:
    print("ERROR: openpyxl is not installed.")
    print("Run: python -m pip install openpyxl")
    sys.exit(1)

from config import DATA_FILE
from excel_import import parse_workbook

DATA_FILE = Path(DATA_FILE)
ACCOUNT_NAME = "Swamiraj"


def format_inr(amount: float) -> str:
    negative = amount < 0
    amount = abs(amount)

    if amount == int(amount):
        text = str(int(amount))
    else:
        text = f"{amount:.2f}".rstrip("0").rstrip(".")

    if len(text) <= 3:
        formatted = text
    else:
        last_three = text[-3:]
        remaining = text[:-3]
        groups = []

        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]

        if remaining:
            groups.insert(0, remaining)

        formatted = ",".join(groups + [last_three])

    return ("-" if negative else "") + "₹" + formatted


def get_account_container(data):
    """
    Find or create the Swamiraj transaction container.

    Supports the existing Cash_Flow_Manager structure:

        {
            "balance": 0.0,
            "transactions": [...],
            "Omkar": {
                "transactions": [...]
            }
        }

    In this structure, Swamiraj is created as:

        "Swamiraj": {
            "transactions": [...]
        }

    Existing data is preserved.
    """

    if not isinstance(data, dict):
        raise ValueError("data.json must contain a JSON object.")

    if ACCOUNT_NAME in data:
        if not isinstance(data[ACCOUNT_NAME], dict):
            raise ValueError(f'"{ACCOUNT_NAME}" exists but is not an object.')

        data[ACCOUNT_NAME].setdefault("transactions", [])

        if not isinstance(data[ACCOUNT_NAME]["transactions"], list):
            raise ValueError(f'"{ACCOUNT_NAME}.transactions" must be a list.')

        return data[ACCOUNT_NAME]

    for collection_key in ("users", "accounts"):
        collection = data.get(collection_key)

        if isinstance(collection, list):
            for item in collection:
                if not isinstance(item, dict):
                    continue

                if (
                    item.get("name") == ACCOUNT_NAME
                    or item.get("username") == ACCOUNT_NAME
                ):
                    item.setdefault("transactions", [])

                    if not isinstance(item["transactions"], list):
                        raise ValueError(
                            f'"{ACCOUNT_NAME}.transactions" must be a list.'
                        )

                    return item

            new_account = {"name": ACCOUNT_NAME, "transactions": []}
            collection.append(new_account)
            return new_account

    data[ACCOUNT_NAME] = {"transactions": []}
    return data[ACCOUNT_NAME]


def main():
    if len(sys.argv) != 2:
        print('Usage: python import_swamiraj.py "Swamiraj.xlsx"')
        sys.exit(1)

    excel_file = Path(sys.argv[1])

    if not excel_file.is_absolute():
        excel_file = Path(__file__).resolve().parent / excel_file

    if not excel_file.exists():
        print(f"ERROR: Excel file not found: {excel_file}")
        sys.exit(1)

    if not DATA_FILE.exists():
        print(f"ERROR: data.json not found: {DATA_FILE}")
        sys.exit(1)

    print(f"Reading Excel: {excel_file}")

    try:
        new_transactions, skipped = parse_workbook(str(excel_file))
    except Exception as exc:
        print(f"ERROR while reading Excel: {exc}")
        sys.exit(1)

    print(f"Transactions ready to import: {len(new_transactions)}")

    try:
        with DATA_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        print(f"ERROR while reading data.json: {exc}")
        sys.exit(1)

    backup_file = DATA_FILE.with_name(
        "data.json.backup_before_swamiraj_import"
    )

    try:
        shutil.copy2(DATA_FILE, backup_file)
    except Exception as exc:
        print(f"ERROR: Could not create backup: {exc}")
        sys.exit(1)

    try:
        account = get_account_container(data)
        account.setdefault("transactions", [])

        if not isinstance(account["transactions"], list):
            raise ValueError("Swamiraj transactions must be a list.")

        before_count = len(account["transactions"])

        # IMPORTANT: do not remove duplicates - import every row.
        account["transactions"].extend(new_transactions)

        with DATA_FILE.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    except Exception as exc:
        try:
            shutil.copy2(backup_file, DATA_FILE)
        except Exception:
            pass

        print(f"ERROR: Import failed: {exc}")
        sys.exit(1)

    after_count = len(account["transactions"])

    print()
    print("IMPORT COMPLETE")
    print("----------------")
    print(f"Account:             {ACCOUNT_NAME}")
    print(f"Before transactions: {before_count}")
    print(f"Imported:            {len(new_transactions)}")
    print(f"Skipped blank rows:  {skipped}")
    print(f"After transactions:  {after_count}")
    print(f"Backup:              {backup_file}")

    if new_transactions:
        print()
        print("First 5 imported transactions:")

        for tx in new_transactions[:5]:
            print(
                f"  {tx['date']} | "
                f"{tx['type']:7} | "
                f"{format_inr(tx['amount'])} | "
                f"{tx['reason']}"
            )


if __name__ == "__main__":
    main()
