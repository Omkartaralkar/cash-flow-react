from num2words import num2words


def check_login(session):
    return "user" in session


def format_inr(amount):
    """
    Indian grouping:

    1686000 -> 16,86,000
    """
    try:
        amount = float(amount)

        sign = "-" if amount < 0 else ""
        amount = abs(amount)

        if amount.is_integer():
            number = str(int(amount))
            decimal = ""
        else:
            formatted = (
                f"{amount:.2f}"
                .rstrip("0")
                .rstrip(".")
            )
            number, decimal_part = formatted.split(".")
            decimal = "." + decimal_part

        if len(number) <= 3:
            return sign + number + decimal

        last3 = number[-3:]
        rest = number[:-3]
        groups = []

        while len(rest) > 2:
            groups.insert(
                0,
                rest[-2:]
            )
            rest = rest[:-2]

        if rest:
            groups.insert(
                0,
                rest
            )

        return (
            sign
            + ",".join(groups + [last3])
            + decimal
        )

    except Exception:
        return str(amount)


def to_words(amount):
    try:
        amount = float(amount)

        if amount.is_integer():
            return num2words(
                int(amount),
                lang="en_IN"
            ).replace("-", " ")

        return num2words(
            amount,
            lang="en_IN"
        ).replace("-", " ")

    except Exception:
        return ""


def get_name(transaction):
    return (
        transaction.get("name")
        or transaction.get("person")
        or ""
    ).strip()


def get_reason(transaction):
    return (
        transaction.get("reason")
        or transaction.get("source")
        or transaction.get("category")
        or ""
    ).strip()


def get_display_name(transaction):
    name = get_name(transaction)
    reason = get_reason(transaction)

    if name and reason:
        return f"{name} - {reason}"

    return name or reason


def display_text(transaction):
    name = get_name(transaction)
    reason = get_reason(transaction)

    if name and reason:
        return f"{name} - {reason}"

    return name or reason or "—"


def validate_name_reason(name, reason):
    return bool(
        str(name or "").strip()
        or str(reason or "").strip()
    )


def normalize_type(value):
    value = str(value or "").strip().lower()

    mapping = {
        "income": "income",
        "jamaa": "income",
        "जमा": "income",

        "expense": "expense",
        "kharch": "expense",
        "खर्च": "expense",

        "given": "given",
        "give": "given",

        "return": "return",
        "returned": "return",
    }

    return mapping.get(value, value)


def normalize_transaction(transaction):
    transaction = dict(transaction)

    transaction["type"] = normalize_type(
        transaction.get("type")
    )

    if "name" not in transaction:
        transaction["name"] = transaction.get(
            "person",
            ""
        )

    if "reason" not in transaction:
        transaction["reason"] = transaction.get(
            "source",
            transaction.get("category", "")
        )

    return transaction