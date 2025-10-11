import React, { useState } from 'react';
import ImageModal from './ImageModal/ImageModal';

interface ImageGalleryProps {
  mainImageUrl: string;
  imageUrls: string[];
  onImageClick: (index: number) => void;
}

export const ImageGallerySkeleton: React.FC = () => (
  <div className="mb-8">
    <div className="w-full h-75 bg-gray-300 rounded-lg animate-pulse"></div>
  </div>
);

const ImageGallery: React.FC<ImageGalleryProps> = ({ mainImageUrl, imageUrls, onImageClick }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);

  const allImages = [mainImageUrl || '/avida.jpg', ...imageUrls];

  const handleOpenModal = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const handleCloseModal = () => {
    setShowImageModal(false);
  };

  const handleNextImage = () => {
    if (isImageTransitioning) return;
    setIsImageTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      setIsImageTransitioning(false);
    }, 150);
  };

  const handlePrevImage = () => {
    if (isImageTransitioning) return;
    setIsImageTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      setIsImageTransitioning(false);
    }, 150);
  };

  if (!mainImageUrl && imageUrls.length === 0) {
    return <ImageGallerySkeleton />;
  }
  return (
    <div className="mb-1">
      {imageUrls.length > 0 ? (
        imageUrls.length >= 2 ? (
          <div className="grid grid-cols-3 gap-3 h-75">
            <div className="col-span-2 h-full w-full cursor-pointer overflow-hidden" onClick={() => handleOpenModal(0)}>
              <img 
                src={mainImageUrl || '/avida.jpg'} 
                className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity" 
                style={{aspectRatio: '16/9', maxHeight: '100%'}}
                alt="main" 
              />
            </div>
            <div className="col-span-1 flex flex-col gap-3">
              {imageUrls.slice(0, 2).map((imageUrl, index) => (
                <div key={index} className="cursor-pointer" onClick={() => handleOpenModal(index + 1)}>
                  <img 
                    src={imageUrl} 
                    className="h-36 w-full object-cover rounded-lg hover:opacity-90 transition-opacity" 
                    alt={`additional ${index + 1}`} 
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 h-75">
            <div className="col-span-1 h-full w-full cursor-pointer overflow-hidden flex items-center justify-center" onClick={() => handleOpenModal(0)}>
              <img
                src={mainImageUrl || '/avida.jpg'}
                className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                style={{aspectRatio: '16/9', maxHeight: '100%'}}
                alt="main"
              />
            </div>
            <div className="col-span-1 h-full w-full cursor-pointer overflow-hidden flex items-center justify-center" onClick={() => handleOpenModal(0)}>
              <img
                src={mainImageUrl || '/avida.jpg'}
                className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                style={{aspectRatio: '16/9', maxHeight: '100%'}}
                alt="main"
              />
            </div>
          </div>
        )
      ) : (
        <div className="h-75 w-full flex justify-center cursor-pointer" onClick={() => handleOpenModal(0)}>
          <img 
            src={mainImageUrl || '/avida.jpg'} 
            className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity"
            style={{aspectRatio: '16/9', maxHeight: '100%'}}
            alt="main" 
          />
        </div>
      )}
      <ImageModal
        show={showImageModal}
        imageUrl={allImages[currentImageIndex]}
        onClose={handleCloseModal}
        onPrev={allImages.length > 1 ? handlePrevImage : undefined}
        onNext={allImages.length > 1 ? handleNextImage : undefined}
        isTransitioning={isImageTransitioning}
        currentIndex={currentImageIndex}
        totalImages={allImages.length}
      />
    </div>
  );
};

export default ImageGallery;
