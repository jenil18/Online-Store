import React from "react";

const About = () => {
  return (
    <section className="relative min-h-screen bg-gray-400 text-gray-900 py-16 px-6 md:px-20">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('/images/general-bg.png')" }}
      ></div>

      <div className="relative z-10 max-w-5xl mt-[50px] mx-auto">
        <h1 className="text-5xl font-bold text-center text-black mb-8 leading-tight">
          About <span className="text-white">Shree Krishna Beauty Products</span>
        </h1>

        <p className="text-lg text-gray-900 text-center mb-12 max-w-3xl mx-auto">
          We are passionate about beauty, elegance, and confidence. Our cosmetics
          are designed to bring out the bold and the brilliant in you.
          Carefully curated, cruelty-free, and formulated for every occasion.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">Premium Material</h3>
            <p className="text-gray-600">
              Only the finest raw material, formulated by beauty experts, to keep
              you glowing and healthy.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">Cruelty-Free</h3>
            <p className="text-gray-600">
              We never harm animals, and we believe beauty should be ethical
              and responsible.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">Worldwide Shipping</h3>
            <p className="text-gray-600">
              From our store to your doorstep, wherever you are. Quick, reliable,
              and secure delivery.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-gray-900 max-w-xl mx-auto mb-6">
            Be part of a community that embraces diversity, self-expression,
            and empowerment. Follow us on social media and become a part of the
            beauty revolution.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
