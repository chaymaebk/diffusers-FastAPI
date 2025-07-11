#!/usr/bin/env python3
"""
Standalone RealVisXL Model Downloader
Downloads RealVisXL_V4.0 model for AI image generation backend
"""

import os
import sys
import time
import torch
from pathlib import Path
from diffusers import StableDiffusionPipeline, StableDiffusionInpaintPipeline
from huggingface_hub import snapshot_download, HfApi
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def print_banner():
    """Print a nice banner"""
    print("=" * 60)
    print("🎨 RealVisXL Model Downloader")
    print("🤖 AI Image Generation Backend")
    print("=" * 60)
    print()

def check_system():
    """Check system requirements"""
    print("🔍 Checking system requirements...")
    
    # Check Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print(f"🐍 Python version: {python_version}")
    
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required!")
        return False
    
    # Check CUDA
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🖥️  Device: {device}")
    
    if device == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory // 1024**3
        print(f"🎮 GPU: {gpu_name} ({gpu_memory}GB)")
        
        if gpu_memory < 6:
            print("⚠️  Warning: Less than 6GB VRAM detected. Consider using CPU mode.")
    else:
        print("⚠️  No CUDA detected. Will use CPU (much slower).")
    
    print("✅ System check passed!")
    print()
    return True

def check_disk_space():
    """Check available disk space"""
    print("💾 Checking disk space...")
    
    # Get home directory
    home_dir = Path.home()
    cache_dir = home_dir / ".cache" / "huggingface"
    
    # Check available space (in GB)
    statvfs = os.statvfs(home_dir)
    available_gb = (statvfs.f_frsize * statvfs.f_bavail) / 1024**3
    
    print(f"📁 Cache directory: {cache_dir}")
    print(f"💿 Available space: {available_gb:.1f}GB")
    
    if available_gb < 10:
        print("❌ Insufficient disk space! Need at least 10GB free.")
        return False
    
    print("✅ Disk space check passed!")
    print()
    return True

def get_model_info(model_id):
    """Get model information from Hugging Face"""
    try:
        print(f"📊 Getting model info for {model_id}...")
        api = HfApi()
        model_info = api.model_info(model_id)
        
        # Try to get model size
        if hasattr(model_info, 'siblings'):
            total_size = sum(file.size for file in model_info.siblings if file.size)
            size_gb = total_size / 1024**3
            print(f"📦 Model size: {size_gb:.1f}GB")
        else:
            print("📦 Model size: ~4-6GB (estimated)")
            
        print(f"👤 Author: {model_info.author}")
        print(f"📝 Model ID: {model_id}")
        print()
        return True
        
    except Exception as e:
        print(f"⚠️  Could not get model info: {e}")
        print("📦 Estimated model size: ~4-6GB")
        print()
        return True

def download_model(model_id, description):
    """Download a specific model with progress"""
    try:
        print(f"🔄 Downloading {description}...")
        print(f"🌐 Model ID: {model_id}")
        print("⏳ This may take 5-15 minutes depending on your connection...")
        print()
        
        start_time = time.time()
        
        # Download with progress
        cache_dir = snapshot_download(
            repo_id=model_id,
            cache_dir=None,  # Use default cache
            resume_download=True,
            local_files_only=False,
            allow_patterns=None,  # Download all files
            ignore_patterns=["*.md", "*.txt", "*.json"] if "--minimal" in sys.argv else None
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        print()
        print(f"✅ {description} downloaded successfully!")
        print(f"⏱️  Download time: {duration:.1f} seconds")
        print(f"📁 Cached in: {cache_dir}")
        print()
        
        return cache_dir
        
    except KeyboardInterrupt:
        print("\n⚠️  Download cancelled by user.")
        return None
    except Exception as e:
        print(f"\n❌ Error downloading {description}: {e}")
        print()
        return None

def test_model(model_id, cache_dir):
    """Test loading the downloaded model"""
    print("🧪 Testing model loading...")
    
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Test text-to-image pipeline
        print("🔄 Loading text-to-image pipeline...")
        pipeline = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None,
            requires_safety_checker=False,
            local_files_only=True  # Use cached files only
        )
        
        print("✅ Text-to-image pipeline loaded successfully!")
        
        # Clean up to save memory
        del pipeline
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Test inpainting pipeline
        print("🔄 Loading inpainting pipeline...")
        inpaint_pipeline = StableDiffusionInpaintPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None,
            requires_safety_checker=False,
            local_files_only=True  # Use cached files only
        )
        
        print("✅ Inpainting pipeline loaded successfully!")
        
        # Clean up
        del inpaint_pipeline
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        print("✅ All model tests passed!")
        print()
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        print("⚠️  The model was downloaded but may have loading issues.")
        print()
        return False

def main():
    """Main download function"""
    print_banner()
    
    # Check if --help was requested
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: python3 download_models.py [options]")
        print()
        print("Options:")
        print("  --help, -h     Show this help message")
        print("  --minimal      Download only essential files")
        print("  --test-only    Only test existing cached models")
        print()
        print("This script downloads RealVisXL_V4.0 for AI image generation.")
        return
    
    # Test only mode
    if "--test-only" in sys.argv:
        print("🧪 Test mode: checking existing cached models...")
        model_id = "SG161222/RealVisXL_V4.0"
        home_dir = Path.home()
        cache_dir = home_dir / ".cache" / "huggingface" / "hub" / "models--SG161222--RealVisXL_V4.0"
        
        if cache_dir.exists():
            print(f"✅ Model found in cache: {cache_dir}")
            test_model(model_id, str(cache_dir))
        else:
            print("❌ Model not found in cache. Run without --test-only to download.")
        return
    
    # System checks
    if not check_system():
        print("❌ System requirements not met!")
        sys.exit(1)
    
    if not check_disk_space():
        print("❌ Insufficient disk space!")
        sys.exit(1)
    
    # Model information
    model_id = "SG161222/RealVisXL_V4.0"
    description = "RealVisXL V4.0"
    
    get_model_info(model_id)
    
    # Confirm download
    if "--yes" not in sys.argv and "-y" not in sys.argv:
        response = input("🤔 Do you want to proceed with the download? [y/N]: ")
        if response.lower() not in ['y', 'yes']:
            print("❌ Download cancelled by user.")
            return
    
    print("🚀 Starting download process...")
    print()
    
    # Download the model
    cache_dir = download_model(model_id, description)
    
    if cache_dir:
        # Test the model
        if test_model(model_id, cache_dir):
            print("🎉 Model download and verification completed successfully!")
            print()
            print("🚀 You can now start the AI image generation server:")
            print("   ./run.sh")
            print("   # or")
            print("   python3 main.py")
            print()
        else:
            print("⚠️  Model downloaded but failed verification.")
            print("You can still try to run the server.")
            
    else:
        print("❌ Model download failed!")
        print()
        print("💡 Troubleshooting tips:")
        print("   - Check your internet connection")
        print("   - Ensure you have enough disk space")
        print("   - Try running again (supports resume)")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrupted by user.")
        print("👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 