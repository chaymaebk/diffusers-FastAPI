document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const generateForm = document.getElementById('generateForm');
    const inpaintForm = document.getElementById('inpaintForm');
    const promptInput = document.getElementById('prompt');
    const negativePromptInput = document.getElementById('negativePrompt');
    const stepsSlider = document.getElementById('steps');
    const cfgSlider = document.getElementById('cfgScale');
    const widthSelect = document.getElementById('width');
    const heightSelect = document.getElementById('height');
    const samplesSelect = document.getElementById('samples');
    const generateBtn = document.getElementById('generateBtn');
    const generateBtnText = document.getElementById('generateBtnText');
    const statusDiv = document.getElementById('status');
    const imageGallery = document.getElementById('imageGallery');
    const clearBtn = document.getElementById('clearBtn');
    const stepsValue = document.getElementById('stepsValue');
    const cfgValue = document.getElementById('cfgValue');

    // Mode switching elements
    const generateModeBtn = document.getElementById('generateModeBtn');
    const inpaintModeBtn = document.getElementById('inpaintModeBtn');
    const generatePanel = document.getElementById('generatePanel');
    const inpaintPanel = document.getElementById('inpaintPanel');
    const generateGallery = document.getElementById('generateGallery');
    const inpaintCanvas = document.getElementById('inpaintCanvas');

    // Inpaint elements
    const imageUpload = document.getElementById('imageUpload');
    const inpaintPrompt = document.getElementById('inpaintPrompt');
    const inpaintNegativePrompt = document.getElementById('inpaintNegativePrompt');
    const inpaintStepsSlider = document.getElementById('inpaintSteps');
    const inpaintCfgSlider = document.getElementById('inpaintCfgScale');
    const inpaintSamplesSelect = document.getElementById('inpaintSamples');
    const inpaintBtn = document.getElementById('inpaintBtn');
    const inpaintBtnText = document.getElementById('inpaintBtnText');
    const inpaintStatus = document.getElementById('inpaintStatus');
    const inpaintStepsValue = document.getElementById('inpaintStepsValue');
    const inpaintCfgValue = document.getElementById('inpaintCfgValue');

    // Canvas elements
    const canvas = document.getElementById('inpaintCanvasElement');
    const ctx = canvas.getContext('2d');
    const clearMaskBtn = document.getElementById('clearMaskBtn');
    const undoBtn = document.getElementById('undoBtn');
    const brushSizeSlider = document.getElementById('brushSize');
    const brushColorPicker = document.getElementById('brushColor');
    const brushSizeValue = document.getElementById('brushSizeValue');

    // Canvas state
    let isDrawing = false;
    let originalImage = null;
    let maskImage = null;
    let undoStack = [];
    let currentMode = 'generate';

    // Initialize canvas
    function initCanvas() {
        canvas.width = 512;
        canvas.height = 512;
        ctx.fillStyle = '#000000'; // Fill with black (no inpaint by default)
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Mode switching
    function switchMode(mode) {
        currentMode = mode;
        
        if (mode === 'generate') {
            generateModeBtn.classList.add('bg-purple-600', 'text-white');
            generateModeBtn.classList.remove('text-gray-300');
            inpaintModeBtn.classList.remove('bg-green-600', 'text-white');
            inpaintModeBtn.classList.add('text-gray-300');
            
            generatePanel.classList.remove('hidden');
            inpaintPanel.classList.add('hidden');
            generateGallery.classList.remove('hidden');
            inpaintCanvas.classList.add('hidden');
        } else {
            inpaintModeBtn.classList.add('bg-green-600', 'text-white');
            inpaintModeBtn.classList.remove('text-gray-300');
            generateModeBtn.classList.remove('bg-purple-600', 'text-white');
            generateModeBtn.classList.add('text-gray-300');
            
            inpaintPanel.classList.remove('hidden');
            generatePanel.classList.add('hidden');
            inpaintCanvas.classList.remove('hidden');
            generateGallery.classList.add('hidden');
        }
    }

    // Event listeners for mode switching
    generateModeBtn.addEventListener('click', () => switchMode('generate'));
    inpaintModeBtn.addEventListener('click', () => switchMode('inpaint'));

    // Update slider values display
    stepsSlider.addEventListener('input', function() {
        stepsValue.textContent = this.value;
    });

    cfgSlider.addEventListener('input', function() {
        cfgValue.textContent = this.value;
    });

    inpaintStepsSlider.addEventListener('input', function() {
        inpaintStepsValue.textContent = this.value;
    });

    inpaintCfgSlider.addEventListener('input', function() {
        inpaintCfgValue.textContent = this.value;
    });

    brushSizeSlider.addEventListener('input', function() {
        brushSizeValue.textContent = this.value;
    });

    // Canvas drawing functionality
    function startDrawing(e) {
        if (currentMode !== 'inpaint' || !originalImage) return;
        
        isDrawing = true;
        draw(e);
    }

    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath();
        
        // Save state for undo
        if (undoStack.length > 10) undoStack.shift();
        undoStack.push(canvas.toDataURL());
    }

    function draw(e) {
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        ctx.lineWidth = brushSizeSlider.value;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#ffffff'; // Brush color is white

        ctx.lineTo(x * scaleX, y * scaleY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x * scaleX, y * scaleY);
    }

    // Canvas event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Clear mask
    clearMaskBtn.addEventListener('click', function() {
        if (originalImage) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#000000'; // Fill with black (no inpaint by default)
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        undoStack = [];
    });

    // Undo
    undoBtn.addEventListener('click', function() {
        if (undoStack.length > 0) {
            const lastState = undoStack.pop();
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = lastState;
        }
    });

    // Image upload handling
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    
                    // Resize canvas to fit image while maintaining aspect ratio
                    const maxSize = 512;
                    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                    const newWidth = img.width * ratio;
                    const newHeight = img.height * ratio;
                    
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    
                    // Draw image on canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    // Reset undo stack
                    undoStack = [];
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Generate form submission
    generateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showError('Please enter a prompt');
            return;
        }

        setLoadingState(true);

        try {
            const formData = {
                prompt: prompt,
                negativePrompt: negativePromptInput.value.trim(),
                steps: parseInt(stepsSlider.value),
                cfgScale: parseFloat(cfgSlider.value),
                width: parseInt(widthSelect.value),
                height: parseInt(heightSelect.value),
                samples: parseInt(samplesSelect.value)
            };

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                displayImages(result.images, formData.prompt);
                showSuccess(`Generated ${result.images.length} image(s) successfully!`);
            } else {
                showError(result.error || 'Failed to generate image');
            }

        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoadingState(false);
        }
    });

    // Inpaint form submission
    inpaintForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!originalImage) {
            showError('Please upload an image first');
            return;
        }

        const prompt = inpaintPrompt.value.trim();
        if (!prompt) {
            showError('Please enter an inpaint prompt');
            return;
        }

        setInpaintLoadingState(true);

        try {
            // Create mask from canvas
            const maskCanvas = document.createElement('canvas');
            const maskCtx = maskCanvas.getContext('2d');
            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;
            
            // Get image data and create mask
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const maskData = maskCtx.createImageData(canvas.width, canvas.height);
            
            // Create mask (white = inpaint area, black = keep original)
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                // If pixel is white (user painted), make it white in mask
                if (r > 200 && g > 200 && b > 200) {
                    maskData.data[i] = 255;     // R
                    maskData.data[i + 1] = 255; // G
                    maskData.data[i + 2] = 255; // B
                    maskData.data[i + 3] = 255; // A
                } else {
                    maskData.data[i] = 0;       // R
                    maskData.data[i + 1] = 0;   // G
                    maskData.data[i + 2] = 0;   // B
                    maskData.data[i + 3] = 255; // A
                }
            }
            
            maskCtx.putImageData(maskData, 0, 0);
            
            // Convert canvases to blobs
            const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const maskBlob = await new Promise(resolve => maskCanvas.toBlob(resolve, 'image/png'));
            
            // Create form data
            const formData = new FormData();
            formData.append('image', imageBlob, 'image.png');
            formData.append('mask', maskBlob, 'mask.png');
            formData.append('prompt', prompt);
            if (inpaintNegativePrompt.value.trim()) {
                formData.append('negative_prompt', inpaintNegativePrompt.value.trim());
            }
            formData.append('cfg_scale', inpaintCfgSlider.value);
            formData.append('samples', inpaintSamplesSelect.value);
            formData.append('steps', inpaintStepsSlider.value);

            const response = await fetch('/api/inpaint-image', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                displayImages(result.images, prompt);
                showSuccess(`Inpainted ${result.images.length} image(s) successfully!`);
            } else {
                showError(result.error || 'Failed to inpaint image');
            }

        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setInpaintLoadingState(false);
        }
    });

    // Clear all images
    clearBtn.addEventListener('click', function() {
        clearImages();
    });

    // Set loading state
    function setLoadingState(loading) {
        if (loading) {
            generateBtn.disabled = true;
            generateBtnText.textContent = 'Generating...';
            statusDiv.classList.remove('hidden');
        } else {
            generateBtn.disabled = false;
            generateBtnText.textContent = 'Generate Image';
            statusDiv.classList.add('hidden');
        }
    }

    // Set inpaint loading state
    function setInpaintLoadingState(loading) {
        if (loading) {
            inpaintBtn.disabled = true;
            inpaintBtnText.textContent = 'Inpainting...';
            inpaintStatus.classList.remove('hidden');
        } else {
            inpaintBtn.disabled = false;
            inpaintBtnText.textContent = 'Inpaint Image';
            inpaintStatus.classList.add('hidden');
        }
    }

    // Display generated images
    function displayImages(images, prompt) {
        // Switch to generate mode to show images
        switchMode('generate');
        
        // Clear placeholder
        if (imageGallery.children.length === 1 && imageGallery.children[0].classList.contains('flex')) {
            imageGallery.innerHTML = '';
        }

        images.forEach((image, index) => {
            const imageCard = createImageCard(image, prompt, index);
            imageGallery.appendChild(imageCard);
        });

        // Show clear button if we have images
        if (images.length > 0) {
            clearBtn.style.display = 'block';
        }

        // Add success animation
        const newCards = imageGallery.querySelectorAll('.image-card');
        newCards.forEach(card => {
            card.classList.add('success-animation');
        });
    }

    // Create image card
    function createImageCard(image, prompt, index) {
        const card = document.createElement('div');
        card.className = 'image-card bg-white/5 rounded-lg overflow-hidden border border-white/20 relative';
        
        card.innerHTML = `
            <div class="image-container relative group">
                <img src="${image.base64}" alt="Generated image ${index + 1}" class="w-full h-auto">
                <button class="download-btn" onclick="downloadImage('${image.base64}', '${prompt.replace(/[^a-zA-Z0-9]/g, '_')}_${index + 1}')">
                    <i class="fas fa-download"></i>
                </button>
            </div>
            <div class="p-4">
                <p class="text-sm text-gray-300 mb-2 line-clamp-2">${prompt}</p>
                <div class="flex justify-between items-center text-xs text-gray-400">
                    <span>Seed: ${image.seed}</span>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        `;

        return card;
    }

    // Clear all images
    function clearImages() {
        imageGallery.innerHTML = `
            <div class="flex items-center justify-center h-64 bg-white/5 rounded-lg border-2 border-dashed border-white/20">
                <div class="text-center text-gray-400">
                    <i class="fas fa-image text-4xl mb-4"></i>
                    <p>Your generated images will appear here</p>
                </div>
            </div>
        `;
        clearBtn.style.display = 'none';
    }

    // Show success message
    function showSuccess(message) {
        showNotification(message, 'success');
    }

    // Show error message
    function showError(message) {
        showNotification(message, 'error');
    }

    // Show notification
    function showNotification(message, type) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white ${type === 'error' ? 'shake' : ''}`;

        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Download image function (global scope)
    window.downloadImage = function(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Initialize
    initCanvas();
    checkApiHealth();
});

// Check API health
async function checkApiHealth() {
    try {
        const response = await fetch('/api/health');
        const result = await response.json();
        
        if (!result.apiKeyConfigured) {
            showNotification('⚠️ Stability AI API key not configured. Please set STABILITY_API_KEY in your .env file.', 'warning');
        }
    } catch (error) {
        console.error('Health check failed:', error);
    }
}

// Show notification function (global scope)
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    } text-white`;

    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 8 seconds for warnings
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, type === 'warning' ? 8000 : 5000);
} 