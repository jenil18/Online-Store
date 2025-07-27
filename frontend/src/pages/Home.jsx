import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import SpecialProduct from '../components/SpecialProduct';
import Testimonial from '../components/Testimonial';
import OfferSection from '../components/OfferSection';
import BackToTop from '../components/BackToTop';
import AdPopup from '../components/AdPopup';

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <OfferSection />
      <SpecialProduct />
      <Testimonial />
      <BackToTop />
      <AdPopup />
    </>
  );
}
