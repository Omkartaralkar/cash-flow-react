import os
import json
import shutil
import logging
import ssl
from flask import session
import pymysql
import pymysql.cursors

from config import DATA_FILE, USERS_FILE, DATA_DIR, BASE_DIR

logger = logging.getLogger(__name__)

DB_HOST = os.environ.get("DB_HOST")
DB_PORT = int(os.environ.get("DB_PORT", 4000))
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME", "cash_flow")


def get_db_connection():
    """Returns a connection to TiDB Cloud if configured, else None."""
    if not DB_HOST or not DB_USER:
        return None
    try:
        # Create standard SSL context for TiDB Cloud
        ssl_ctx = ssl.create_default_context()

        return pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            ssl=ssl_ctx,
            connect_timeout=10,
            autocommit=True,
        )
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None


# -------------------------------------------------------------
# File Fallback Helpers (Preserved for offline/local dev)
# -------------------------------------------------------------
def _find_seed_file(filename):
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
        if not os.path.exists(target_path) or os.path.getsize(target_path) == 0:
            seed_path = _find_seed_file(fname)
            if seed_path:
                try:
                    shutil.copy2(seed_path, target_path)
                except Exception as e:
                    logger.error(f"Failed to copy seed file {fname}: {e}")


# -------------------------------------------------------------
# User Storage Functions
# -------------------------------------------------------------
def load_users():
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT username, password FROM users")
                rows = cursor.fetchall()
                return {"users": rows or []}
        except Exception as e:
            logger.error(f"Error loading users from TiDB: {e}")
        finally:
            conn.close()

    # Fallback to JSON file
    _ensure_data_dir()
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"users": []}


def save_users(data):
    conn = get_db_connection()
    if conn:
        try:
            users_list = data.get("users", [])
            with conn.cursor() as cursor:
                for u in users_list:
                    cursor.execute(
                        """
                        INSERT INTO users (username, password)
                        VALUES (%s, %s)
                        ON DUPLICATE KEY UPDATE password = VALUES(password)
                        """,
                        (u.get("username"), u.get("password")),
                    )
            return
        except Exception as e:
            logger.error(f"Error saving users to TiDB: {e}")
        finally:
            conn.close()

    # Fallback to JSON file
    _ensure_data_dir()
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


# -------------------------------------------------------------
# Transaction & Data Storage Functions
# -------------------------------------------------------------
def load_data():
    conn = get_db_connection()
    user = session.get("user")

    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, username, date, type, amount, person, reason
                    FROM transactions
                    ORDER BY date ASC, id ASC
                    """
                )
                rows = cursor.fetchall()

            # Reshape into { username: { "transactions": [...] } } structure
            data = {}
            for r in rows:
                u = r.get("username")
                if u not in data:
                    data[u] = {"transactions": []}

                data[u]["transactions"].append({
                    "id": str(r.get("id")),
                    "date": str(r.get("date")),
                    "type": str(r.get("type")),
                    "amount": float(r.get("amount") or 0),
                    "person": r.get("person") or "",
                    "reason": r.get("reason") or "",
                })

            if user:
                data.setdefault(user, {"transactions": []})

            return data
        except Exception as e:
            logger.error(f"Error loading transactions from TiDB: {e}")
        finally:
            conn.close()

    # Fallback to JSON file
    _ensure_data_dir()
    data = {}
    if os.path.exists(DATA_FILE) and os.path.getsize(DATA_FILE) > 0:
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            logger.error(f"Error parsing {DATA_FILE}: {e}")
            data = {}

    if user:
        data.setdefault(user, {"transactions": []})
        data[user].setdefault("transactions", [])

    return data


def save_data(data):
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                # Sync every user's transaction array to the MySQL table
                for username, user_obj in data.items():
                    txns = user_obj.get("transactions", [])
                    seen_ids = []

                    for t in txns:
                        tid = str(t.get("id"))
                        seen_ids.append(tid)
                        cursor.execute(
                            """
                            INSERT INTO transactions (id, username, date, type, amount, person, reason)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE
                                date = VALUES(date),
                                type = VALUES(type),
                                amount = VALUES(amount),
                                person = VALUES(person),
                                reason = VALUES(reason)
                            """,
                            (
                                tid,
                                username,
                                t.get("date"),
                                t.get("type"),
                                float(t.get("amount") or 0),
                                t.get("person") or t.get("name"),
                                t.get("reason") or t.get("source") or t.get("description"),
                            ),
                        )

                    # Remove any transaction that was deleted in the UI
                    if seen_ids:
                        format_strings = ",".join(["%s"] * len(seen_ids))
                        cursor.execute(
                            f"DELETE FROM transactions WHERE username = %s AND id NOT IN ({format_strings})",
                            [username] + seen_ids,
                        )
                    else:
                        cursor.execute("DELETE FROM transactions WHERE username = %s", (username,))
            return
        except Exception as e:
            logger.error(f"Error saving data to TiDB: {e}")
        finally:
            conn.close()

    # Fallback to JSON file
    _ensure_data_dir()
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def current_transactions(data):
    user = session.get("user")
    if not user:
        return []

    if user not in data:
        for stored_user in data.keys():
            if stored_user.lower() == user.lower():
                return data[stored_user].get("transactions", [])

    return data.get(user, {}).get("transactions", [])