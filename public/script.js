document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const generateForm = document.getElementById('generateForm');
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

    // Update slider values display
    stepsSlider.addEventListener('input', function() {
        stepsValue.textContent = this.value;
    });

    cfgSlider.addEventListener('input', function() {
        cfgValue.textContent = this.value;
    });

    // Form submission
    generateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showError('Please enter a prompt');
            return;
        }

        // Show loading state
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

    // Display generated images
    function displayImages(images, prompt) {
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

    // Check API health on load
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