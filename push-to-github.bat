@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

set "REMOTE=https://github.com/Nutexe999/libreauth-Bot.git"
set "REPO=Nutexe999/libreauth-Bot"
set "GIT_NAME=Nutexe999"
set "GIT_EMAIL=nutexe999@users.noreply.github.com"
set "SCRIPTS=%~dp0scripts"

set "MSG=%~1"

echo.
echo  ========================================
echo   libreauth-Bot - Push to GitHub
echo   %REPO%
echo  ========================================
echo.

if not exist ".git\" (
    echo [ERR] not a git repo
    echo     git init
    echo     git remote add origin %REMOTE%
    pause
    exit /b 1
)

git status --porcelain >nul 2>&1
set "HASCHG=0"
for /f "delims=" %%A in ('git status --porcelain 2^>nul') do set "HASCHG=1"

if "!HASCHG!"=="0" (
    echo [i] working tree clean - skip commit
    goto :PUSH
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPTS%\git-check-secrets.ps1"
if errorlevel 1 (
    echo.
    echo [ERR] found sensitive files in changes
    echo     do not commit .env / *.sqlite
    pause
    exit /b 1
)

if "!MSG!"=="" (
    for /f "delims=" %%M in ('powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPTS%\git-commit-msg.ps1"') do set "MSG=%%M"
)
if "!MSG!"=="" set "MSG=libreauth-Bot update"

echo [*] commit: !MSG!
echo.

git add -A
if errorlevel 1 goto :FAIL

git -c user.name=%GIT_NAME% -c user.email=%GIT_EMAIL% commit -m "!MSG!"
if errorlevel 1 goto :FAIL

:PUSH
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [*] add remote origin
    git remote add origin %REMOTE%
)

set "CUR_REMOTE="
for /f "delims=" %%U in ('git remote get-url origin 2^>nul') do set "CUR_REMOTE=%%U"

set "REMOTE_OK=0"
echo !CUR_REMOTE! | findstr /i "libreauth-Bot" >nul
if not errorlevel 1 set "REMOTE_OK=1"
if "!REMOTE_OK!"=="0" (
    echo [WARN] origin is not libreauth-Bot repo
    echo        current: !CUR_REMOTE!
    echo        want:    %REMOTE%
    set "FIX="
    set /p FIX=change origin? y/n: 
    if /i "!FIX!"=="y" git remote set-url origin %REMOTE%
)

git branch -M main 2>nul

echo [*] push origin main ...
git push -u origin main
if errorlevel 1 (
    echo.
    echo [ERR] push failed
    echo     gh auth login
    echo     or Git Credential Manager / PAT
    echo     repo: %REMOTE%
    pause
    exit /b 1
)

echo.
echo [ok] https://github.com/%REPO%
echo.
pause
exit /b 0

:FAIL
echo [ERR] failed
pause
exit /b 1
