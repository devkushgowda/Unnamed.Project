@echo off
echo Setting up Recipe Organizer App...

echo.
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Backend dependency installation failed!
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ../RecipeOrganizerApp
call npm install
if %errorlevel% neq 0 (
    echo Frontend dependency installation failed!
    pause
    exit /b 1
)

echo.
echo Setup complete!
echo.
echo To start the application:
echo 1. Start backend: cd backend && npm run dev
echo 2. Start frontend: cd RecipeOrganizerApp && npm start
echo.
pause
