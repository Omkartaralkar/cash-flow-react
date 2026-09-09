import os
from flask import Flask, send_from_directory, jsonify, session

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

    # Essential: Flask sessions cannot persist without a valid secret key
    app.secret_key = os.environ.get("SECRET_KEY", SECRET_KEY)

    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=True,
    )

    # Startup backup (local development only)
    if not os.environ.get("VERCEL"):
        try:
            backup_now()
        except Exception as exc:
            app.logger.warning(f"Startup backup failed: {exc}")
    else:
        app.logger.info("Running on Vercel: skipping disk backup.")

    # CORS configuration
    try:
        from flask_cors import CORS
        CORS(app, supports_credentials=True, origins=CORS_ORIGINS)
    except ImportError:
        pass

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(people_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(import_bp)

    # Diagnostic endpoint to verify what seed data Flask loaded
    

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Not found"}), 404

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
            "Frontend build not found.",
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