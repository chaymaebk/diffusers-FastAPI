import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

interface GenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  steps?: number;
  cfgScale?: number;
  width?: number;
  height?: number;
  samples?: number;
}

interface StabilityResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
  }>;
  usage?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      prompt, 
      negativePrompt, 
      steps, 
      cfgScale, 
      width, 
      height, 
      samples 
    }: GenerateImageRequest = req.body;

    if (!STABILITY_API_KEY) {
      return res.status(500).json({ 
        error: 'Stability AI API key not configured. Please set STABILITY_API_KEY in your .env.local file.' 
      });
    }

    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const requestBody = {
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ],
      cfg_scale: cfgScale || 7,
      height: height || 1024,
      width: width || 1024,
      samples: samples || 1,
      steps: steps || 30
    };

    // Add negative prompt if provided
    if (negativePrompt?.trim()) {
      requestBody.text_prompts.push({
        text: negativePrompt,
        weight: -1
      });
    }

    const response = await axios.post<StabilityResponse>(STABILITY_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Convert base64 images to data URLs
    const images = response.data.artifacts.map(artifact => ({
      base64: `data:image/png;base64,${artifact.base64}`,
      seed: artifact.seed
    }));

    res.json({ 
      success: true, 
      images,
      usage: response.data.usage
    });

  } catch (error: any) {
    console.error('Error generating image:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message
    });
  }
} 