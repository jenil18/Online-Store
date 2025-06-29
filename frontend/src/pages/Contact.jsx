import React from "react";

const Contact = () => {
  return (
    <section className="relative min-h-screen bg-gray-400 py-16 px-6 md:px-20">
      {/* Background Decorative Pattern */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('/images/general-bg.png')" }}
      ></div>

      <div className="relative z-10 max-w-4xl mt-[50px] mx-auto">
        <h1 className="text-5xl font-bold text-center text-black mb-4">
          Get in <span className="text-white">Touch</span>
        </h1>
        <p className="text-center text-gray-900 mb-12">
          We'd love to hear from you! Whether you have a question about products, pricing, or else, our team is ready to answer.
        </p>

        <form className="grid grid-cols-1 gap-6 bg-white rounded-2xl p-8 shadow-xl">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">Name</label>
            <input
              type="text"
              placeholder="Your Name"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">Contact Number</label>
            <input
                type="tel"
                placeholder="Your Number"
                pattern="[0-9]{10}" // Accepts exactly 10 digits (modify if needed)
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>


          <div>
            <label className="block mb-2 text-gray-700 font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">Message</label>
            <textarea
              rows="5"
              placeholder="Your message..."
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-black text-white rounded-lg text-lg font-semibold hover:bg-black/40 transition"
          >
            Send Message
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-gray-800">Or reach us directly at</p>
          <p className="font-semibold text-gray-800">shreekrishnabeautyproducts@gmail.com</p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
