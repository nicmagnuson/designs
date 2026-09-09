@echo off
cd /d "%~dp0"
start "" /min node bridge\serve.js
timeout /t 1 >nul
start "" chrome --app=http://localhost:4747 || start http://localhost:4747
