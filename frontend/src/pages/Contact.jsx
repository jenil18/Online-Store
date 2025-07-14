import React from "react";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

const Contact = () => {
  return (
    <section className="bg-gray-400 min-h-screen pt-28 pb-16 px-4 sm:px-8 lg:px-24">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('/images/general-bg.png')" }}
      ></div>
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-black mb-4 animate-fade-in">
          Contact Us
        </h1>
        <p className="text-lg text-white mb-12 animate-fade-in delay-100">
          We’d love to hear from you! Find our details below.
        </p>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 animate-fade-in delay-200">
          <div className="bg-white shadow-xl rounded-3xl p-6 hover:scale-105 transition-transform duration-300">
            <MapPin className="h-10 w-10 text-blue-600 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Address</h3>
            <p className="text-gray-600">
              Shop No. 101-102, First Floor, Angan Residency, Near Gangotri Circle, Nikol, Ahmedabad, Gujarat-382350
            </p>
          </div>

          <div className="bg-white shadow-xl rounded-3xl p-6 hover:scale-105 transition-transform duration-300">
            <Phone className="h-10 w-10 text-green-600 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Phone</h3>
            <p className="text-gray-600">Calling : 98799 - 44993</p>
            <p className="text-gray-600">Whatsapp : 98793 - 49398</p>
            <p className="text-gray-600">Whatsapp : 98255 - 94529</p>
          </div>

          <div className="bg-white shadow-xl rounded-3xl p-6 hover:scale-105 transition-transform duration-300">
            <Mail className="h-10 w-10 text-red-600 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Email</h3>
            <p className="text-gray-600">shreekrishnabeautyproducts@gmail.com</p>
          </div>
        </div>

        {/* Social Media */}
        <div className="flex justify-center gap-6 mb-16 animate-fade-in delay-300">
          <a
            href="https://www.facebook.com/dev.patel.329831"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-800 hover:text-blue-500 transition-all"
          >
            <Facebook className="h-8 w-8" />
          </a>
          <a
            href="https://www.instagram.com/_shree_krishna_beauty_products"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-500 hover:text-pink-400 transition-all"
          >
            <Instagram className="h-8 w-8" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;
