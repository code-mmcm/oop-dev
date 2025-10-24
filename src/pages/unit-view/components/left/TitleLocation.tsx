import React from 'react';
import ShareModal from './TitleComponent/ShareModal';

interface TitleLocationProps {
  title: string;
  location: string;
  imageUrls: string[];
}

export const TitleLocationSkeleton: React.FC = () => (
  <div className="mb-6 mt-8">
    <div className="h-10 bg-gray-300 rounded w-3/4 mb-3 animate-pulse"></div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-300 rounded w-24 animate-pulse"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
        <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
        <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);


const TitleLocation: React.FC<TitleLocationProps> = ({ title, location, imageUrls }) => {
  // Local state for showing the share modal (if needed)
  const [showShareModal, setShowShareModal] = React.useState(false);

  // Local handleShare function
  const handleShare = () => {
    setShowShareModal(true);
    // You can add more logic here, e.g. open a modal, copy link, etc.
  };

  return (
    <div className={`mb-6 ${imageUrls.length > 0 ? 'mt-5' : 'mt-8'}`}>
      <h1 className="text-3xl font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>{title}</h1>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="text-base" style={{fontFamily: 'Poppins'}}>{location}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShare}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Share this property"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16,6 12,2 8,6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
      {/* ShareModal integration */}
      <ShareModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCopyLink={() => {}}
        isLinkCopied={false}
        shareUrl={window.location.href}
        onFacebookShare={() => {}}
        onTwitterShare={() => {}}
        onWhatsAppShare={() => {}}
        onEmailShare={() => {}}
      />
    </div>
  );
};

export default TitleLocation;
