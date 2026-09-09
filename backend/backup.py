import os
import shutil
from datetime import datetime

from config import DATA_FILE, USERS_FILE, DATA_DIR


def backup_now():
    # Never write to read-only disk on Vercel
    if os.environ.get("VERCEL"):
        return

    backup_dir = os.path.join(DATA_DIR, "backups")
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    for file_path, name in ((DATA_FILE, "data.json"), (USERS_FILE, "users.json")):
        if os.path.exists(file_path):
            backup_target = os.path.join(backup_dir, f"{name}.backup_{timestamp}")
            try:
                shutil.copy2(file_path, backup_target)
            except Exception:
                pass