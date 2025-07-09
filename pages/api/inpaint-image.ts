import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import multer from 'multer';
import Jimp from 'jimp';
import FormData from 'form-data';

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_INPAINT_URL = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Disable body parser for this route to handle multipart data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to run multer middleware
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'mask', maxCount: 1 }
    ]));

    const files = (req as any).files;
    const body = (req as any).body;

    console.log('req.body:', body);

    const prompt = body.prompt || '';
    const negativePrompt = body.negative_prompt || '';
    const steps = body.steps;
    const cfgScale = body.cfg_scale;
    const samples = body.samples;
    const imageFile = files['image']?.[0];
    const maskFile = files['mask']?.[0];

    if (!STABILITY_API_KEY) {
      return res.status(500).json({ 
        error: 'Stability AI API key not configured. Please set STABILITY_API_KEY in your .env.local file.' 
      });
    }

    if (!imageFile || !maskFile) {
      return res.status(400).json({ 
        error: 'Both image and mask files are required' 
      });
    }

    // Process and resize image and mask to 1024x1024
    const targetWidth = 1024;
    const targetHeight = 1024;

    // For the image
    const imageBuffer = imageFile.buffer;
    const imageJimp = await Jimp.read(imageBuffer);
    imageJimp.resize(targetWidth, targetHeight);
    const processedImageBuffer = await imageJimp.getBufferAsync(Jimp.MIME_PNG);

    // For the mask
    const maskBuffer = maskFile.buffer;
    const maskImageJimp = await Jimp.read(maskBuffer);
    maskImageJimp
      .resize(targetWidth, targetHeight)
      .greyscale()
      .scan(0, 0, targetWidth, targetHeight, function (x, y, idx) {
        // If pixel is closer to white, set to white; else set to black
        const value = this.bitmap.data[idx] > 128 ? 255 : 0;
        this.bitmap.data[idx] = value;
        this.bitmap.data[idx + 1] = value;
        this.bitmap.data[idx + 2] = value;
        this.bitmap.data[idx + 3] = 255; // opaque
      });
    const processedMaskBuffer = await maskImageJimp.getBufferAsync(Jimp.MIME_PNG);

    // Create form data for multipart upload
    const formData = new FormData();

    // Required fields
    formData.append('image', processedImageBuffer, {
      filename: 'image.png',
      contentType: 'image/png'
    });
    formData.append('prompt', prompt);

    // Optional fields
    if (maskFile) {
      formData.append('mask', processedMaskBuffer, {
        filename: 'mask.png',
        contentType: 'image/png'
      });
    }
    if (negativePrompt) formData.append('negative_prompt', negativePrompt);
    if (body.seed) formData.append('seed', body.seed);
    if (body.output_format) {
      formData.append('output_format', body.output_format);
    } else {
      formData.append('output_format', 'png');
    }
    if (body.style_preset) formData.append('style_preset', body.style_preset);
    if (cfgScale) formData.append('cfg_scale', cfgScale);
    if (steps) formData.append('steps', steps);

    console.log('Prompt:', prompt);
    console.log('Negative Prompt:', negativePrompt);
    console.log('Processed image buffer size:', processedImageBuffer.length);
    console.log('Processed mask buffer size:', processedMaskBuffer.length);

    // Log FormData fields
    console.log('FormData fields:');
    console.log('Type of formData:', typeof formData);
    console.log('formData constructor:', formData.constructor.name);
    
    // Alternative logging approach that doesn't rely on forEach
    try {
      if (typeof (formData as any).forEach === 'function') {
        (formData as any).forEach((value: any, key: any) => {
          if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
            console.log(`  ${key}: [binary, length ${value.length}]`);
          } else {
            console.log(`  ${key}:`, value);
          }
        });
      } else {
        console.log('FormData forEach method not available');
        // Just log that FormData was created successfully
        console.log('FormData object created successfully');
        const headers = formData.getHeaders();
        console.log('FormData headers:', headers);
      }
    } catch (error: any) {
      console.log('Error logging FormData fields:', error.message);
    }

    const response = await axios.post(STABILITY_INPAINT_URL, formData, {
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        ...formData.getHeaders(),
        'Accept': 'application/json'
      }
    });

    // Handle v2beta response
    let images = [];
    if (response.data.image) {
      images.push({
        base64: `data:image/png;base64,${response.data.image}`,
        seed: response.data.seed
      });
    } else if (Array.isArray(response.data.images)) {
      images = response.data.images.map((img: any) => ({
        base64: `data:image/png;base64,${img.image}`,
        seed: img.seed
      }));
    } else {
      // Unexpected response
      return res.status(500).json({
        error: 'Unexpected response from Stability API',
        details: response.data
      });
    }

    res.json({ 
      success: true, 
      images,
      usage: response.data.usage
    });

  } catch (error: any) {
    console.error('Error inpainting image:', error.response?.data || error.message || error);
    res.status(500).json({ 
      error: 'Failed to inpaint image',
      details: error.response?.data || error.message || error
    });
  }
} 