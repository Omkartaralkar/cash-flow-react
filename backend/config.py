import os

# backend/config.py
#
# BASE_DIR      -> Cash_Flow_Manager/
# DATA_DIR      -> Cash_Flow_Manager/data/
#
# The original project kept data.json / users.json next to app.py.
# They now live in a dedicated data/ folder (see MIGRATION_NOTES.md),
# but every value here can still be overridden with environment
# variables, exactly like before.

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.environ.get(
    "DATA_DIR",
    os.path.join(BASE_DIR, "data")
)

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "cash-flow-manager-secret-key"
)

DATA_FILE = os.environ.get(
    "DATA_FILE",
    os.path.join(DATA_DIR, "data.json")
)

USERS_FILE = os.environ.get(
    "USERS_FILE",
    os.path.join(DATA_DIR, "users.json")
)

BACKUP_DIR = os.environ.get(
    "BACKUP_DIR",
    os.path.join(DATA_DIR, "backups")
)

# Frontend build output, served by Flask in production.
FRONTEND_DIST = os.environ.get(
    "FRONTEND_DIST",
    os.path.join(BASE_DIR, "frontend", "dist")
)

# Comma separated list of origins allowed to call the API with
# credentials during local development (Vite's default dev server).
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
