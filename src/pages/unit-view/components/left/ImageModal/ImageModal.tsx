import React from 'react';

interface ImageModalProps {
  show: boolean;
  imageUrl: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  isTransitioning?: boolean;
  currentIndex?: number;
  totalImages?: number;
}

const ImageModal: React.FC<ImageModalProps> = ({
  show,
  imageUrl,
  onClose,
  onPrev,
  onNext,
  isTransitioning = false,
  currentIndex,
  totalImages,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Previous Button */}
        {onPrev && totalImages && totalImages > 1 && (
          <button 
            onClick={onPrev}
            disabled={isTransitioning}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-200 z-10 p-2 rounded-full hover:bg-white/10 ${
              isTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
        )}

        {/* Next Button */}
        {onNext && totalImages && totalImages > 1 && (
          <button 
            onClick={onNext}
            disabled={isTransitioning}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-200 z-10 p-2 rounded-full hover:bg-white/10 ${
              isTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
            }`}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        )}

        {/* Image */}
        <div className="w-full h-full flex items-center justify-center p-8">
          <img 
            src={imageUrl} 
            className={`max-w-full max-h-full object-contain rounded-lg transition-all duration-300 ease-in-out ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
            alt={`Property image ${currentIndex ? currentIndex + 1 : ''}`}
            style={{maxWidth: '90vw', maxHeight: '90vh'}}
          />
        </div>

        {/* Image Counter */}
        {typeof currentIndex === 'number' && typeof totalImages === 'number' && totalImages > 1 && (
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full transition-all duration-300 ${
            isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          }`}>
            {currentIndex + 1} / {totalImages}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
