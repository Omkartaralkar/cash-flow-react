from functools import wraps

from flask import session, jsonify

from helpers import check_login


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not check_login(session):
            return jsonify({"error": "Not authenticated"}), 401
        return view(*args, **kwargs)

    return wrapped
