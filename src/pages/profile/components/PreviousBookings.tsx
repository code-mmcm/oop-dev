import React from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  onMostRecent: () => void;
};

const PreviousBookings: React.FC<Props> = ({ onMostRecent }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <h2 className="text-base sm:text-lg text-black" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Previous Bookings</h2>
        <button onClick={onMostRecent} className="text-xs sm:text-sm px-3 py-1 rounded-md text-black bg-gray-100" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>Most Recent</button>
      </div>
      <div className="divide-y divide-gray-100">
        {[1,2,3].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <img src="/avida.jpg" alt="listing" className="w-20 h-14 sm:w-24 sm:h-16 object-cover rounded-md" />
              <div>
                <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>Apartment complex in Davao</p>
                <p className="text-xs sm:text-[11px] text-gray-500 -mt-0.5" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Matina, Davao City</p>
                <p className="text-sm sm:text-base text-black mt-1" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>₱4,320 <span className="text-gray-500 text-xs sm:text-sm" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>per night</span></p>
              </div>
            </div>
            <button onClick={() => navigate('/unit')} className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-gray-100 w-full sm:w-auto" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousBookings;
