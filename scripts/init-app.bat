@echo off
echo Running application initialization...

:: Get the current directory
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."

:: Ensure the tmp directory exists
set "TMP_DIR=%ROOT_DIR%\tmp"
if not exist "%TMP_DIR%" (
    echo Creating tmp directory at: %TMP_DIR%
    mkdir "%TMP_DIR%"
)

:: Ensure the uploads directory exists
set "UPLOADS_DIR=%TMP_DIR%\uploads"
if not exist "%UPLOADS_DIR%" (
    echo Creating uploads directory at: %UPLOADS_DIR%
    mkdir "%UPLOADS_DIR%"
)

echo Initialization completed successfully. 