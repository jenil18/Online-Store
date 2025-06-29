import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaUserCircle } from "react-icons/fa";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setScrolled(window.scrollY >= heroHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-20 px-6 py-1 flex justify-between items-center transition duration-300 ${
        scrolled ? "bg-white shadow-lg text-black" : "bg-transparent text-white"
      }`}
    >
      <div className="flex items-center space-x-2 ml-[30px]">
        {/* <img
          src="/images/logo2c65.svg"   // Use actual path to your SVG
          alt="Shree Krishna Beauty Products Logo"
          className="h-auto w-auto"      // Adjust height → full navbar height
        /> */}
        <img
          src="/images/logo2c65.svg"
          alt="Shree Krishna Beauty Products Logo"
          className={`h-[65px] w-auto transition duration-300 ${scrolled ? "filter invert-0" : "filter invert"}`}
        />

      </div>


      {/* Navigation Links */}
      <ul className="hidden md:flex space-x-8 text-lg font-medium mr-[30px]">
        {["Home", "Shop", "About", "Contact"].map((item) => (
          <li key={item} className="relative group cursor-pointer">
            <Link to={item === "Home" ? "/" : `/${item.toLowerCase()}`}>
              <span className="transition duration-300">{item}</span>
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-pink-400 to-pink-200 transition-all duration-500 ease-in-out group-hover:w-full origin-left"></span>
            </Link>
          </li>
        ))}
      {/* Cart & Profile Icons */}
      <div className="hidden md:flex space-x-8 text-2xl">
        {[
          { icon: <FaShoppingCart />, link: "/cart" },
          { icon: <FaUserCircle />, link: "/profile" },
        ].map((item, index) => (
          <div key={index} className="relative group cursor-pointer">
            <Link to={item.link} >
              <span className="transition duration-300">{item.icon}</span>
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-pink-400 to-pink-200 transition-all duration-500 ease-in-out group-hover:w-full origin-left"></span>
            </Link>
          </div>
        ))}
      </div>
      </ul>


      {/* Mobile Menu Icon */}
      <div className="md:hidden text-3xl cursor-pointer">&#9776;</div>
    </nav>
  );
}
