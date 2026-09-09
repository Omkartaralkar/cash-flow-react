import json
import os
import shutil
import logging
from flask import session

from config import DATA_FILE, USERS_FILE, DATA_DIR, BASE_DIR

logger = logging.getLogger(__name__)


def _find_seed_file(filename):
    """
    Search known locations for bundled seed files in Vercel serverless containers.
    """
    candidates = [
        os.path.join(BASE_DIR, "data", filename),
        os.path.join(os.path.dirname(__file__), "..", "data", filename),
        os.path.join("/var/task", "data", filename),
        os.path.join(os.getcwd(), "data", filename),
    ]
    for path in candidates:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            return abs_path
    return None


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

    for target_path, fname in ((DATA_FILE, "data.json"), (USERS_FILE, "users.json")):
        # Only copy if destination does not exist OR is an empty 0-byte file
        if not os.path.exists(target_path) or os.path.getsize(target_path) == 0:
            seed_path = _find_seed_file(fname)
            if seed_path:
                try:
                    shutil.copy2(seed_path, target_path)
                    logger.info(f"Seeded {fname} from {seed_path} to {target_path}")
                except Exception as e:
                    logger.error(f"Failed to copy seed file {fname}: {e}")
            else:
                logger.warning(f"No seed source found for {fname}")


def load_users():
    _ensure_data_dir()

    if not os.path.exists(USERS_FILE):
        return {"users": []}

    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"users": []}


def save_users(data):
    _ensure_data_dir()

    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def load_data():
    _ensure_data_dir()

    data = {}
    if os.path.exists(DATA_FILE) and os.path.getsize(DATA_FILE) > 0:
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            logger.error(f"Error parsing {DATA_FILE}: {e}")
            data = {}

    user = session.get("user")
    if user:
        data.setdefault(user, {"transactions": []})
        data[user].setdefault("transactions", [])

    return data


def save_data(data):
    _ensure_data_dir()

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def current_transactions(data):
    user = session.get("user")
    if not user:
        return []

    # If the user isn't in data, check if there's a case-insensitive match
    if user not in data:
        for stored_user in data.keys():
            if stored_user.lower() == user.lower():
                return data[stored_user].get("transactions", [])

    return data.get(user, {}).get("transactions", [])