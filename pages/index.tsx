import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import ImageGenerator from '../components/ImageGenerator';
import InpaintCanvas from '../components/InpaintCanvas';
import EraseCanvas from '../components/EraseCanvas';
import ImageGallery from '../components/ImageGallery';

interface GeneratedImage {
  base64: string;
  seed: number;
}

export default function Home() {
  const [currentMode, setCurrentMode] = useState<'generate' | 'inpaint' | 'erase'>('generate');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleImagesGenerated = (newImages: GeneratedImage[]) => {
    setImages(prev => [...newImages, ...prev]);
    setCurrentMode('generate'); // Switch to generate mode to show images
  };

  const clearImages = () => {
    setImages([]);
  };

  return (
    <>
      <Head>
        <title>AI Image Generator - Stability AI</title>
        <meta name="description" content="Generate and edit images using Stability AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-black/20"></div>
        <div className="fixed inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10"></div>
        
        {/* Floating orbs */}
        <div className="fixed top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="fixed bottom-20 right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="fixed top-1/2 left-1/3 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>

        <div className="relative z-10">
          {/* Header */}
          <header className="text-center py-8 px-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              AI Image Generator
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create stunning images with Stability AI's advanced text-to-image and inpainting technology
            </p>
          </header>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
              <button
                onClick={() => setCurrentMode('generate')}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  currentMode === 'generate'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <i className="fas fa-magic mr-2"></i>
                Generate
              </button>
              <button
                onClick={() => setCurrentMode('inpaint')}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  currentMode === 'inpaint'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <i className="fas fa-paint-brush mr-2"></i>
                Inpaint
              </button>
              <button
                onClick={() => setCurrentMode('erase')}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  currentMode === 'erase'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <i className="fas fa-eraser mr-2"></i>
                Erase
              </button>
            </div>
          </div>

          <div className="container mx-auto px-4 pb-12">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Panel - Controls */}
              <div className="space-y-6">
                {currentMode === 'generate' ? (
                  <ImageGenerator 
                    onImagesGenerated={handleImagesGenerated}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                ) : currentMode === 'inpaint' ? (
                  <InpaintCanvas 
                    onImagesGenerated={handleImagesGenerated}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                ) : (
                  <EraseCanvas 
                    onImagesGenerated={handleImagesGenerated}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                )}
              </div>

              {/* Right Panel - Gallery */}
              <div className="space-y-6">
                {currentMode === 'generate' && (
                  <ImageGallery 
                    images={images}
                    onClear={clearImages}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 