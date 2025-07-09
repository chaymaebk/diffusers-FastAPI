import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface GeneratedImage {
  base64: string;
  seed: number;
}

interface InpaintCanvasProps {
  onImagesGenerated: (images: GeneratedImage[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function InpaintCanvas({ onImagesGenerated, isLoading, setIsLoading }: InpaintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  
  // Form states
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7);
  const [samples, setSamples] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

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
        setUndoStack([]);
      };
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!originalImage) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    
    // Save state for undo
    const newUndoStack = [...undoStack];
    if (newUndoStack.length > 10) newUndoStack.shift();
    newUndoStack.push(canvas.toDataURL());
    setUndoStack(newUndoStack);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';

    ctx.lineTo(x * scaleX, y * scaleY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x * scaleX, y * scaleY);
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx || !originalImage) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    setUndoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newUndoStack = [...undoStack];
    const lastState = newUndoStack.pop();
    setUndoStack(newUndoStack);
    
    if (lastState) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = lastState;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalImage) {
      showNotification('Please upload an image first', 'error');
      return;
    }

    if (!prompt.trim()) {
      showNotification('Please enter an inpaint prompt', 'error');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create mask from canvas
      const maskCanvas = document.createElement('canvas');
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return;
      
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
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
      const imageBlob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((blob) => resolve(blob!), 'image/png')
      );
      const maskBlob = await new Promise<Blob>((resolve) => 
        maskCanvas.toBlob((blob) => resolve(blob!), 'image/png')
      );
      
      // Create form data
      const formData = new FormData();
      formData.append('image', imageBlob, 'image.png');
      formData.append('mask', maskBlob, 'mask.png');
      formData.append('prompt', prompt.trim());
      if (negativePrompt.trim()) {
        formData.append('negative_prompt', negativePrompt.trim());
      }
      formData.append('cfg_scale', cfgScale.toString());
      formData.append('samples', samples.toString());
      formData.append('steps', steps.toString());

      const response = await axios.post('/api/inpaint-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;

      if (result.success) {
        onImagesGenerated(result.images);
        showNotification(`Inpainted ${result.images.length} image(s) successfully!`, 'success');
      } else {
        showNotification(result.error || 'Failed to inpaint image', 'error');
      }

    } catch (error: any) {
      console.error('Error:', error);
      showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Canvas Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fas fa-paint-brush mr-3 text-green-400"></i>
          Inpaint Canvas
        </h2>

        {/* Image Upload */}
        <div className="mb-4">
          <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-300 mb-2">
            Upload Image
          </label>
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>

        {/* Canvas */}
        <div className="mb-4">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="border border-white/20 rounded-lg cursor-crosshair max-w-full h-auto"
            style={{ backgroundColor: '#000' }}
          />
        </div>

        {/* Canvas Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="brushSize" className="block text-sm font-medium text-gray-300 mb-2">
              Brush Size: {brushSize}px
            </label>
            <input
              type="range"
              id="brushSize"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={clearMask}
            className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <i className="fas fa-eraser"></i>
            <span>Clear Mask</span>
          </button>

          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 text-blue-200 disabled:text-gray-400 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <i className="fas fa-undo"></i>
            <span>Undo</span>
          </button>
        </div>
      </div>

      {/* Inpaint Form */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Inpaint Settings</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prompt */}
          <div>
            <label htmlFor="inpaintPrompt" className="block text-sm font-medium text-gray-300 mb-2">
              Inpaint Prompt *
            </label>
            <textarea
              id="inpaintPrompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what should replace the masked areas..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
              required
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label htmlFor="inpaintNegativePrompt" className="block text-sm font-medium text-gray-300 mb-2">
              Negative Prompt (Optional)
            </label>
            <textarea
              id="inpaintNegativePrompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What you don't want in the inpainted areas..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="inpaintSteps" className="block text-sm font-medium text-gray-300 mb-2">
                Steps: {steps}
              </label>
              <input
                type="range"
                id="inpaintSteps"
                min="10"
                max="50"
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label htmlFor="inpaintCfgScale" className="block text-sm font-medium text-gray-300 mb-2">
                CFG Scale: {cfgScale}
              </label>
              <input
                type="range"
                id="inpaintCfgScale"
                min="1"
                max="20"
                step="0.5"
                value={cfgScale}
                onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label htmlFor="inpaintSamples" className="block text-sm font-medium text-gray-300 mb-2">
                Images
              </label>
              <select
                id="inpaintSamples"
                value={samples}
                onChange={(e) => setSamples(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={1}>1 Image</option>
                <option value={2}>2 Images</option>
                <option value={3}>3 Images</option>
                <option value={4}>4 Images</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !originalImage}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105 disabled:scale-100"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Inpainting...</span>
              </>
            ) : (
              <>
                <i className="fas fa-paint-brush"></i>
                <span>Inpaint Image</span>
              </>
            )}
          </button>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              {success}
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 