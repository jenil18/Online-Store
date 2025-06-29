import { Link } from "react-router-dom";
import products from "../data/products";

const FeaturedProducts = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8">
          Stay Ahead With the Hottest Trends
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="group block">
              <div className="overflow-hidden rounded-lg shadow hover:shadow-lg transition">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="mt-3 text-left">
                <p className="text-xs text-gray-400 mt-8">{product.category}</p>
                <h3 className="text-base font-semibold mt-2">{product.name}</h3>
                <p className="text-gray-800 mt-1">&#8377; {product.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
