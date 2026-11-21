@echo off
chcp 65001 >nul
title Generar evidencias - StockPascual
cd /d "%~dp0"
set LOG=%~dp0.git\generar_log.txt
echo Corrida %date% %time% > "%LOG%"

echo.
echo === 0/5  Apagando cualquier StockPascual que haya quedado abierto ===
call :apagar

echo === 1/5  Instalando dependencias de la app ===
cd app
call npm install >> "%LOG%" 2>&1
if errorlevel 1 goto error

echo === 2/5  Arrancando StockPascual (datos iniciales) ===
start "StockPascual-servidor" /min cmd /c "npm start"

cd ..\automation
echo === 3/5  Instalando Playwright y Chromium ===
call npm install >> "%LOG%" 2>&1
if errorlevel 1 goto error
call npx playwright install chromium >> "%LOG%" 2>&1
if errorlevel 1 goto error

rem Esperar a que el servidor responda (maximo ~30 s)
set /a INTENTOS=0
:esperar
curl -s http://localhost:3080/api/health >nul 2>&1
if not errorlevel 1 goto arriba
set /a INTENTOS+=1
if %INTENTOS% GEQ 30 goto error
timeout /t 1 /nobreak >nul
goto esperar
:arriba

echo === 4/5  Tomando capturas de evidencia (pasos 1 y 5) ===
call npm run evidencias >> "%LOG%" 2>&1
if errorlevel 1 goto error

echo === 5/5  Ejecutando las pruebas automatizadas (paso 7) ===
call npm test > ..\evidencias\paso7_automation\salida_consola_playwright.txt 2>&1
type ..\evidencias\paso7_automation\salida_consola_playwright.txt >> "%LOG%"
call npm run evidencias:reporte >> "%LOG%" 2>&1
if errorlevel 1 goto error

cd ..
call :apagar
echo.
echo ============================================================
echo  LISTO. Capturas en evidencias\paso1_arranque, paso5_bugs y paso7_automation
echo  Ahora dale doble clic a SUBIR_A_GITHUB.bat
echo ============================================================
echo OK >> "%LOG%"
pause
exit /b 0

:apagar
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":3080 .*LISTENING"') do taskkill /PID %%p /T /F >nul 2>&1
exit /b 0

:error
call :apagar
echo ERROR >> "%LOG%"
echo.
echo *** Algo fallo. Avisale a Claude en el chat: el ya puede leer el registro. ***
pause
exit /b 1
