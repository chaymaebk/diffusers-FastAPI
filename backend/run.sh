#!/bin/bash

# AI Image Generation Backend Run Script
# This script starts the FastAPI server with sensible defaults

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
HOST="0.0.0.0"
PORT=8000
WORKERS=1
LOG_LEVEL="info"
RELOAD=false

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to show help
show_help() {
    echo "AI Image Generation Backend - Run Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help         Show this help message"
    echo "  -H, --host HOST    Host to bind to (default: 0.0.0.0)"
    echo "  -p, --port PORT    Port to bind to (default: 8000)"
    echo "  -w, --workers NUM  Number of worker processes (default: 1)"
    echo "  -l, --log-level LVL Log level: debug, info, warning, error (default: info)"
    echo "  -r, --reload       Enable auto-reload for development"
    echo "  -d, --dev          Development mode (enables reload)"
    echo ""
    echo "Examples:"
    echo "  $0                 Start server with default settings"
    echo "  $0 --dev           Start in development mode with auto-reload"
    echo "  $0 -p 8080         Start server on port 8080"
    echo "  $0 -w 4            Start with 4 worker processes"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -H|--host)
            HOST="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -w|--workers)
            WORKERS="$2"
            shift 2
            ;;
        -l|--log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        -r|--reload)
            RELOAD=true
            shift
            ;;
        -d|--dev)
            RELOAD=true
            LOG_LEVEL="debug"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if main.py exists
if [[ ! -f "main.py" ]]; then
    print_error "main.py not found. Please run this script from the project root directory."
    exit 1
fi

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    print_warning "No virtual environment detected. Consider using a virtual environment."
fi

# Check if requirements are installed
print_info "Checking requirements..."
if ! python3 -c "import fastapi, uvicorn, torch, diffusers, transformers, PIL" 2>/dev/null; then
    print_error "Missing required dependencies. Please install them with:"
    echo "pip install -r requirements.txt"
    exit 1
fi

print_success "Requirements check passed"

# Print configuration
print_info "Starting AI Image Generation Backend..."
echo "Configuration:"
echo "  Host: $HOST"
echo "  Port: $PORT"
echo "  Workers: $WORKERS"
echo "  Log Level: $LOG_LEVEL"
echo "  Reload: $RELOAD"
echo ""
echo "Server will be available at:"
echo "  - Local: http://localhost:$PORT"
echo "  - API Docs: http://localhost:$PORT/docs"
echo "  - ReDoc: http://localhost:$PORT/redoc"
echo ""

# Build uvicorn command
UVICORN_CMD="uvicorn main:app --host $HOST --port $PORT --log-level $LOG_LEVEL"

if [[ "$RELOAD" == "true" ]]; then
    UVICORN_CMD="$UVICORN_CMD --reload"
else
    UVICORN_CMD="$UVICORN_CMD --workers $WORKERS"
fi

# Start the server
print_info "Starting server..."
print_info "Press Ctrl+C to stop"
echo ""

# Trap Ctrl+C
trap 'echo ""; print_info "Shutting down server..."; exit 0' INT

# Execute the command
exec $UVICORN_CMD 