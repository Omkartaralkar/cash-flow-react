@echo off
setlocal

echo ============================================
echo  Swamiraj Cash Flow - setup and start
echo ============================================

echo.
echo [1/4] Installing backend dependencies...
cd backend
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo Backend dependency install failed. Is Python installed and on PATH?
    pause
    exit /b 1
)
cd ..

echo.
echo [2/4] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo Frontend dependency install failed. Is Node.js installed and on PATH?
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Starting Flask backend on http://localhost:5000 ...
start "Cash Flow Backend" cmd /k "cd backend && python app.py"

echo.
echo [4/4] Starting React dev server on http://localhost:5173 ...
start "Cash Flow Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Open http://localhost:5173 in your browser.
echo.
pause
