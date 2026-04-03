@echo off
echo installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo npm install failed!
    pause
    exit /b
)
echo starting monetisation manager...
npm run dev:full
pause
