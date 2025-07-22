import { motion, useViewportScroll, useTransform } from "framer-motion";

export default function Hero() {
  const { scrollY } = useViewportScroll();

  // Overlay opacity → fades as user scrolls through Hero section (adjust distance as needed)
  const overlayOpacity = useTransform(scrollY, [0, 400], [0.6, 0]);

  return (
    <section className="relative h-[70vh] sm:h-screen overflow-hidden flex flex-col justify-center">
      {/* Sticky container to hold background only within Hero */}
      <div className="fixed top-0 h-[70vh] sm:h-screen w-full z-[-1]">
        {/* Background Image */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/images/lady-bgr-3.png')" }}
        />
        {/* Overlay → fading */}
        <motion.div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-start text-left px-3 sm:px-4 md:px-20 pt-20 sm:pt-32">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-xl mb-2 sm:mb-4">
          TheSecretOfBeauty!
        </h1>
        <p className="max-w-xs sm:max-w-xl text-white/90 text-base sm:text-lg md:text-xl mb-4 sm:mb-8 drop-shadow-md">
          Discover your beauty with our premium products, <br /> hand-picked for you.
        </p>
        <a className="border border-white text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md hover:bg-white hover:text-black transition drop-shadow-md text-sm sm:text-base" href="/shop">
          View More
        </a>
      </div>
      <div style={{ position: 'absolute', right: 0, bottom: 0, padding: '8px', zIndex: 10 }} className="text-xs text-gray-400 select-none pointer-events-none">
        PC : oranebeauty19/IG
      </div>
    </section>
  );
}
