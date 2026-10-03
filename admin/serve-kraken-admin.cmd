@echo off
REM Host the Kraken Access panel on your local network (Windows).
REM Double-click this file, or run:  serve-kraken-admin.cmd [port]
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  node serve.mjs %1
) else (
  echo Node.js was not found. Trying Python instead...
  echo Open  http://localhost:8080/kraken-admin.html  once it starts.
  python -m http.server 8080 --bind 0.0.0.0 2>nul || py -m http.server 8080 --bind 0.0.0.0
)
pause
