#!/usr/bin/env bash
set -e

echo "[1/4] Installing backend dependencies..."
(cd backend && python3 -m pip install -r requirements.txt)

echo "[2/4] Installing frontend dependencies..."
(cd frontend && npm install)

echo "[3/4] Starting Flask backend on http://localhost:5000 ..."
(cd backend && python3 app.py) &

echo "[4/4] Starting React dev server on http://localhost:5173 ..."
(cd frontend && npm run dev) &

echo
echo "Open http://localhost:5173 in your browser."
echo "Press Ctrl+C to stop both servers."
wait
