interface GeneratedImage {
  base64: string;
  seed: number;
}

interface ImageGalleryProps {
  images: GeneratedImage[];
  onClear: () => void;
}

export default function ImageGallery({ images, onClear }: ImageGalleryProps) {
  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (images.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <i className="fas fa-image text-4xl mb-4"></i>
            <p>Your generated images will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-images mr-3 text-blue-400"></i>
          Generated Images ({images.length})
        </h2>
        <button
          onClick={onClear}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <i className="fas fa-trash"></i>
          <span>Clear All</span>
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {images.map((image, index) => (
          <div
            key={`${image.seed}-${index}`}
            className="bg-white/5 rounded-lg overflow-hidden border border-white/10 group hover:border-white/30 transition-all duration-300"
          >
            <div className="relative">
              <img
                src={image.base64}
                alt={`Generated image ${index + 1}`}
                className="w-full h-auto"
              />
              <button
                onClick={() => downloadImage(image.base64, `generated_image_${image.seed}`)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                title="Download image"
              >
                <i className="fas fa-download"></i>
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Seed: {image.seed}</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
} 