"""
Core financial calculations, shared by every API route.

This mirrors, transaction-for-transaction, the logic that used to be
duplicated across routes_home.py, routes_people.py and
routes_reports.py in the original Flask-template app:

    income   -> credit,  balance += amount
    expense  -> debit,   balance -= amount
    given    -> debit,   balance -= amount, per-person total_given
    return   -> credit,  balance += amount, per-person total_returned

    current_given (per person, and overall) = max(given - returned, 0)

Nothing about these rules has changed - they're just defined once here
instead of being re-implemented in every route file.
"""

from helpers import (
    normalize_transaction,
    get_name,
    get_reason,
    display_text,
    format_inr,
    to_words,
)


def compute_ledger(transactions):
    """
    Walk transactions in stored (chronological-entry) order and return:

      ledger  - one row per transaction, in the same order as stored,
                each carrying its running balance ("id" == its index
                in the stored list, used for edit/delete)
      totals  - dict of raw numeric totals
      people  - dict of {name: {total_given, total_returned,
                current_given}} raw numbers
    """

    balance = 0.0
    total_income = 0.0
    total_expense = 0.0
    total_given = 0.0
    total_returned = 0.0

    people = {}
    ledger = []

    for idx, raw_transaction in enumerate(transactions):
        t = normalize_transaction(raw_transaction)

        amount = float(t.get("amount", 0) or 0)
        ttype = t.get("type")
        name = get_name(t)

        credit = 0.0
        debit = 0.0

        if ttype == "income":
            credit = amount
            balance += amount
            total_income += amount

        elif ttype == "expense":
            debit = amount
            balance -= amount
            total_expense += amount

        elif ttype == "given":
            debit = amount
            balance -= amount
            total_given += amount

            if name:
                person = people.setdefault(
                    name,
                    {"total_given": 0.0, "total_returned": 0.0}
                )
                person["total_given"] += amount

        elif ttype == "return":
            credit = amount
            balance += amount
            total_returned += amount

            if name:
                person = people.setdefault(
                    name,
                    {"total_given": 0.0, "total_returned": 0.0}
                )
                person["total_returned"] += amount

        ledger.append({
            "id": idx,
            "date": t.get("date", ""),
            "type": ttype,
            "name": name,
            "reason": get_reason(t),
            "description": display_text(t),
            "amount": amount,
            "credit": credit,
            "debit": debit,
            "balance": balance,
        })

    for person in people.values():
        person["current_given"] = max(
            person["total_given"] - person["total_returned"],
            0
        )

    current_given_total = max(total_given - total_returned, 0)

    totals = {
        "balance": balance,
        "income": total_income,
        "expense": total_expense,
        "given": total_given,
        "returned": total_returned,
        "current_given": current_given_total,
    }

    return ledger, totals, people


def money(value):
    """Raw + Indian-formatted + amount-in-words, for one number."""
    return {
        "raw": value,
        "formatted": format_inr(value),
        "words": to_words(value),
    }


def person_money(person):
    return {
        "total_given": money(person["total_given"]),
        "total_returned": money(person["total_returned"]),
        "current_given": money(person["current_given"]),
    }


def sorted_people_by_outstanding(people):
    return dict(
        sorted(
            people.items(),
            key=lambda item: item[1]["current_given"],
            reverse=True
        )
    )


def monthly_breakdown(ledger):
    """
    Group the ledger by YYYY-MM (same date field already used by the
    original /monthly route) and sum income/expense/given/returned
    per month, for chart data. Purely a presentational grouping of
    the existing per-transaction numbers - no new business rule.
    """
    months = {}

    for row in ledger:
        key = (row["date"] or "")[:7]  # "YYYY-MM"

        if not key:
            continue

        bucket = months.setdefault(key, {
            "month": key,
            "income": 0.0,
            "expense": 0.0,
            "given": 0.0,
            "returned": 0.0,
        })

        ttype = row["type"]
        amount = row["amount"]

        if ttype == "income":
            bucket["income"] += amount
        elif ttype == "expense":
            bucket["expense"] += amount
        elif ttype == "given":
            bucket["given"] += amount
        elif ttype == "return":
            bucket["returned"] += amount

    return [months[key] for key in sorted(months.keys())]
