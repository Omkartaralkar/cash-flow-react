from flask import Blueprint, request, session, jsonify

from storage import load_users, save_users

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    payload = request.get_json(silent=True) or {}

    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if not username or not password:
        return jsonify(
            {"error": "Username and password are required."}
        ), 400

    data = load_users()
    users = data.setdefault("users", [])

    # Check username case-insensitively, same as the original app.
    for user in users:
        if user.get("username", "").lower() == username.lower():
            return jsonify({"error": "User already exists."}), 409

    users.append({
        "username": username,
        "password": password,
    })

    save_users(data)

    return jsonify({"ok": True, "username": username}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}

    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    data = load_users()
    users = data.get("users", [])

    for user in users:
        if (
            user.get("username", "").lower() == username.lower()
            and user.get("password") == password
        ):
            session["user"] = user.get("username")
            session.permanent = True

            return jsonify({"ok": True, "username": session["user"]})

    return jsonify({"error": "Invalid username or password"}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"ok": True})


@auth_bp.route("/session", methods=["GET"])
def get_session():
    user = session.get("user")
    return jsonify({
        "authenticated": bool(user),
        "username": user,
    })
