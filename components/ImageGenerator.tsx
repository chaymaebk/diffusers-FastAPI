import { useState } from 'react';
import axios from 'axios';

interface GeneratedImage {
  base64: string;
  seed: number;
}

interface ImageGeneratorProps {
  onImagesGenerated: (images: GeneratedImage[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ImageGenerator({ onImagesGenerated, isLoading, setIsLoading }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      showNotification('Please enter a prompt', 'error');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = {
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim(),
        steps: parseInt(steps.toString()),
        cfgScale: parseFloat(cfgScale.toString()),
        width: parseInt(width.toString()),
        height: parseInt(height.toString()),
        samples: parseInt(samples.toString())
      };

      const response = await axios.post('/api/generate-image', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      if (result.success) {
        onImagesGenerated(result.images);
        showNotification(`Generated ${result.images.length} image(s) successfully!`, 'success');
      } else {
        showNotification(result.error || 'Failed to generate image', 'error');
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
        <i className="fas fa-magic mr-3 text-purple-400"></i>
        Generate Image
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
            Prompt *
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
            required
          />
        </div>

        {/* Negative Prompt */}
        <div>
          <label htmlFor="negativePrompt" className="block text-sm font-medium text-gray-300 mb-2">
            Negative Prompt (Optional)
          </label>
          <textarea
            id="negativePrompt"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What you don't want in the image..."
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Steps */}
          <div>
            <label htmlFor="steps" className="block text-sm font-medium text-gray-300 mb-2">
              Steps: {steps}
            </label>
            <input
              type="range"
              id="steps"
              min="10"
              max="50"
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10</span>
              <span>50</span>
            </div>
          </div>

          {/* CFG Scale */}
          <div>
            <label htmlFor="cfgScale" className="block text-sm font-medium text-gray-300 mb-2">
              CFG Scale: {cfgScale}
            </label>
            <input
              type="range"
              id="cfgScale"
              min="1"
              max="20"
              step="0.5"
              value={cfgScale}
              onChange={(e) => setCfgScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-300 mb-2">
              Width
            </label>
            <select
              id="width"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={1024}>1024px</option>
              <option value={1152}>1152px</option>
              <option value={1344}>1344px</option>
            </select>
          </div>

          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">
              Height
            </label>
            <select
              id="height"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={1024}>1024px</option>
              <option value={1152}>1152px</option>
              <option value={1344}>1344px</option>
            </select>
          </div>

          {/* Samples */}
          <div className="md:col-span-2">
            <label htmlFor="samples" className="block text-sm font-medium text-gray-300 mb-2">
              Number of Images
            </label>
            <select
              id="samples"
              value={samples}
              onChange={(e) => setSamples(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={1}>1 Image</option>
              <option value={2}>2 Images</option>
              <option value={3}>3 Images</option>
              <option value={4}>4 Images</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105 disabled:scale-100"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <i className="fas fa-magic"></i>
              <span>Generate Image</span>
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
  );
} 