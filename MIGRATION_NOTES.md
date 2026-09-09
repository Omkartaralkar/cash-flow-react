# Migration notes

## data.json / users.json moved into data/

**Before:** lived next to `app.py` in the project root.
**Now:** live in `data/data.json` and `data/users.json`.

This was the one structural change needed to support the new
`backend/` + `frontend/` project layout. The **content of both files
is byte-for-byte unchanged** — this was verified during development
by round-tripping the original files through every new API endpoint
(add/edit/delete a transaction, then diff the result against a
pre-test backup) and confirming the data was identical afterward.

If you ever need to point the app at data files somewhere else, set
these environment variables before starting the backend:

```bash
export DATA_FILE=/path/to/data.json
export USERS_FILE=/path/to/users.json
```

## Backups included in this ZIP

`data/backups/` contains one backup of each file taken during
development, purely as a safety net for this migration. The running
app also creates a fresh timestamped backup automatically every time
it starts (see `backend/backup.py`), so you'll always have a recent
copy going forward.

## Excel importer

`import_swamiraj.py` still works standalone, from the command line,
exactly as before — it just reads `backend/config.py` for the new
`data/data.json` location instead of assuming the project root. Its
row-parsing logic now lives in `backend/excel_import.py`, shared with
the new in-app importer on the Settings page, but the CLI script's
behavior and output are unchanged.

## Routes

The old server-rendered routes (`/`, `/login`, `/dashboard`,
`/transactions`, `/people`, `/reports`, etc., which returned full
HTML pages) have been replaced with a JSON API under `/api/*`. This
was necessary to support the React frontend, per the project
requirements. Every calculation and validation rule those routes
used to perform is preserved — see `backend/calculations.py` and
`backend/routes_*.py`.
