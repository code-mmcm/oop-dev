import React from 'react';

interface PropertyDetailsTableProps {
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  propertyType: string;
}

export const PropertyDetailsTableSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-gray-200 rounded-xl overflow-hidden mb-8">
    {[1,2,3,4].map((i) => (
      <div key={i} className="p-6 border-r border-gray-200">
        <div className="h-4 bg-gray-300 rounded w-16 mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-300 rounded w-8 animate-pulse"></div>
      </div>
    ))}
  </div>
);

const PropertyDetailsTable: React.FC<PropertyDetailsTableProps> = ({ bedrooms, bathrooms, squareFeet, propertyType }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-gray-200 rounded-xl overflow-hidden mb-8">
    <div className="p-3 border-r border-gray-200">
      <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Bedroom</p>
      <p className="text-xl text-center font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>{bedrooms}</p>
    </div>
    <div className="p-3 border-r border-gray-200">
      <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Bathroom</p>
      <p className="text-xl text-center font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>{bathrooms}</p>
    </div>
    <div className="col-span-2 md:hidden border-t border-gray-200 mx-3"></div>
    <div className="p-3 border-r border-gray-200">
      <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Area</p>
      <p className="text-xl text-center font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>{squareFeet ? `${squareFeet} sqft` : 'N/A'}</p>
    </div>
    <div className="p-3">
      <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Type</p>
      <p className="text-xl text-center font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>{propertyType}</p>
    </div>
  </div>
);

export default PropertyDetailsTable;
