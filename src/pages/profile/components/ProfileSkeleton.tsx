import React from 'react';

const ProfileSkeleton: React.FC = () => (
  <>
    {/* Top profile header skeleton */}
    <div className="bg-white rounded-xl shadow border border-gray-200 px-4 sm:px-5 py-6 sm:py-7 mb-4 sm:mb-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-300 animate-pulse"></div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 rounded animate-pulse w-48"></div>
              <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
            </div>
            <div className="h-8 bg-gray-300 rounded animate-pulse w-24"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-300 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Main content skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Left column skeleton */}
      <div className="lg:col-span-2 space-y-4">
        {/* Personal information card skeleton */}
        <div className="bg-white rounded-xl shadow border border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
            <div className="h-5 bg-gray-300 rounded animate-pulse w-48"></div>
            <div className="h-6 bg-gray-300 rounded animate-pulse w-16"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-5 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
                <div className="h-3 bg-gray-300 rounded animate-pulse w-20"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Previous bookings skeleton */}
        <div className="bg-white rounded-xl shadow border border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
            <div className="h-5 bg-gray-300 rounded animate-pulse w-40"></div>
            <div className="h-6 bg-gray-300 rounded animate-pulse w-24"></div>
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-20 h-14 sm:w-24 sm:h-16 bg-gray-300 rounded-md animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded animate-pulse w-40"></div>
                    <div className="h-3 bg-gray-300 rounded animate-pulse w-32"></div>
                    <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-300 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column skeleton */}
      <div className="space-y-4">
        {/* Contact information card skeleton */}
        <div className="bg-white rounded-xl shadow border border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
            <div className="h-5 bg-gray-300 rounded animate-pulse w-40"></div>
            <div className="h-6 bg-gray-300 rounded animate-pulse w-16"></div>
          </div>
          <div className="px-4 sm:px-5 py-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-48"></div>
                <div className="h-3 bg-gray-300 rounded animate-pulse w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);

export default ProfileSkeleton;
