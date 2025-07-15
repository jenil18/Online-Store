import { Link } from "react-router-dom";
import { FaShoppingCart, FaUserCircle, FaClipboardList } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import React, { useState } from "react";

export default function GenNavbar() {
  const { user } = useAuth();
  const isAdmin = user?.username === 'skadmin';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-20 px-2 sm:px-6 py-1 bg-white flex justify-between items-center transition duration-300`}
    >
      <div className="flex items-center space-x-2 ml-2 sm:ml-[30px]">
        <img
          src="/Logo2c65.svg"
          alt="Shree Krishna Beauty Products Logo"
          className={`h-10 sm:h-[65px] w-auto transition duration-300`}
        />
      </div>

      {/* Desktop Navigation Links */}
      <ul className="hidden md:flex space-x-4 sm:space-x-8 text-base sm:text-lg font-medium mr-2 sm:mr-[30px]">
        {["Home", "Shop", "About", "Contact"].map((item) => (
          <li key={item} className="relative group cursor-pointer">
            <Link to={item === "Home" ? "/" : `/${item.toLowerCase()}`}>
              <span className="transition duration-300">{item}</span>
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-pink-400 to-pink-200 transition-all duration-500 ease-in-out group-hover:w-full origin-left"></span>
            </Link>
          </li>
        ))}
        
        {/* Orders Button for all users */}
        <li className="relative group cursor-pointer">
          <Link to="/order-status">
            <span className="transition duration-300 flex items-center">
              <FaClipboardList className="mr-1" />
              Orders
            </span>
            <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-pink-400 to-pink-200 transition-all duration-500 ease-in-out group-hover:w-full origin-left"></span>
          </Link>
        </li>
        
        {/* Admin Orders Button */}
        {isAdmin && (
          <li className="relative group cursor-pointer">
            <Link to="/admin-approval">
              <span className="transition duration-300 flex items-center">
                <FaClipboardList className="mr-1" />
                Admin Orders
              </span>
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-pink-400 to-pink-200 transition-all duration-500 ease-in-out group-hover:w-full origin-left"></span>
            </Link>
          </li>
        )}
        
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
      <div className="md:hidden text-3xl cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <span className="text-2xl">&#10005;</span> : <span className="text-2xl">&#9776;</span>}
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`absolute top-full left-0 w-full md:hidden transition-all duration-300 ease-in-out ${
        mobileMenuOpen 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-white text-black shadow-2xl rounded-b-2xl py-6 px-4 mx-2 border-t-2 border-pink-200">
          <div className="space-y-1">
            {["Home", "Shop", "About", "Contact"].map((item, index) => (
              <Link
                key={item}
                to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                className="block text-base font-medium py-3 px-4 rounded-lg hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 transform hover:scale-105"
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item}
              </Link>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            <Link 
              to="/order-status" 
              className="block text-base font-medium py-3 px-4 rounded-lg hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 transform hover:scale-105"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <FaClipboardList className="mr-2" />
                Orders
              </span>
            </Link>
            {isAdmin && (
              <Link 
                to="/admin-approval" 
                className="block text-base font-medium py-3 px-4 rounded-lg hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 transform hover:scale-105"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center">
                  <FaClipboardList className="mr-2" />
                  Admin Orders
                </span>
              </Link>
            )}
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex justify-center space-x-8 py-2">
              <Link 
                to="/cart" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-full bg-pink-100 hover:bg-pink-200 transition-all duration-200 transform hover:scale-110"
              >
                <FaShoppingCart className="text-xl" />
              </Link>
              <Link 
                to="/profile" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-full bg-pink-100 hover:bg-pink-200 transition-all duration-200 transform hover:scale-110"
              >
                <FaUserCircle className="text-xl" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
