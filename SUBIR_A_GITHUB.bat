@echo off
chcp 65001 >nul
title Subir laboratorio a GitHub
cd /d "%~dp0"
set LOG=%~dp0.git\subir_log.txt
echo Corrida %date% %time% > "%LOG%"

rem --- Identidad de Git (solo pregunta si no esta configurada) ---
git config user.name >nul 2>&1
if errorlevel 1 set /p GNAME=Tu nombre para los commits (ej. Brayan Jimenez Ospina): 
if defined GNAME git config user.name "%GNAME%"
git config user.email >nul 2>&1
if errorlevel 1 set /p GMAIL=Tu correo de GitHub: 
if defined GMAIL git config user.email "%GMAIL%"

rem --- Horas de la mision exploratoria (paso 4), solo si siguen en blanco ---
findstr /C:"**Inicio:** ____" "evidencias\paso4_ejecucion\mision_25min.md" >nul
if errorlevel 1 goto sinhoras
echo.
echo Paso 4: hora en que hiciste la sesion exploratoria de 25 minutos.
set /p HINI=Hora de inicio (ej. 10:15 a. m.): 
set /p HFIN=Hora de fin (ej. 10:40 a. m.): 
powershell -NoProfile -Command "$f='evidencias\paso4_ejecucion\mision_25min.md'; $t=[IO.File]::ReadAllText($f); $t=$t.Replace('**Inicio:** ____','**Inicio:** %HINI%').Replace('**Fin:** ____','**Fin:** %HFIN%'); [IO.File]::WriteAllText($f,$t,(New-Object Text.UTF8Encoding $false))"
:sinhoras

set USUARIO=brayanjimenez327

rem --- Remotos: origin = tu fork, upstream = repo del profesor ---
git remote get-url upstream >nul 2>&1
if errorlevel 1 git remote add upstream https://github.com/juliomartinezpascual/lab-pruebas-automatizadas-ii.git
git remote set-url origin https://github.com/%USUARIO%/lab-pruebas-automatizadas-ii.git

git checkout -B lab-aixqa-brayan >> "%LOG%" 2>&1
if errorlevel 1 goto error

call :paso "docs evidencias/paso1_arranque" "evidencias: paso 1 arranque y recorrido (admin y operador)"
call :paso "evidencias/paso2_riesgos" "evidencias: paso 2 top 5 riesgos refinados"
call :paso "evidencias/paso3_casos prompts" "evidencias: paso 3 casos de prueba refinados y preguntas a la IA"
call :paso "evidencias/paso4_ejecucion" "evidencias: paso 4 matriz de ejecucion y mision exploratoria"
call :paso "evidencias/paso5_bugs" "evidencias: paso 5 reporte de 18 bugs con capturas"
call :paso "evidencias/paso6_evaluacion_ia" "evidencias: paso 6 evaluacion critica de la IA"
call :paso "automation evidencias/paso7_automation GENERAR_EVIDENCIAS.bat" "automation: E2E y criterios de aceptacion con Playwright"
call :paso "entrega SUBIR_A_GITHUB.bat" "entrega: paso 8 entregables finales"

echo.
echo (si se abre una ventana de GitHub, autoriza ahi)
echo === Subiendo a https://github.com/%USUARIO%/lab-pruebas-automatizadas-ii ===
git push -u origin lab-aixqa-brayan >> "%LOG%" 2>&1
if errorlevel 1 goto nopush

rem Tag opcional que pide la guia (paso 8)
git tag -f -a entrega-final -m "Entrega Laboratorio Pruebas Automatizadas II + IA"
git push -f origin entrega-final >> "%LOG%" 2>&1
echo OK >> "%LOG%"

echo.
echo ============================================================
echo  LISTO. Rama lab-aixqa-brayan subida a tu fork.
echo  https://github.com/%USUARIO%/lab-pruebas-automatizadas-ii/tree/lab-aixqa-brayan
echo ============================================================
pause
exit /b 0

:paso
git add %~1 >> "%LOG%" 2>&1
git diff --cached --quiet
if errorlevel 1 git commit -m %2 >> "%LOG%" 2>&1
exit /b 0

:nopush
echo.
echo PUSH-FALLO >> "%LOG%"
echo *** Los commits quedaron hechos, pero el push fallo. Avisale a Claude. ***
echo Lo mas comun: todavia no existe tu fork. Crealo aqui:
echo   https://github.com/juliomartinezpascual/lab-pruebas-automatizadas-ii/fork
echo y vuelve a dar doble clic a este archivo (no duplica commits).
pause
exit /b 1

:error
echo.
echo ERROR >> "%LOG%"
echo *** Algo fallo. Avisale a Claude en el chat: el ya puede leer el registro. ***
pause
exit /b 1
