#!/bin/bash

# AI Image Generation Backend Run Script
# This script starts the FastAPI server with RealVisXL_V4.0 model

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default values
HOST="0.0.0.0"
PORT=8000
WORKERS=1
LOG_LEVEL="info"
RELOAD=false
DOWNLOAD_MODELS=false

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

print_model() {
    echo -e "${PURPLE}[MODEL]${NC} $1"
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
    echo "  -m, --download-models  Download RealVisXL models before starting"
    echo ""
    echo "Examples:"
    echo "  $0                 Start server with default settings"
    echo "  $0 --dev           Start in development mode with auto-reload"
    echo "  $0 -p 8080         Start server on port 8080"
    echo "  $0 -m              Download models first, then start server"
    echo "  $0 --download-models --dev  Download models and start in dev mode"
}

# Function to check disk space
check_disk_space() {
    print_info "Checking available disk space..."
    
    # Get available space in GB
    available_space=$(df . | awk 'NR==2 {print int($4/1024/1024)}')
    
    if [ $available_space -lt 10 ]; then
        print_error "Insufficient disk space! Need at least 10GB, available: ${available_space}GB"
        exit 1
    else
        print_success "Disk space check passed: ${available_space}GB available"
    fi
}

# Function to download models
download_models() {
    print_model "Starting model download process..."
    
    # Check disk space first
    check_disk_space
    
    # Create Python script to download models
    cat > download_models.py << 'EOF'
#!/usr/bin/env python3
"""
Download RealVisXL models for AI image generation
"""

import os
import sys
import torch
from diffusers import StableDiffusionPipeline, StableDiffusionInpaintPipeline
from huggingface_hub import snapshot_download
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_model(model_id, description):
    """Download a specific model"""
    try:
        print(f"\n🔄 Downloading {description}...")
        print(f"Model ID: {model_id}")
        
        # Use snapshot_download for more control
        cache_dir = snapshot_download(
            repo_id=model_id,
            cache_dir=None,  # Use default cache
            resume_download=True,
            local_files_only=False
        )
        
        print(f"✅ {description} downloaded successfully!")
        print(f"📁 Cached in: {cache_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Error downloading {description}: {e}")
        return False

def main():
    print("🚀 RealVisXL Model Downloader")
    print("=" * 50)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🖥️  Device: {device}")
    
    # Model to download
    model_id = "SG161222/RealVisXL_V4.0"
    
    # Download the model
    success = download_model(model_id, "RealVisXL V4.0")
    
    if success:
        print("\n✅ All models downloaded successfully!")
        print("🎉 You can now start the AI image generation server!")
        
        # Test loading the model
        print("\n🧪 Testing model loading...")
        try:
            pipeline = StableDiffusionPipeline.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                safety_checker=None,
                requires_safety_checker=False
            )
            print("✅ Model test loading successful!")
            
            # Clean up to save memory
            del pipeline
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
            
        except Exception as e:
            print(f"⚠️  Model test loading failed: {e}")
            print("The model was downloaded but may have issues.")
        
    else:
        print("\n❌ Model download failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

    # Run the download script
    print_model "Running model download script..."
    python3 download_models.py
    
    # Clean up
    rm -f download_models.py
    
    print_success "Model download process completed!"
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
        -m|--download-models)
            DOWNLOAD_MODELS=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Print banner
echo ""
echo "🎨 AI Image Generation Backend"
echo "Model: RealVisXL V4.0"
echo "Features: Text-to-Image, Inpainting, Object Erasing"
echo "=" * 50

# Check if main.py exists
if [[ ! -f "main.py" ]]; then
    print_error "main.py not found. Please run this script from the backend directory."
    exit 1
fi

# Check if requirements.txt exists
if [[ ! -f "requirements.txt" ]]; then
    print_error "requirements.txt not found. Please run this script from the backend directory."
    exit 1
fi

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    print_warning "No virtual environment detected."
    echo "💡 Consider creating one:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo ""
fi

# Check if requirements are installed
print_info "Checking Python dependencies..."
missing_packages=()

