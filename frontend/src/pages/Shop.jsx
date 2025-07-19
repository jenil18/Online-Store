import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronDown } from 'lucide-react';
import BackToTop from '../components/BackToTop';

const BRANDS = ['Orane', 'Klassy'];

const Shop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('Orane');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
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
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [API_BASE]);

  useEffect(() => {
    let updatedProducts = [...products];
    // Filter by brand
    if (selectedBrand) {
      updatedProducts = updatedProducts.filter(product => product.brand === selectedBrand);
    }
    // Filter by category
    if (selectedCategory !== 'All') {
      updatedProducts = updatedProducts.filter(product => product.category === selectedCategory);
    }
    // Filter by search
    if (searchTerm) {
      updatedProducts = updatedProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sorting logic (unchanged)
    if (sortOption === 'price-low') {
      updatedProducts.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      updatedProducts.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name') {
      updatedProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'default') {
      // Shuffle every 12 hours, persist order and timestamp in localStorage
      const storageKey = 'shop_random_order_v2';
      let storedData = null;
      try {
        storedData = JSON.parse(localStorage.getItem(storageKey));
      } catch (e) {
        storedData = null;
      }
      const productIds = updatedProducts.map(p => p.id);
      const now = Date.now();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      let shouldReshuffle = true;
      if (
        storedData &&
        Array.isArray(storedData.order) &&
        typeof storedData.timestamp === 'number' &&
        storedData.order.length === productIds.length &&
        storedData.order.every(id => productIds.includes(id)) &&
        now - storedData.timestamp < TWELVE_HOURS
      ) {
        shouldReshuffle = false;
      }
      if (shouldReshuffle) {
        // Reshuffle and store new order and timestamp
        for (let i = updatedProducts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [updatedProducts[i], updatedProducts[j]] = [updatedProducts[j], updatedProducts[i]];
        }
        localStorage.setItem(
          storageKey,
          JSON.stringify({ order: updatedProducts.map(p => p.id), timestamp: now })
        );
      } else {
        // Use stored order
        updatedProducts.sort((a, b) => storedData.order.indexOf(a.id) - storedData.order.indexOf(b.id));
      }
    }
    setFilteredProducts(updatedProducts);
  }, [products, searchTerm, selectedCategory, selectedBrand, sortOption]);

  // Unique categories for the selected brand
  const categories = products && products.length > 0
    ? ['All', ...Array.from(new Set(products.filter(p => p.brand === selectedBrand).map(product => product.category)))]
    : ['All'];

  const handleProductClick = (productId) => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate(`/product/${productId}`);
    }
  };

  // Responsive: categories as dropdown on mobile, sidebar on desktop
  return (
    <div className="min-h-screen bg-gray-400 py-8 mt-16">
      <div className="container mx-auto px-2 sm:px-4 flex flex-col md:flex-row gap-8">
        {/* Brand Selection Block */}
        <div className="w-full md:w-60 lg:w-72 bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-0 md:mt-16 md:fixed top-12 left-0 md:left-4 h-auto md:h-[calc(100vh-3rem-80px)] overflow-y-auto z-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Brands</h2>
          <ul className="space-y-2 flex md:block flex-wrap gap-2 md:gap-0 mb-6">
            {BRANDS.map(brand => (
              <li
                key={brand}
                className={`cursor-pointer p-2 md:p-3 rounded-lg transition-all duration-300 text-center md:text-left min-w-[90px] md:min-w-0 ${
                  selectedBrand === brand
                    ? 'bg-pink-200 text-pink-800 font-semibold'
                    : 'text-gray-600 hover:bg-pink-100 hover:text-pink-800'
                }`}
                onClick={() => {
                  setSelectedBrand(brand);
                  setSelectedCategory('All'); // Reset category when brand changes
                }}
              >
                {brand}
              </li>
            ))}
          </ul>

          {/* Categories: Dropdown on mobile, sidebar on desktop */}
          <div className="block md:hidden mb-4">
            <button
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <span>{selectedCategory}</span>
              <ChevronDown size={18} />
            </button>
            {showCategoryDropdown && (
              <ul className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200">
                {categories.map(category => (
                  <li
                    key={category}
                    className={`cursor-pointer p-3 rounded-lg transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-gray-200 text-gray-800 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    {category}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hidden md:block">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Categories</h2>
            <ul className="space-y-2">
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