import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="z-20 bg-white text-black py-8 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center text-center md:text-left">

        {/* Contact Details */}
        <div className="mb-6 md:mb-0 flex flex-col items-center md:items-start">
          <h3 className="text-base sm:text-lg font-semibold mb-2 text-black">Contact Details</h3>
          <p className="mb-1 flex items-center gap-2 text-xs sm:text-base">
            <FaPhoneAlt className="text-black" /> 98799 - 44993
          </p>
          <p className="mb-1 flex items-center gap-2 text-xs sm:text-base">
            <FaWhatsapp className="text-black" /> 98793 - 49398 | 98255 - 94529
          </p>
          <p className="mb-1 flex items-center gap-2 text-xs sm:text-base">
            <FaEnvelope className="text-black" /> shreekrishnabeautyproducts@gmail.com
          </p>
          <p className="flex items-center gap-2 text-xs sm:text-base">
            <FaMapMarkerAlt className="text-black" /> Shop No. 102-103, Angan Residency, Gangotri Circle, Nikol, Ahmedabad, Gujarat-382350
          </p>
        </div>

        {/* Company Logo */}
        <div className="mb-6 md:mb-0 flex justify-center">
          <img src="/images/footer-logo.png" alt="logo" className="max-h-16 sm:max-h-24 w-auto mx-auto"/>
        </div>

        {/* Quick Links */}
       <div className="flex flex-col items-center md:items-end">
          <h3 className="text-base sm:text-lg font-semibold mb-2 text-black">Quick Links</h3>
          <ul className="space-y-2 flex flex-col items-center md:items-end">
            {[
              { name: "About", path: "/about" },
              { name: "Contact", path: "/contact" },
              { name: "Customer Service", path: "/contact" }, // Using /contact for now
            ].map((link, i) => (
              <li key={i}>
                <Link
                  to={link.path}
                  className="transition duration-300 ease-in-out hover:text-black hover:scale-105 cursor-pointer inline-block text-xs sm:text-base"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Social Icons */}
      <div className="flex justify-center space-x-4 mt-6">
        {[ 
          {Icon: FaInstagram, link: "https://www.instagram.com/_shree_krishna_beauty_products"},
          {Icon: FaFacebookF, link: "https://www.facebook.com/dev.patel.329831"},
          {Icon : FaWhatsapp, link: "https://wa.me/message/EQE7HHG4QEWCP1"},
        ].map(({Icon,link}, i) => (
          <a
            key={i}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:text-black transition transform hover:scale-125 duration-300"
          >
            <Icon size={20} />
          </a>
        ))}
      </div>

      <p className="text-center text-xs sm:text-sm text-black mt-4">
        Copyright © 2025 Shree Krishna Beauty Products
      </p>
    </footer>
  );
}
