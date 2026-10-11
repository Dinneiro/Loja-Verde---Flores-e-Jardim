@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo =======================================================
echo   LOJA VERDE  (Node.js + Express + SQLite)
echo =======================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js nao encontrado. Instale em https://nodejs.org e abra este arquivo de novo.
  pause
  exit /b 1
)
if not exist ".env" (
  if not exist ".env.example" (
    echo [!] .env.example nao encontrado em %CD%
    pause
    exit /b 1
  )
  copy ".env.example" ".env" >nul
  echo [i] Arquivo .env criado a partir de .env.example.
  echo.
)
echo Instalando dependencias (se necessario)...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo [!] Falha no npm install.
  pause
  exit /b 1
)
echo.
echo Abra no navegador: http://127.0.0.1:5000
echo (para parar o servidor: Ctrl + C)
echo.
call npm start
pause
