import React, { useState, useEffect } from 'react';

const AdPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after a short delay on every visit
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Popup Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative animate-scale-in">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 z-10"
            aria-label="Close advertisement"
          >
            <svg 
              className="w-5 h-5 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>

          {/* Advertisement Image */}
          <div className="relative">
            <img
              src="/images/offer_poster.jpg" // Use your ad poster image
              alt="Special Advertisement"
              className="w-full max-w-lg md:max-w-xl lg:max-w-2xl rounded-2xl shadow-2xl animate-slide-in-up"
            />
            
            {/* Optional: Add a subtle overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdPopup; 