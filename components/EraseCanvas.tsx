import { useRef, useState, useEffect } from 'react';
import axios from 'axios';

interface GeneratedImage {
  base64: string;
  seed: number;
}

interface EraseCanvasProps {
  onImagesGenerated: (images: GeneratedImage[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function EraseCanvas({ onImagesGenerated, isLoading, setIsLoading }: EraseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
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

  const saveState = () => {
    const overlay = overlayRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, overlay.width, overlay.height);
        setUndoStack(prev => [...prev.slice(-9), imageData]); // Keep last 10 states
      }
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const overlay = overlayRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) {
          const previousState = undoStack[undoStack.length - 1];
          ctx.putImageData(previousState, 0, 0);
          setUndoStack(prev => prev.slice(0, -1));
        }
      }
    }
  };

  const clearCanvas = () => {
    const overlay = overlayRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) {
        saveState();
        ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setBaseImage(img);
      
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      
      if (canvas && overlay) {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        overlay.width = img.width;
        overlay.height = img.height;
        
        // Draw base image
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        
        // Clear overlay
        const overlayCtx = overlay.getContext('2d');
        if (overlayCtx) {
          overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        }
        
        // Clear undo stack
        setUndoStack([]);
      }
    };
    
    img.src = URL.createObjectURL(file);
  };

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    saveState();
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const overlay = overlayRef.current;
    if (!overlay) return;
    
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    
    const pos = getEventPos(e);
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Red for areas to erase
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleErase = async () => {
    if (!baseImage) {
      showNotification('Please upload an image first', 'error');
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) {
      showNotification('Canvas not available', 'error');
      return;
    }

    // Check if there's any mask drawn
    const overlayCtx = overlay.getContext('2d');
    if (!overlayCtx) return;
    
    const imageData = overlayCtx.getImageData(0, 0, overlay.width, overlay.height);
    const hasDrawing = imageData.data.some((value, index) => index % 4 === 3 && value > 0);
    
    if (!hasDrawing) {
      showNotification('Please paint over the objects you want to remove', 'error');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert base image to blob
      const baseCanvas = canvasRef.current;
      if (!baseCanvas) return;
      
      const baseBlob = await new Promise<Blob>((resolve) => {
        baseCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Create mask canvas (white areas to erase, black to keep)
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = overlay.width;
      maskCanvas.height = overlay.height;
      const maskCtx = maskCanvas.getContext('2d');
      
      if (maskCtx) {
        // Fill with black (keep areas)
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // Get overlay image data and convert red areas to white
        const overlayImageData = overlayCtx.getImageData(0, 0, overlay.width, overlay.height);
        const maskImageData = maskCtx.createImageData(overlay.width, overlay.height);
        
        for (let i = 0; i < overlayImageData.data.length; i += 4) {
          const alpha = overlayImageData.data[i + 3];
          if (alpha > 0) {
            // Red area in overlay -> white in mask (erase)
            maskImageData.data[i] = 255;     // R
            maskImageData.data[i + 1] = 255; // G
            maskImageData.data[i + 2] = 255; // B
            maskImageData.data[i + 3] = 255; // A
          } else {
            // No overlay -> black in mask (keep)
            maskImageData.data[i] = 0;       // R
            maskImageData.data[i + 1] = 0;   // G
            maskImageData.data[i + 2] = 0;   // B
            maskImageData.data[i + 3] = 255; // A
          }
        }
        
        maskCtx.putImageData(maskImageData, 0, 0);
      }

      const maskBlob = await new Promise<Blob>((resolve) => {
        maskCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Prepare form data
      const formData = new FormData();
      formData.append('image', baseBlob);
      formData.append('mask', maskBlob);

      const response = await axios.post('/api/erase-objects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;

      if (result.success) {
        onImagesGenerated([result.image]);
        showNotification('Objects erased successfully!', 'success');
        
        // Clear the overlay after successful erase
        clearCanvas();
      } else {
        showNotification(result.error || 'Failed to erase objects', 'error');
      }

    } catch (error: any) {
      console.error('Error:', error);
      showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <i className="fas fa-eraser mr-3 text-red-400"></i>
        Object Eraser
      </h2>

      {/* Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Upload Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-gray-400 text-sm mt-2">
          Upload an image and paint over objects you want to remove
        </p>
      </div>

      {/* Canvas Section */}
      {baseImage && (
        <div className="mb-6">
          <div className="relative border-2 border-white/20 rounded-lg overflow-hidden bg-gray-900 max-w-full">
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 max-w-full h-auto"
              style={{ maxHeight: '400px' }}
            />
            <canvas
              ref={overlayRef}
              className="absolute top-0 left-0 cursor-crosshair max-w-full h-auto"
              style={{ maxHeight: '400px' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      {baseImage && (
        <div className="space-y-4 mb-6">
          {/* Brush Size */}
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
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <i className="fas fa-undo mr-2"></i>
              Undo
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <i className="fas fa-trash mr-2"></i>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Erase Button */}
      <button
        onClick={handleErase}
        disabled={isLoading || !baseImage}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Erasing objects...
          </>
        ) : (
          <>
            <i className="fas fa-eraser mr-2"></i>
            Erase Objects
          </>
        )}
      </button>

      {/* Notifications */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-200 text-sm">{success}</p>
        </div>
      )}
    </div>
  );
} 