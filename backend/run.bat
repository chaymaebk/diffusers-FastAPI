@echo off
REM AI Image Generation Backend Run Script for Windows
REM This script starts the FastAPI server with sensible defaults

setlocal enabledelayedexpansion

REM Default values
set HOST=0.0.0.0
set PORT=8000
set WORKERS=1
set LOG_LEVEL=info
set RELOAD=false

REM Function to print colored output (Windows doesn't support colors easily, so we'll use plain text)
echo AI Image Generation Backend - Run Script for Windows
echo.

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :check_environment
if "%~1"=="-h" goto :show_help
if "%~1"=="--help" goto :show_help
if "%~1"=="-H" (
    set HOST=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--host" (
    set HOST=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-p" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-w" (
    set WORKERS=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--workers" (
    set WORKERS=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-l" (
    set LOG_LEVEL=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--log-level" (
    set LOG_LEVEL=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-r" (
    set RELOAD=true
    shift
    goto :parse_args
)
if "%~1"=="--reload" (
    set RELOAD=true
    shift
    goto :parse_args
)
if "%~1"=="-d" (
    set RELOAD=true
    set LOG_LEVEL=debug
    shift
    goto :parse_args
)
if "%~1"=="--dev" (
    set RELOAD=true
    set LOG_LEVEL=debug
    shift
    goto :parse_args
)
echo [ERROR] Unknown option: %~1
goto :show_help

:show_help
echo AI Image Generation Backend - Run Script for Windows
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo   -h, --help         Show this help message
echo   -H, --host HOST    Host to bind to (default: 0.0.0.0)
echo   -p, --port PORT    Port to bind to (default: 8000)
echo   -w, --workers NUM  Number of worker processes (default: 1)
echo   -l, --log-level LVL Log level: debug, info, warning, error (default: info)
echo   -r, --reload       Enable auto-reload for development
echo   -d, --dev          Development mode (enables reload)
echo.
echo Examples:
echo   %~nx0                 Start server with default settings
echo   %~nx0 --dev           Start in development mode with auto-reload
echo   %~nx0 -p 8080         Start server on port 8080
echo   %~nx0 -w 4            Start with 4 worker processes
echo.
pause
exit /b 0

:check_environment
REM Check if main.py exists
if not exist "main.py" (
    echo [ERROR] main.py not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if virtual environment is activated
if "%VIRTUAL_ENV%"=="" (
    echo [WARNING] No virtual environment detected. Consider using a virtual environment.
    echo.
)

REM Check if requirements are installed
echo [INFO] Checking requirements...
python -c "import fastapi, uvicorn, torch, diffusers, transformers, PIL" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Missing required dependencies. Please install them with:
    echo pip install -r requirements.txt
    pause
    exit /b 1
)

echo [SUCCESS] Requirements check passed
echo.

REM Print configuration
echo [INFO] Starting AI Image Generation Backend...
echo Configuration:
echo   Host: %HOST%
echo   Port: %PORT%
echo   Workers: %WORKERS%
echo   Log Level: %LOG_LEVEL%
echo   Reload: %RELOAD%
echo.
echo Server will be available at:
echo   - Local: http://localhost:%PORT%
echo   - API Docs: http://localhost:%PORT%/docs
echo   - ReDoc: http://localhost:%PORT%/redoc
echo.

REM Build uvicorn command
set UVICORN_CMD=uvicorn main:app --host %HOST% --port %PORT% --log-level %LOG_LEVEL%

if "%RELOAD%"=="true" (
    set UVICORN_CMD=%UVICORN_CMD% --reload
) else (
    set UVICORN_CMD=%UVICORN_CMD% --workers %WORKERS%
)

REM Start the server
echo [INFO] Starting server...
echo [INFO] Press Ctrl+C to stop
echo.

REM Execute the command
%UVICORN_CMD%

REM If we reach here, the server has stopped
echo.
echo [INFO] Server stopped
pause 