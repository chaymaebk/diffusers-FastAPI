# AI Image Generation Backend

A FastAPI-based backend for AI image generation and inpainting using GPU-accelerated diffusion models.

## Features

- **Text-to-Image Generation**: Generate high-quality images from text prompts
- **Image Inpainting**: Modify existing images using masks and prompts
- **GPU Acceleration**: Optimized for NVIDIA GPUs with CUDA support
- **RESTful API**: Easy-to-use REST endpoints
- **Base64 Image Handling**: Seamless integration with frontend applications
- **Memory Optimization**: Efficient memory usage with attention slicing
- **CORS Support**: Ready for web frontend integration

## Requirements

### System Requirements

- Python 3.8+
- NVIDIA GPU with CUDA support (recommended)
- At least 6GB VRAM for GPU usage
- At least 8GB RAM for CPU usage

### Software Dependencies

All dependencies are listed in `requirements.txt`. Key packages include:

- FastAPI
- PyTorch
- Diffusers
- Transformers
- PIL (Pillow)
- OpenCV

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-image-generation-backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

For CPU usage:
```bash
pip install -r requirements.txt
```

For GPU usage (CUDA 11.8):
```bash
pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 torchaudio==2.1.0+cu118 --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
```

### 4. Environment Configuration (Optional)

Copy and modify the environment configuration:
```bash
cp env.example .env
# Edit .env with your preferred settings
```

## Usage

### Starting the Server

```bash
# Development server
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

The API will be available at `http://localhost:8000`

### API Documentation

Once the server is running, you can view the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
```http
GET /api/health
```

Returns the status of the API and model loading state.

### Text-to-Image Generation
```http
POST /api/generate-image
Content-Type: application/json

{
  "prompt": "A beautiful landscape with mountains and lakes",
  "negativePrompt": "ugly, blurry, low quality",
  "steps": 20,
  "cfgScale": 7.5,
  "width": 512,
  "height": 512,
  "samples": 1
}
```

### Image Inpainting
```http
POST /api/inpaint-image
Content-Type: multipart/form-data

image: [PNG/JPEG file]
mask: [PNG/JPEG file - white areas will be inpainted]
prompt: "A cat sitting on a chair"
negative_prompt: "ugly, blurry"
cfg_scale: 7.5
samples: 1
steps: 20
```

## Model Information

### Default Models

- **Text-to-Image**: `runwayml/stable-diffusion-v1-5`
- **Inpainting**: `runwayml/stable-diffusion-inpainting`

### First Run

On the first run, the application will download the required models from Hugging Face Hub. This may take several minutes depending on your internet connection.

Models are cached locally to avoid re-downloading on subsequent runs.

## Memory Optimization

The backend includes several memory optimization features:

- **Attention Slicing**: Reduces VRAM usage for larger images
- **Memory Efficient Attention**: Further reduces memory footprint
- **Half Precision**: Uses float16 on GPU for faster inference

## Performance Tips

### GPU Usage

- Ensure you have sufficient VRAM (6GB+ recommended)
- Use CUDA-enabled PyTorch for best performance
- Close other GPU-intensive applications

### CPU Usage

- Use CPU mode if you don't have a compatible GPU
- Expect slower generation times (5-10x slower)
- Consider using smaller batch sizes

## Troubleshooting

### Common Issues

1. **CUDA Out of Memory**
   - Reduce batch size (`samples`)
   - Reduce image dimensions
   - Enable memory optimizations in environment

2. **Model Loading Failures**
   - Check internet connection
   - Verify disk space (models are ~4GB each)
   - Check Hugging Face Hub status

3. **Slow Generation**
   - Verify GPU usage with `nvidia-smi`
   - Check if CUDA version is compatible
   - Reduce inference steps for faster generation

### Environment Variables

Key environment variables (create `.env` file):

```env
# Force CPU usage
DEVICE=cpu

# Custom model paths
TEXT_TO_IMAGE_MODEL=runwayml/stable-diffusion-v1-5
INPAINTING_MODEL=runwayml/stable-diffusion-inpainting

# Memory optimization
ENABLE_ATTENTION_SLICING=true
ENABLE_MEMORY_EFFICIENT_ATTENTION=true
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Style

```bash
# Install formatting tools
pip install black isort

# Format code
black .
isort .
```

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub

## Acknowledgments

- [Hugging Face Diffusers](https://github.com/huggingface/diffusers)
- [Stability AI](https://stability.ai/)
- [FastAPI](https://fastapi.tiangolo.com/) 