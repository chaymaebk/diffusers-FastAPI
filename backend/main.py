import os
import io
import base64
import random
from typing import Optional, List
from contextlib import asynccontextmanager

import torch
from PIL import Image
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from diffusers import (
    StableDiffusionPipeline,
    StableDiffusionInpaintPipeline,
    AutoencoderKL,
    UNet2DConditionModel,
    PNDMScheduler,
    DiffusionPipeline
)
from transformers import CLIPTextModel, CLIPTokenizer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables to store pipelines
text_to_image_pipeline = None
inpaint_pipeline = None

# Pydantic models
class GenerateImageRequest(BaseModel):
    prompt: str
    negativePrompt: Optional[str] = ""
    steps: int = 20
    cfgScale: float = 7.5
    width: int = 512
    height: int = 512
    samples: int = 1

class ImageResponse(BaseModel):
    base64: str
    seed: int

class GenerateImageResponse(BaseModel):
    success: bool
    images: List[ImageResponse]
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    apiKeyConfigured: bool
    gpuAvailable: bool
    modelsLoaded: bool

def load_models():
    """Load diffusion models into memory"""
    global text_to_image_pipeline, inpaint_pipeline
    
    try:
        # Check if CUDA is available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        # Load text-to-image pipeline
        logger.info("Loading text-to-image pipeline...")
        text_to_image_pipeline = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None,
            requires_safety_checker=False
        )
        text_to_image_pipeline.to(device)
        
        # Optimize for memory if using GPU
        if device == "cuda":
            try:
                text_to_image_pipeline.enable_attention_slicing()
                logger.info("Enabled attention slicing for text-to-image pipeline")
            except AttributeError:
                logger.warning("Attention slicing not available for text-to-image pipeline")
            
            try:
                text_to_image_pipeline.enable_model_cpu_offload()
                logger.info("Enabled CPU offload for text-to-image pipeline")
            except AttributeError:
                logger.warning("CPU offload not available for text-to-image pipeline")
        
        # Load inpainting pipeline
        logger.info("Loading inpainting pipeline...")
        inpaint_pipeline = StableDiffusionInpaintPipeline.from_pretrained(
            "runwayml/stable-diffusion-inpainting",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None,
            requires_safety_checker=False
        )
        inpaint_pipeline.to(device)
        
        # Optimize for memory if using GPU
        if device == "cuda":
            try:
                inpaint_pipeline.enable_attention_slicing()
                logger.info("Enabled attention slicing for inpainting pipeline")
            except AttributeError:
                logger.warning("Attention slicing not available for inpainting pipeline")
            
            try:
                inpaint_pipeline.enable_model_cpu_offload()
                logger.info("Enabled CPU offload for inpainting pipeline")
            except AttributeError:
                logger.warning("CPU offload not available for inpainting pipeline")
        
        logger.info("Models loaded successfully!")
        
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        raise e

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup"""
    logger.info("Starting up...")
    load_models()
    yield
    logger.info("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="AI Image Generation API",
    description="FastAPI backend for AI image generation and inpainting using GPU diffusers",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def pil_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buffer.read()).decode()}"

def base64_to_pil(base64_str: str) -> Image.Image:
    """Convert base64 string to PIL Image"""
    if base64_str.startswith("data:image"):
        base64_str = base64_str.split(",")[1]
    
    image_data = base64.b64decode(base64_str)
    return Image.open(io.BytesIO(image_data))

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        apiKeyConfigured=True,  # Not using external API, so always True
        gpuAvailable=torch.cuda.is_available(),
        modelsLoaded=text_to_image_pipeline is not None and inpaint_pipeline is not None
    )

@app.post("/api/generate-image", response_model=GenerateImageResponse)
async def generate_image(request: GenerateImageRequest):
    """Generate images from text prompts"""
    try:
        if text_to_image_pipeline is None:
            raise HTTPException(status_code=503, detail="Text-to-image model not loaded")
        
        logger.info(f"Generating {request.samples} image(s) for prompt: {request.prompt}")
        
        images = []
        for i in range(request.samples):
            # Generate a random seed for each image
            seed = random.randint(0, 2**32 - 1)
            generator = torch.Generator(device=text_to_image_pipeline.device).manual_seed(seed)
            
            # Generate image
            result = text_to_image_pipeline(
                prompt=request.prompt,
                negative_prompt=request.negativePrompt if request.negativePrompt else None,
                width=request.width,
                height=request.height,
                num_inference_steps=request.steps,
                guidance_scale=request.cfgScale,
                generator=generator,
                num_images_per_prompt=1
            )
            
            # Convert to base64
            image_base64 = pil_to_base64(result.images[0])
            images.append(ImageResponse(base64=image_base64, seed=seed))
        
        logger.info(f"Successfully generated {len(images)} image(s)")
        return GenerateImageResponse(success=True, images=images)
        
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        return GenerateImageResponse(
            success=False,
            images=[],
            error=str(e)
        )

@app.post("/api/inpaint-image", response_model=GenerateImageResponse)
async def inpaint_image(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: Optional[str] = Form(None),
    cfg_scale: float = Form(7.5),
    samples: int = Form(1),
    steps: int = Form(20)
):
    """Inpaint images using uploaded image and mask"""
    try:
        if inpaint_pipeline is None:
            raise HTTPException(status_code=503, detail="Inpainting model not loaded")
        
        logger.info(f"Inpainting {samples} image(s) for prompt: {prompt}")
        
        # Read and process uploaded files
        image_bytes = await image.read()
        mask_bytes = await mask.read()
        
        # Convert to PIL Images
        original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        mask_image = Image.open(io.BytesIO(mask_bytes)).convert("L")  # Convert to grayscale
        
        # Resize images to match pipeline requirements
        original_image = original_image.resize((512, 512))
        mask_image = mask_image.resize((512, 512))
        
        images = []
        for i in range(samples):
            # Generate a random seed for each image
            seed = random.randint(0, 2**32 - 1)
            generator = torch.Generator(device=inpaint_pipeline.device).manual_seed(seed)
            
            # Generate inpainted image
            result = inpaint_pipeline(
                prompt=prompt,
                image=original_image,
                mask_image=mask_image,
                negative_prompt=negative_prompt if negative_prompt else None,
                num_inference_steps=steps,
                guidance_scale=cfg_scale,
                generator=generator,
                num_images_per_prompt=1
            )
            
            # Convert to base64
            image_base64 = pil_to_base64(result.images[0])
            images.append(ImageResponse(base64=image_base64, seed=seed))
        
        logger.info(f"Successfully inpainted {len(images)} image(s)")
        return GenerateImageResponse(success=True, images=images)
        
    except Exception as e:
        logger.error(f"Error inpainting image: {str(e)}")
        return GenerateImageResponse(
            success=False,
            images=[],
            error=str(e)
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Image Generation API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 