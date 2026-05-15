@echo off
cd /d "c:\Users\Anas\Desktop\projecto"
git config --global credential.helper cache
git add .
git commit -m "fix(backend): auto-create shared dashboard v3 - return direct response"
git push origin main
echo.
echo Push completato (o errore sopra)
pause
