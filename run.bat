@echo off
cd /d "%~dp0"
if not exist venv\Scripts\activate.bat (
  python -m venv venv
  call venv\Scripts\activate.bat
  pip install -r requirements-local.txt
) else (
  call venv\Scripts\activate.bat
)
echo [PIENG] Build do frontend (index + assets sincronizados)...
cd frontend
if not exist node_modules (
  call npm install
)
call npm run build
if errorlevel 1 (
  echo ERRO: build do frontend falhou.
  exit /b 1
)
cd ..
echo [PIENG] Abrindo http://localhost:5001
python src\main.py
