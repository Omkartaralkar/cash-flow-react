@echo off
echo Building frontend for production...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo Starting Flask (serving the built frontend) on http://localhost:5000 ...
cd backend
python -m pip install -r requirements.txt
python app.py
pause
