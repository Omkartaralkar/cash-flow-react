import os

from flask import Flask, send_from_directory, jsonify

from config import SECRET_KEY, CORS_ORIGINS, FRONTEND_DIST
from backup import backup_now

from routes_auth import auth_bp
from routes_dashboard import dashboard_bp
from routes_transactions import transactions_bp
from routes_people import people_bp
from routes_reports import reports_bp
from routes_import import import_bp


def create_app():
    app = Flask(__name__)

    app.secret_key = os.environ.get("SECRET_KEY", SECRET_KEY)

    # Sessions need to survive the browser tab closing so the React
    # app's "session" check on load keeps working like the old
    # server-rendered app did.
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
    )

    # ------------------------------------------------------------
    # Data safety: back up data.json / users.json on every start,
    # before anything can be written to them.
    # ------------------------------------------------------------
    try:
        backup_now()
    except Exception as exc:  # never block startup on a backup failure
        app.logger.warning(f"Startup backup failed: {exc}")

    # ------------------------------------------------------------
    # CORS - only needed for local development, where Vite's dev
    # server (localhost:5173) and Flask (localhost:5000) run on
    # different ports. In production the built frontend is served
    # by this same Flask app, same-origin, so CORS doesn't apply.
    # ------------------------------------------------------------
    try:
        from flask_cors import CORS
        CORS(app, supports_credentials=True, origins=CORS_ORIGINS)
    except ImportError:
        pass

    # ------------------------------------------------------------
    # API routes
    # ------------------------------------------------------------
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(people_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(import_bp)

    @app.errorhandler(404)
    def not_found(_error):
        # Let unmatched /api/* calls 404 as JSON...
        return jsonify({"error": "Not found"}), 404

    # ------------------------------------------------------------
    # Serve the built React app (production / `npm run build`)
    # ------------------------------------------------------------
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"error": "Not found"}), 404

        full_path = os.path.join(FRONTEND_DIST, path)

        if path and os.path.exists(full_path):
            return send_from_directory(FRONTEND_DIST, path)

        index_path = os.path.join(FRONTEND_DIST, "index.html")

        if os.path.exists(index_path):
            return send_from_directory(FRONTEND_DIST, "index.html")

        return (
            "Frontend build not found. Run `npm run build` inside "
            "the frontend/ folder, or use `npm run dev` for local "
            "development instead.",
            200,
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=os.environ.get("FLASK_DEBUG", "0") == "1",
    )
