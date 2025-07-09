require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const Jimp = require('jimp');
const FormData = require('form-data');
const app = express();
const PORT = process.env.PORT || 3001;// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.static('public'));

// Stability AI API configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
const STABILITY_INPAINT_URL = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint';

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

// Inpaint image endpoint
app.post('/api/inpaint-image', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mask', maxCount: 1 }
]), async (req, res) => {
    try {
        // Debug: log req.body to verify received fields
        console.log('req.body:', req.body);
        // Use correct field names from req.body
        const prompt = req.body.prompt || '';
        const negativePrompt = req.body.negative_prompt || '';
        const steps = req.body.steps;
        const cfgScale = req.body.cfg_scale;
        const samples = req.body.samples;
        const imageFile = req.files['image']?.[0];
        const maskFile = req.files['mask']?.[0];

        if (!STABILITY_API_KEY) {
            return res.status(500).json({ 
                error: 'Stability AI API key not configured. Please set STABILITY_API_KEY in your .env file.' 
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
        await maskImageJimp.writeAsync('debug_mask.png');
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
        if (req.body.seed) formData.append('seed', req.body.seed);
        if (req.body.output_format) {
            formData.append('output_format', req.body.output_format);
        } else {
            formData.append('output_format', 'png');
        }
        if (req.body.style_preset) formData.append('style_preset', req.body.style_preset);
        if (cfgScale) formData.append('cfg_scale', cfgScale);
        if (steps) formData.append('steps', steps);

        const promptSafe = prompt || '';
        const negativePromptSafe = negativePrompt || '';
        console.log('Prompt:', promptSafe);
        console.log('Negative Prompt:', negativePromptSafe);
        console.log('Processed image buffer size:', processedImageBuffer.length);
        console.log('Processed mask buffer size:', processedMaskBuffer.length);
        // Log FormData fields
        console.log('FormData fields:');
        console.log('Type of formData:', typeof formData);
        console.log('formData constructor:', formData.constructor.name);
        console.log('formData methods:', Object.getOwnPropertyNames(formData.__proto__));
        
        // Alternative logging approach that doesn't rely on forEach
        try {
            if (typeof formData.forEach === 'function') {
                formData.forEach((value, key) => {
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
        } catch (error) {
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
            images = response.data.images.map(img => ({
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

    } catch (error) {
        console.error('Error inpainting image:', error.response?.data || error.message || error);
        res.status(500).json({ 
            error: 'Failed to inpaint image',
            details: error.response?.data || error.message || error
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