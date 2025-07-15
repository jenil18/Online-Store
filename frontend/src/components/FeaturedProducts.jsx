import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const API_BASE = process.env.REACT_APP_API_URL;
        const response = await fetch(`${API_BASE}/api/products/`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Show first 4 products as featured
  const featured = products.slice(0, 4);

  if (loading) return <div>Loading featured products...</div>;

  return (
    <section className="py-10 sm:py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-6 sm:mb-8">
          Stay Ahead With the Hottest Trends
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="group block">
              <div className="overflow-hidden rounded-lg shadow hover:shadow-lg transition">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 sm:h-56 md:h-64 object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="mt-2 sm:mt-3 text-left">
                <p className="text-xs text-gray-400 mt-2 sm:mt-4">{product.category}</p>
                <h3 className="text-sm sm:text-base font-semibold mt-1 sm:mt-2">{product.name}</h3>
                <p className="text-gray-800 mt-1">&#8377; {product.price}</p>
              </div>
            </Link>
          ))}
        </div>
        
        {/* View More Button */}
        <div className="flex justify-center mt-8">
          <Link 
            to="/shop" 
            className="group inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:bg-gray-800"
          >
            <span>View More</span>
            <ArrowRight 
              size={20} 
              className="group-hover:translate-x-1 transition-transform duration-300" 
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
