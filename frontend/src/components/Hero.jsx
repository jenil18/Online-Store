import { motion, useViewportScroll, useTransform } from "framer-motion";

export default function Hero() {
  const { scrollY } = useViewportScroll();

  // Overlay opacity → fades as user scrolls through Hero section (adjust distance as needed)
  const overlayOpacity = useTransform(scrollY, [0, 400], [0.6, 0]);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Sticky container to hold background only within Hero */}
      <div className="fixed top-0 h-screen w-full z-[-1]">
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
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-start text-left px-4 md:px-20 pt-32">
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-xl mb-4">
          TheSecretOfBeauty!
        </h1>
        <p className="max-w-xl text-white/90 text-lg md:text-xl mb-8 drop-shadow-md">
          Discover your beauty with our premium products, <br></br> hand-picked for you.
        </p>
        <a className="border border-white text-white px-6 py-3 rounded-md hover:bg-white hover:text-black transition drop-shadow-md" href="/shop">
          View More
        </a>
      </div>
    </section>
  );
}
