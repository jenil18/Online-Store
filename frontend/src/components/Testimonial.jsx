import React, { useState, useEffect, useRef } from 'react';

const Testimonial = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Testimonial data
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      image: "/images/client.jpg",
      text: "Amazing products! The quality is outstanding and the customer service is exceptional. I've been using their beauty products for months and I'm absolutely in love with the results. Highly recommended!"
    },
    {
      id: 2,
      name: "Emily Rodriguez",
      image: "/images/client.jpg",
      text: "I was skeptical at first, but these products exceeded my expectations. The natural ingredients and professional results have made me a loyal customer. The team is always helpful and responsive."
    },
    {
      id: 3,
      name: "Priya Sharma",
      image: "/images/client.jpg",
      text: "Best beauty products I've ever used! The range is extensive and every product delivers what it promises. My skin has never looked better. Thank you for such amazing quality!"
    },
    {
      id: 4,
      name: "Maria Garcia",
      image: "/images/client.jpg",
      text: "Incredible experience from start to finish. The products are premium quality and the results are visible within days. The customer support team is incredibly helpful and friendly."
    },
    {
      id: 5,
      name: "Jennifer Lee",
      image: "/images/client.jpg",
      text: "I've tried many beauty brands, but this one stands out. The products are effective, safe, and reasonably priced. My friends keep asking about my glowing skin - I owe it all to these amazing products!"
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
          <div className="relative min-h-[200px] flex items-center justify-center">
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
                <div className="flex flex-col items-center space-y-2">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full border-2 border-white"
                  />
                  <p className="text-white font-medium">{testimonial.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white scale-110'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Pause Indicator */}
          {isPaused && (
            <div className="mt-4">
              <p className="text-white/70 text-sm">⏸️ Paused</p>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ position: 'absolute', right: 0, bottom: 0, padding: '8px', zIndex: 10 }} className="text-xs text-gray-400 select-none pointer-events-none">
        PC : makeupbyseemasaini/IG
      </div>
    </section>
  );
};

export default Testimonial;
