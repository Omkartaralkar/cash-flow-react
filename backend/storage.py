import json
import os
import shutil
from flask import session

from config import DATA_FILE, USERS_FILE, DATA_DIR, BASE_DIR


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    # Ensure seed JSON files are copied to /tmp/data if not yet present
    seed_dir = os.path.join(BASE_DIR, "data")
    for file_path, fname in ((DATA_FILE, "data.json"), (USERS_FILE, "users.json")):
        if not os.path.exists(file_path):
            src = os.path.join(seed_dir, fname)
            if os.path.exists(src):
                try:
                    shutil.copy2(src, file_path)
                except Exception:
                    pass


def load_users():
    _ensure_data_dir()

    if not os.path.exists(USERS_FILE):
        return {"users": []}

    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_users(data):
    _ensure_data_dir()

    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            indent=4,
            ensure_ascii=False
        )


def load_data():
    _ensure_data_dir()

    if not os.path.exists(DATA_FILE):
        data = {}

        user = session.get("user")

        if user:
            data[user] = {
                "transactions": []
            }

        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                indent=4,
                ensure_ascii=False
            )

        return data

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    user = session.get("user")

    if user:
        data.setdefault(
            user,
            {
                "transactions": []
            }
        )

        data[user].setdefault(
            "transactions",
            []
        )

    return data


def save_data(data):
    _ensure_data_dir()

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            indent=4,
            ensure_ascii=False
        )


def current_transactions(data):
    user = session.get("user")

    if not user:
        return []

    data.setdefault(
        user,
        {
            "transactions": []
        }
    )

    return data[user].setdefault(
        "transactions",
        []
    )