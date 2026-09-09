# Swamiraj Cash Flow — React + Flask

A modern, banking-style redesign of the original Cash Flow Manager.
Same Flask backend, same JSON data, same calculations — new React
frontend and clean JSON API.

## What changed, and what didn't

**Didn't change:**

- Python 3.15, Flask, openpyxl (no pandas)
- `data.json` / `users.json` structure and all existing data
- Login / signup rules, transaction validation rules
  ("Name or Reason / Source is required", "Amount must be > 0")
- All balance / income / expense / given / returned / outstanding
  calculations — verified against the original templates
  transaction-for-transaction
- The `import_swamiraj.py` Excel importer — still works standalone

**Changed:**

- The frontend is now a real React app (Vite) instead of Jinja
  templates, with a redesigned banking-style UI, dark mode, and
  charts
- Flask now exposes a JSON API under `/api/*` instead of rendering
  HTML pages
- `data.json` / `users.json` moved from the project root into
  `data/` (see `MIGRATION_NOTES.md`) — content is unchanged
- The Excel importer's row-parsing logic was extracted into
  `backend/excel_import.py` so it can also power a new
  in-app import button on the Settings page (the original CLI
  script still works exactly as before, and uses the same code)

## Project structure

```
Cash_Flow_Manager/
├── backend/            Flask app + JSON API
├── frontend/            React app (Vite)
├── data/
│   ├── data.json        Your transactions (unchanged from before)
│   ├── users.json        Your accounts (unchanged from before)
│   └── backups/          Automatic timestamped backups
├── requirements.txt
├── start.bat             Windows: install + run everything
├── start_backend.bat
├── start_frontend.bat
└── README.md
```

## Requirements

- Python 3.15 (or any modern Python 3)
- Node.js 18+ and npm

## Quick start (Windows)

Double-click `start.bat`. It installs both sets of dependencies and
starts the Flask API (port 5000) and the React dev server (port
5173). Open **http://localhost:5173**.

## Quick start (manual / any OS)

### 1. Backend

```bash
cd backend
python -m pip install -r requirements.txt
python app.py
```

The API runs on `http://localhost:5000`.

### 2. Frontend (development)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` calls to Flask
(see `frontend/vite.config.js`), so cookies/sessions work exactly as
if everything were on one origin.

### 3. Frontend (production build)

```bash
cd frontend
npm install
npm run build
```

This creates `frontend/dist/`. Flask automatically serves it — just
run the backend and open `http://localhost:5000` directly; you don't
need the Vite dev server for production use.

## Logging in

Your existing accounts still work:

- `Omkar` / `Omkar@5657`
- `Swamiraj` / `Swamiraj@5657`

(Same as before — passwords are unchanged.)

## Excel import

Two ways, same underlying logic:

1. **In-app:** Settings → Excel import → choose your `.xlsx` file.
   Imports into whichever account you're logged in as.
2. **Command line (original behavior, imports into "Swamiraj"):**

   ```bash
   cd backend
   python import_swamiraj.py "../Swamiraj.xlsx"
   ```

Both only ever *append* transactions — nothing existing is ever
removed or overwritten.

## Data safety

- A timestamped backup of `data.json` and `users.json` is created in
  `data/backups/` automatically every time the Flask app starts.
- The Excel importer creates its own backup before writing.
- You can also run `python backend/backup.py` manually at any time.

## API overview

All endpoints are under `/api` and use session-cookie auth.

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/auth/signup` | POST | Create an account |
| `/api/auth/login` | POST | Sign in |
| `/api/auth/logout` | POST | Sign out |
| `/api/auth/session` | GET | Current session |
| `/api/dashboard` | GET | Balance, totals, ledger, people |
| `/api/transactions` | GET, POST | List (with filters) / add |
| `/api/transactions/<id>` | GET, PUT, DELETE | Single transaction |
| `/api/people` | GET | Everyone with a given/returned history |
| `/api/people/<name>` | GET | One person's full statement |
| `/api/reports` | GET | Totals, monthly breakdown, outstanding |
| `/api/import/excel` | POST | Import an `.xlsx` for the current user |

## Notes

- Sessions use Flask's signed cookies (`SECRET_KEY` in
  `backend/config.py` — override with the `SECRET_KEY` environment
  variable in production, same as before).
- CORS is only enabled for `localhost:5173` (Vite dev server); the
  production build is served same-origin by Flask, so CORS doesn't
  apply there.
