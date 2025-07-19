import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import BackToTop from '../components/BackToTop';

const Shop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/products/`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let updatedProducts = [...products];
    if (searchTerm) {
      updatedProducts = updatedProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'All') {
      updatedProducts = updatedProducts.filter(product => product.category === selectedCategory);
    }
    if (sortOption === 'price-low') {
      updatedProducts.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      updatedProducts.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name') {
      updatedProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'default') {
      // Shuffle only once per session
      const storageKey = 'shop_random_order';
      let storedOrder = null;
      try {
        storedOrder = JSON.parse(sessionStorage.getItem(storageKey));
      } catch (e) {
        storedOrder = null;
      }
      const productIds = updatedProducts.map(p => p.id);
      if (!storedOrder) {
        // No order stored yet, shuffle and store
        for (let i = updatedProducts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [updatedProducts[i], updatedProducts[j]] = [updatedProducts[j], updatedProducts[i]];
        }
        sessionStorage.setItem(storageKey, JSON.stringify(updatedProducts.map(p => p.id)));
      } else {
        // Use stored order, append new products at the end
        const ordered = [];
        const idSet = new Set(productIds);
        // Add products in stored order if they exist in current list
        storedOrder.forEach(id => {
          const prod = updatedProducts.find(p => p.id === id);
          if (prod) ordered.push(prod);
        });
        // Add new products not in stored order
        updatedProducts.forEach(p => {
          if (!storedOrder.includes(p.id)) ordered.push(p);
        });
        updatedProducts = ordered;
      }
    }
    setFilteredProducts(updatedProducts);
  }, [searchTerm, selectedCategory, sortOption, products]);

  // Unique categories for filters
  const categories = products && products.length > 0 
    ? ['All', ...new Set(products.map(product => product.category))]
    : ['All'];

  const handleProductClick = (productId) => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate(`/product/${productId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-400 py-8 mt-16">
      <div className="container mx-auto px-2 sm:px-4 flex flex-col md:flex-row gap-8">
        {/* Category Sidebar - collapses on mobile */}
        <div className="w-full md:w-60 lg:w-72 bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-0 md:mt-16 md:fixed top-12 left-0 md:left-4 h-auto md:h-[calc(100vh-3rem-80px)] overflow-y-auto z-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Categories</h2>
          <ul className="space-y-2 flex md:block flex-wrap gap-2 md:gap-0">
            {categories.map(category => (
              <li
                key={category}
                className={`cursor-pointer p-2 md:p-3 rounded-lg transition-all duration-300 text-center md:text-left min-w-[90px] md:min-w-0 ${
                  selectedCategory === category
                    ? 'bg-gray-200 text-gray-800 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 md:ml-64 lg:ml-80 pl-0 md:pl-0">
          {/* Header */}
           <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-black">Our <span className="text-white">Collection</span></h2>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between flex-wrap items-center gap-4 mb-6 bg-white/50 backdrop-blur-md border border-gray-200 rounded-2xl shadow-md p-4 sm:p-6">
            {/* Search Bar */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full sm:w-80 pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black outline-none bg-white text-gray-700 placeholder-gray-400 transition-all duration-300 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Sort Dropdown */}
            <div className="relative w-full sm:w-auto sm:ml-auto">
              <select
                className="w-full sm:w-80 pl-4 pr-10 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black outline-none bg-white text-gray-700 placeholder-gray-400 transition-all duration-300 shadow-sm appearance-none"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Sort By : Default</option>
                <option value="price-low">Price : Low to High</option>
                <option value="price-high">Price : High to Low</option>
                <option value="name">Name : A-Z</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* Product Grid - responsive columns */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {loading ? (
              <p className="text-center text-gray-600 col-span-full transition-opacity duration-500">Loading products...</p>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="cursor-pointer group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-gray-600 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">{product.category} </p>
                    <div className="flex items-end gap-2 mt-1 sm:mt-2">
                      <span className="text-pink-600 font-bold text-lg sm:text-xl">-{product.discount_percent}%</span>
                      <span className="text-black font-extrabold text-xl sm:text-2xl">&#8377; {product.discounted_price}</span>
                    </div>
                    <div className="text-gray-500 text-xs sm:text-sm">
                      M.R.P.: <span className="line-through">&#8377; {product.original_price}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 col-span-full transition-opacity duration-500">
                No products found.
              </p>
            )}
          </div>
        </div>
      </div>
      <BackToTop />
    </div>
  );
};

export default Shop;