import React, { useState, useEffect, useRef } from 'react';

const Testimonial = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Testimonial data
  const testimonials = [
    {
      id: 1,
      name: "Ojas Rajani",
      image: "/images/client-1-c.jpg",
      text: "The Best Quality Hair Accessories, Total Value For Money!"
    },
    {
      id: 2,
      name: "Komal Jaiswal",
      image: "/images/client-2-c.jpg",
      text: "All Products, Superb Quality! I suggest everyone to buy from Shree Krishna Beauty Products."
    },
    {
      id: 3,
      name: "Rita Panchal",
      image: "/images/client-3-c.jpg",
      text: "Every Product is amazing!...and reasonable...I like their fast delivery service."
    },
    {
      id: 4,
      name: "Priyanka Vyas",
      image: "/images/client-4-c.jpg",
      text: "Highly impressed with the genuine products and super-fast delivery! Exceptional service, will definitely shop again."
    },
    {
      id: 5,
      name: "Ojas Rajani",
      image: "/images/client-1-c.jpg",
      text: "The Best Quality Hair Accessories, Total Value For Money!"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % testimonials.length);
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, testimonials.length]);

  // Pause on hover/touch
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  // Manual navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsPaused(true);
    // Resume auto-slide after 2 seconds
    setTimeout(() => setIsPaused(false), 2000);
  };

  return (
    <section
      className="relative bg-fixed bg-center bg-cover h-screen overflow-hidden"
      style={{
        backgroundImage: `url('/images/lady-bgr-2.png')`,
      }}
    >
      <div className="h-full flex items-center justify-center">
        <div 
          className="max-w-3xl mx-auto text-center px-4 py-32"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <p className="text-white uppercase tracking-wider font-medium mb-6">
            TESTIMONIALS
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            OUR HAPPY CLIENTS
          </h2>
          
          {/* Testimonial Content */}
          <div className="relative min-h-[300px] flex items-center justify-center">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  index === currentSlide
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-full'
                }`}
              >
                <p className="text-lg text-white/90 mb-10 leading-relaxed">
                  &quot;{testimonial.text}&quot;
                </p>

                {/* Client Info */}
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full border-2 border-white"
                  />
                  <p className="text-white font-medium">{testimonial.name}</p>
                  
                  {/* Navigation Dots */}
                  <div className="flex justify-center space-x-2 mt-4">
                    {testimonials.map((_, dotIndex) => (
                      <button
                        key={dotIndex}
                        onClick={() => goToSlide(dotIndex)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          dotIndex === currentSlide
                            ? 'bg-white scale-110'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to slide ${dotIndex + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ position: 'absolute', right: 0, bottom: 0, padding: '8px', zIndex: 10 }} className="text-xs text-gray-400 select-none pointer-events-none">
        PC : makeupbyseemasaini/IG
      </div>
    </section>
  );
};

export default Testimonial;
