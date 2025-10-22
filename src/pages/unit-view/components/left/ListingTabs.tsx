import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ...existing code...
interface ListingTabsProps {
  amenities?: string[];
  longitude?: number;
  latitude?: number;
  defaultShow?: boolean;
}

const ListingTabs: React.FC<ListingTabsProps> = ({ amenities = [], defaultShow = true, latitude, longitude }) => {
  // ensure this runs only in the browser and avoid require() on images
  useEffect(() => {
    if (typeof window === 'undefined') return;
    

    L.Icon.Default.mergeOptions({
      // CDN URLs avoid bundler require() problems
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  const isClient = typeof window !== 'undefined';
  const hasCoords = latitude != null && longitude != null;
  const selectedPosition: [number, number] | null = hasCoords ? [latitude as number, longitude as number] : null;
  const fallback: [number, number] = [14.5995, 120.9842];

  // default to Location tab when listing has coordinates
  const [activeTab, setActiveTab] = useState<'amenities' | 'management' | 'location'>(
    hasCoords ? 'location' : (defaultShow ? 'amenities' : 'management')
  );

  return (
    <>
      <div className="mt-15">
        <div className="inline-grid grid-flow-col auto-cols-auto items-center gap-x-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('amenities')}
              className="text-lg text-black"
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
              aria-controls="amenities-grid"
              aria-pressed={activeTab === 'amenities'}
            >
              Amenities
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setActiveTab('management')}
              className="text-lg text-black"
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
              aria-controls="management-section"
              aria-pressed={activeTab === 'management'}
            >
              Management
            </button>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('location')}
              className="text-lg text-black"
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
              aria-controls="MapSection"
              aria-pressed={activeTab === 'location'}
            >
              Location
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-black mt-2" />

      {activeTab === 'amenities' && amenities && amenities.length > 0 && (
        <div id="amenities-grid" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {amenities.map((amenity, i) => (
              <div key={i} className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                {amenity}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'management' && (
        <div id="management-section" className="mt-4">
          <p className="text-gray-500 mt-2">Management details not provided.</p>
        </div>
      )}

      {activeTab === 'location' && (
        <div id="MapSection" className="mt-4">
          <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden relative z-0 mt-2">
            {isClient ? (
              <MapContainer
                center={selectedPosition || fallback}
                zoom={selectedPosition ? 15 : 13}
                style={{ height: '100%', width: '100%' }}
                key={selectedPosition ? 'selected' : 'default'}
                zoomControl={false}
                dragging={false}
                doubleClickZoom={false}
                scrollWheelZoom={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedPosition && <Marker position={selectedPosition} />}
              </MapContainer>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default ListingTabs;