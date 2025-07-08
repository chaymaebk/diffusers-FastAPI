const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Stability AI API configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate image endpoint
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, negativePrompt, steps, cfgScale, width, height, samples } = req.body;

        if (!STABILITY_API_KEY) {
            return res.status(500).json({ 
                error: 'Stability AI API key not configured. Please set STABILITY_API_KEY in your .env file.' 
            });
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
        if (negativePrompt) {
            requestBody.text_prompts.push({
                text: negativePrompt,
                weight: -1
            });
        }

        const response = await axios.post(STABILITY_API_URL, requestBody, {
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

    } catch (error) {
        console.error('Error generating image:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to generate image',
            details: error.response?.data || error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        apiKeyConfigured: !!STABILITY_API_KEY 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API Key configured: ${STABILITY_API_KEY ? 'Yes' : 'No'}`);
    if (!STABILITY_API_KEY) {
        console.log('⚠️  Please set STABILITY_API_KEY in your .env file');
    }
}); 