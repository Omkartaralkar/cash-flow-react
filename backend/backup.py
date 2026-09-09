"""
Creates a timestamped backup of data.json and users.json.

Called once when the Flask app starts, so that the original data is
always recoverable even if something goes wrong later in the process.
Also usable on its own:

    python backup.py
"""

import os
import shutil
import logging
from datetime import datetime

from config import DATA_FILE, USERS_FILE, BACKUP_DIR


def backup_now():
    # Vercel serverless containers are read-only; skip backup if running on Vercel
    if os.environ.get("VERCEL"):
        logging.info("Vercel environment detected: skipping local file backup.")
        return []

    try:
        os.makedirs(BACKUP_DIR, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        created = []

        for source in (DATA_FILE, USERS_FILE):
            if not os.path.exists(source):
                continue

            filename = os.path.basename(source)
            destination = os.path.join(
                BACKUP_DIR,
                f"{filename}.backup_{timestamp}"
            )

            shutil.copy2(source, destination)
            created.append(destination)

        return created
    except OSError as e:
        if e.errno == 30:  # Read-only filesystem error
            logging.warning(f"Skipping backup due to read-only filesystem: {e}")
            return []
        raise e


if __name__ == "__main__":
    for path in backup_now():
        print(f"Backed up: {path}")