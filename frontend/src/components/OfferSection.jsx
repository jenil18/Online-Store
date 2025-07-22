import React, { useEffect, useState } from "react";

const OfferSection = () => {
  const [circles, setCircles] = useState([]);

  useEffect(() => {
    // Generate random positions for decorative circles
    const generatedCircles = Array.from({ length: 5 }, () => ({
      top: Math.random() * 80 + "%",
      left: Math.random() * 80 + "%",
      size: Math.random() * 80 + 30, // size in px between 30px and 110px
      opacity: Math.random() * 0.4 + 0.2, // between 0.2 and 0.6
    }));
    setCircles(generatedCircles);
  }, []);

  return (
    <section className="w-full py-20 px-4 md:px-16 bg-gradient-to-r from-pink-400 to-purple-500 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center relative z-10">
        {/* Left - Text Content */}
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
            <span className="text-black">Rakshabandhan Special Offer</span>
          </h2>
          <p className="text-lg md:text-xl text-white/90">
            Up to <span className="font-bold text-black">50% OFF</span> on premium cosmetics. Glow brighter this season with our handpicked beauty essentials.
          </p>
          <a
            href="/shop"
            className="inline-block px-8 py-3 bg-white text-black font-bold rounded-full text-lg shadow-md hover:bg-gradient-to-r hover:from-pink-500 hover:to-yellow-400 hover:text-white transition duration-300 relative z-10"
          >
            Shop Now
          </a>
        </div>

        {/* Right - Image */}
        <div className="relative z-10">
          <img
            src="/images/newly_arrived.jpg"
            alt="Special Offer"
            className="w-full max-w-md mx-auto rounded-3xl shadow-2xl animate-slide-in-right"
          />
        </div>
      </div>

      {/* Random Floating Circles */}
      {circles.map((circle, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-ping z-0"
          style={{
            top: circle.top,
            left: circle.left,
            width: `${circle.size}px`,
            height: `${circle.size}px`,
            opacity: circle.opacity,
          }}
        ></div>
      ))}
    </section>
  );
};

export default OfferSection;
