import React from 'react';

interface DescriptionSectionProps {
  description?: string;
}

export const DescriptionSectionSkeleton: React.FC = () => (
  <div>
    <div className="h-6 bg-gray-300 rounded w-24 mb-3 animate-pulse"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
      <div className="h-4 bg-gray-300 rounded w-5/6 animate-pulse"></div>
      <div className="h-4 bg-gray-300 rounded w-4/6 animate-pulse"></div>
    </div>
  </div>
);

const DescriptionSection: React.FC<DescriptionSectionProps> = ({ description }) => (
  <div>
    <h2 className="text-lg font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Description</h2>
    <p className="text-base text-gray-600 mb-3" style={{fontFamily: 'Poppins'}}>
      {description || 'No description available for this property.'}
    </p>
    {description && description.length > 200 && (
      <button className="text-base text-black font-semibold hover:underline" style={{fontFamily: 'Poppins', fontWeight: 600}}>
        Show More
      </button>
    )}
  </div>
);

export default DescriptionSection;