for package in "fastapi" "uvicorn" "torch" "diffusers" "transformers" "PIL"; do
    if ! python3 -c "import $package" 2>/dev/null; then
        missing_packages+=($package)
    fi
done

if [ ${#missing_packages[@]} -ne 0 ]; then
    print_error "Missing required packages: ${missing_packages[*]}"
    echo ""
    echo "📦 Install them with:"
    echo "   pip install -r requirements.txt"
    echo ""
    echo "🚀 For GPU support (recommended):"
    echo "   pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 --index-url https://download.pytorch.org/whl/cu118"
    echo "   pip install -r requirements.txt"
    exit 1
fi

print_success "All Python dependencies are installed!"

# Check CUDA availability
print_info "Checking GPU/CUDA availability..."
if python3 -c "import torch; print('CUDA available:', torch.cuda.is_available())" | grep -q "True"; then
    print_success "CUDA is available! Will use GPU acceleration."
    GPU_INFO=$(python3 -c "import torch; print(f'GPU: {torch.cuda.get_device_name(0)} ({torch.cuda.get_device_properties(0).total_memory // 1024**3}GB)')" 2>/dev/null || echo "GPU info unavailable")
    echo "🖥️  $GPU_INFO"
else
    print_warning "CUDA not available. Will use CPU (slower)."
fi

# Download models if requested
if [[ "$DOWNLOAD_MODELS" == "true" ]]; then
    download_models
fi

# Check if models are cached
print_info "Checking model cache..."
CACHE_DIR="$HOME/.cache/huggingface/hub"
MODEL_CACHE="$CACHE_DIR/models--SG161222--RealVisXL_V4.0"

if [[ -d "$MODEL_CACHE" ]]; then
    print_success "RealVisXL V4.0 model found in cache!"
    MODEL_SIZE=$(du -sh "$MODEL_CACHE" 2>/dev/null | cut -f1 || echo "Unknown")
    echo "📁 Cache location: $MODEL_CACHE"
    echo "💾 Model size: $MODEL_SIZE"
else
    print_warning "RealVisXL V4.0 model not found in cache."
    echo ""
    echo "🔄 The model will be downloaded automatically on first run."
    echo "📊 Expected download size: ~4-6GB"
    echo "⏱️  First startup will take 5-10 minutes."
    echo ""
    echo "💡 To pre-download the model, run:"
    echo "   $0 --download-models"
fi

echo ""

# Print configuration
print_info "Server Configuration:"
echo "  🌐 Host: $HOST"
echo "  🔌 Port: $PORT"
echo "  👥 Workers: $WORKERS"
echo "  📊 Log Level: $LOG_LEVEL"
echo "  🔄 Reload: $RELOAD"
echo ""
echo "🌍 Server will be available at:"
echo "  📱 Local: http://localhost:$PORT"
echo "  📖 API Docs: http://localhost:$PORT/docs"
echo "  📚 ReDoc: http://localhost:$PORT/redoc"
echo ""

# Build uvicorn command
UVICORN_CMD="uvicorn main:app --host $HOST --port $PORT --log-level $LOG_LEVEL"

if [[ "$RELOAD" == "true" ]]; then
    UVICORN_CMD="$UVICORN_CMD --reload"
    print_info "Development mode enabled (auto-reload on file changes)"
else
    UVICORN_CMD="$UVICORN_CMD --workers $WORKERS"
fi

# Start the server
print_success "Starting AI Image Generation Backend..."
echo ""
print_info "Available endpoints:"
echo "  🎨 POST /api/generate-image  - Text to image generation"
echo "  🖌️  POST /api/inpaint-image  - Image inpainting"
echo "  🧹 POST /api/erase-image    - Object removal/erasing"
echo "  ❤️  GET  /api/health        - Health check"
echo ""
print_info "Press Ctrl+C to stop the server"
echo ""

# Trap Ctrl+C
trap 'echo ""; print_info "Shutting down server..."; print_success "Server stopped successfully!"; exit 0' INT

# Execute the command
exec $UVICORN_CMD 