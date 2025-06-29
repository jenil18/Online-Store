const SpecialProduct = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
        {/* Left Image */}
        <div>
          <img
            src="/images/specialpic.png" // Add this image in your public/images folder
            alt="Special Product"
            className="rounded-lg shadow-lg w-full"
          />
        </div>

        {/* Right Content */}
        <div>
          <p className="text-sm text-gray-400 font-semibold">BE BOLD, BE DARING</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">A WHOLE NEW LOOK</h2>
          <p className="text-gray-600 mb-6">
            Flower-moti based resin brooch with stylish golden latkans <br></br>
            Colors : Pink, Blue
          </p>
          <a href="/shop" className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-black/40 transition">
            VIEW MORE
          </a>
        </div>
      </div>
    </section>
  );
};

export default SpecialProduct;
