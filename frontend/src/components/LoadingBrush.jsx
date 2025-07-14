import React from 'react';
import brushImg from '../assets/makeup-brush-cosmetics-png-favpng-RYQexmrg0UwvBFxykmpRLiac5-removebg-preview.png';

const sprinkles = [
  // Each sprinkle has a unique direction and delay
  { color: 'bg-pink-300', size: 22, delay: '0.1s', x: 0, y: 0, anim: 'sprinkle-pop-1' },
  { color: 'bg-pink-400', size: 16, delay: '0.3s', x: 10, y: 8, anim: 'sprinkle-pop-2' },
  { color: 'bg-pink-200', size: 14, delay: '0.5s', x: -12, y: 12, anim: 'sprinkle-pop-3' },
  { color: 'bg-pink-400', size: 18, delay: '0.7s', x: 18, y: -6, anim: 'sprinkle-pop-4' },
  { color: 'bg-pink-300', size: 12, delay: '0.9s', x: -16, y: -10, anim: 'sprinkle-pop-5' },
  { color: 'bg-pink-200', size: 15, delay: '0.6s', x: 20, y: 16, anim: 'sprinkle-pop-6' },
  { color: 'bg-pink-300', size: 13, delay: '0.8s', x: -20, y: 18, anim: 'sprinkle-pop-7' },
];

const LoadingBrush = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-pink-600">
      {/* Sweep Animation Container */}
      <div className="relative mb-8 w-40 h-40 flex items-center justify-center">
        {/* Makeup Brush Image with Sweep Animation */}
        <div
          className="absolute"
          style={{
            animation: 'brush-sweep 1.6s cubic-bezier(0.68,-0.55,0.27,1.55) infinite',
            width: '120px',
            height: '150px',
            left: '50%',
            top: '30px',
            transform: 'translateX(-50%)',
            zIndex: 2,
          }}
        >
          <img
            src={brushImg}
            alt="Makeup Brush"
            className="w-full h-full object-contain drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
          />
          {/* Pink Sprinkles (Powder Burst at Brush Tip, random directions) */}
          <div className="absolute" style={{ left: '60%', top: '18%', zIndex: 3 }}>
            {sprinkles.map((s, i) => (
              <span
                key={i}
                className={`absolute ${s.color} rounded-full`}
                style={{
                  width: s.size,
                  height: s.size,
                  left: s.x,
                  top: s.y,
                  animation: `${s.anim} 1.6s ${s.delay} infinite`,
                }}
              ></span>
            ))}
          </div>
        </div>
        {/* Powder Burst Pulse (background) */}
        <div className="absolute left-1/2 top-16 transform -translate-x-1/2">
          <div
            className="w-32 h-32 rounded-full bg-pink-300 opacity-30 blur-2xl animate-pulse"
            style={{ animationDuration: '1.6s' }}
          ></div>
        </div>
      </div>
      {/* Loading Text */}
      <div className="text-center">
        {/* (Text removed as per your last change) */}
        <div className="flex justify-center items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-pink-200 rounded-full opacity-50 animate-pulse"></div>
      <div className="absolute top-20 right-20 w-3 h-3 bg-purple-200 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-20 left-20 w-2 h-2 bg-yellow-200 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-10 right-10 w-3 h-3 bg-pink-200 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      {/* Keyframes for brush sweep and random sprinkles */}
      <style>{`
        @keyframes brush-sweep {
          0% {
            transform: translateX(-50%) rotate(-18deg) scale(1);
          }
          20% {
            transform: translateX(-80%) rotate(-12deg) scale(1.05);
          }
          50% {
            transform: translateX(-20%) rotate(12deg) scale(1.08);
          }
          80% {
            transform: translateX(-80%) rotate(-12deg) scale(1.05);
          }
          100% {
            transform: translateX(-50%) rotate(-18deg) scale(1);
          }
        }
        @keyframes sprinkle-pop-1 {
          0%, 100% { opacity: 0; transform: scale(0.5) translate(0,0); }
          30% { opacity: 1; transform: scale(1.1) translate(-10px, -30px); }
          60% { opacity: 0.7; transform: scale(0.9) translate(-18px, -50px); }
          80% { opacity: 0; transform: scale(0.5) translate(-25px, -70px); }
        }
        @keyframes sprinkle-pop-2 {
          0%, 100% { opacity: 0; transform: scale(0.5) translate(0,0); }
          30% { opacity: 1; transform: scale(1.1) translate(20px, -18px); }
          60% { opacity: 0.7; transform: scale(0.9) translate(32px, -32px); }
          80% { opacity: 0; transform: scale(0.5) translate(45px, -45px); }
        }
        @keyframes sprinkle-pop-3 {
          0%, 100% { opacity: 0; transform: scale(0.5) translate(0,0); }
          30% { opacity: 1; transform: scale(1.1) translate(-18px, 10px); }
          60% { opacity: 0.7; transform: scale(0.9) translate(-32px, 18px); }
          80% { opacity: 0; transform: scale(0.5) translate(-45px, 25px); }
        }
        @keyframes sprinkle-pop-4 {
          0%, 100% { opacity: 0; transform: scale(0.5) translate(0,0); }
          30% { opacity: 1; transform: scale(1.1) translate(30px, -10px); }
          60% { opacity: 0.7; transform: scale(0.9) translate(50px, -18px); }
          80% { opacity: 0; transform: scale(0.5) translate(70px, -25px); }
        }
        @keyframes sprinkle-pop-5 {
          0%, 100% { opacity: 0; transform: scale(0.5) translate(0,0); }
          30% { opacity: 1; transform: scale(1.1) translate(-30px, -10px); }
          60% { opacity: 0.7; transform: scale(0.9) translate(-50px, -18px); }
          80% { opacity: 0; transform: scale(0.5) translate(-70px, -25px); }
        }
        @keyframes sprinkle-pop-6 {
          0%, 100% { opacity: 0; transform: scale(0.5) translate(0,0); }
          30% { opacity: 1; transform: scale(1.1) translate(20px, 20px); }
          60% { opacity: 0.7; transform: scale(0.9) translate(32px, 32px); }
          80% { opacity: 0; transform: scale(0.5) translate(45px, 45px); }
        }
        @keyframes sprinkle-pop-7 {
          0%, 100% { opacity: 0; transform: scale(0.5) translate(0,0); }
          30% { opacity: 1; transform: scale(1.1) translate(-20px, 20px); }
          60% { opacity: 0.7; transform: scale(0.9) translate(-32px, 32px); }
          80% { opacity: 0; transform: scale(0.5) translate(-45px, 45px); }
        }
      `}</style>
    </div>
  );
};

export default LoadingBrush; 