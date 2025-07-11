#!/usr/bin/env python3
"""
Simple run script for the AI Image Generation Backend
"""

import os
import sys
import argparse
import uvicorn
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description="Run AI Image Generation Backend")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    parser.add_argument("--log-level", default="info", choices=["debug", "info", "warning", "error"], help="Log level")
    return parser.parse_args()

def check_requirements():
    """Check if required packages are installed"""
    required_packages = [
        "fastapi",
        "uvicorn",
        "torch",
        "diffusers",
        "transformers",
        "PIL"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Error: Missing required packages: {', '.join(missing_packages)}")
        print("Please install dependencies with: pip install -r requirements.txt")
        sys.exit(1)

def main():
    args = parse_args()
    
    # Check if we're in the correct directory
    if not Path("main.py").exists():
        print("Error: main.py not found. Please run this script from the project root directory.")
        sys.exit(1)
    
    # Check requirements
    check_requirements()
    
    # Set environment variables if not already set
    if not os.getenv("PYTHONPATH"):
        os.environ["PYTHONPATH"] = str(Path.cwd())
    
    print(f"Starting AI Image Generation Backend...")
    print(f"Host: {args.host}")
    print(f"Port: {args.port}")
    print(f"Workers: {args.workers}")
    print(f"Log Level: {args.log_level}")
    print(f"Reload: {args.reload}")
    print()
    print("Server will be available at:")
    print(f"  - Local: http://localhost:{args.port}")
    print(f"  - API Docs: http://localhost:{args.port}/docs")
    print(f"  - ReDoc: http://localhost:{args.port}/redoc")
    print()
    
    # Configure uvicorn
    config = {
        "app": "main:app",
        "host": args.host,
        "port": args.port,
        "log_level": args.log_level,
        "reload": args.reload,
        "workers": args.workers if not args.reload else 1,  # Workers can't be > 1 with reload
    }
    
    try:
        uvicorn.run(**config)
    except KeyboardInterrupt:
        print("\nShutting down server...")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 