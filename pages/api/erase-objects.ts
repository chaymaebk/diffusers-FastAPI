import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { promisify } from 'util';
import sharp from 'sharp';

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const uploadMiddleware = promisify(upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mask', maxCount: 1 }
]));

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle file upload
    await uploadMiddleware(req as any, res as any);
    
    const files = (req as any).files;
    if (!files?.image?.[0] || !files?.mask?.[0]) {
      return res.status(400).json({ error: 'Both image and mask files are required' });
    }

    const imageFile = files.image[0];
    const maskFile = files.mask[0];

    // Process mask to ensure it's binary (white areas to remove, black to keep)
    const processedMask = await sharp(maskFile.buffer)
      .grayscale()
      .threshold(128)
      .png()
      .toBuffer();

    // Prepare form data for Stability AI
    const formData = new FormData();
    formData.append('image', new Blob([imageFile.buffer], { type: imageFile.mimetype }));
    formData.append('mask', new Blob([processedMask], { type: 'image/png' }));

    const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_API_KEY) {
      console.error('STABILITY_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Call Stability AI remove background endpoint
    const response = await fetch('https://api.stability.ai/v2beta/stable-image/edit/remove-background', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Stability AI API error: ${response.status} - ${errorText}` 
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    res.status(200).json({
      success: true,
      image: {
        base64: base64Image,
        seed: Date.now() // Use timestamp as seed for erase operations
      }
    });

  } catch (error) {
    console.error('Error in erase-objects API:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 