@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================================
echo        LOJA VERDE - SERVIDOR NODE.JS
echo ==============================================
where node >nul 2>nul || (echo ERRO: instale Node.js LTS em https://nodejs.org/ & pause & exit /b 1)
if not exist node_modules (echo Instalando dependencias... & call npm install || (echo Falha ao instalar dependencias. & pause & exit /b 1))
if not exist .env (copy .env.example .env >nul & echo Arquivo .env criado. Edite ADMIN_API_KEY antes de usar a administracao.)
echo Abrindo em http://127.0.0.1:5000
echo Para encerrar, pressione Ctrl+C.
call npm start
pause
