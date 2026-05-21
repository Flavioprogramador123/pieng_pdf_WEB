@echo off
cd /d "%~dp0"
if not exist venv\Scripts\activate.bat (
  python -m venv venv
  call venv\Scripts\activate.bat
  pip install -r requirements-local.txt
) else (
  call venv\Scripts\activate.bat
)
pip install -r requirements-local.txt -q 2>nul
if not exist src\static\index.html (
  cd frontend
  call npm install
  call npm run build
  cd ..
)
python src\main.py
