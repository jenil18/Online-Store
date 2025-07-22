import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { Search, ChevronDown } from 'lucide-react';
import BackToTop from '../components/BackToTop';
import { useSelector, useDispatch } from 'react-redux';
import { setOrder, ORDER_EXPIRY_MS } from '../shopOrderSlice';

const BRANDS = ['Orane', 'Klassy'];

const Shop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBrand, setSelectedBrand } = useShop();
  const dispatch = useDispatch();
  const shopOrder = useSelector(state => state.shopOrder.orders[selectedBrand]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
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
    const productsForBrand = products.filter(product => product.brand === selectedBrand);
    const idsFromAPI = productsForBrand.map(p => p.id).sort((a, b) => a - b);
    const now = Date.now();
    let order = [];
    let shouldReshuffle = true;
    if (
      shopOrder &&
      Array.isArray(shopOrder.order) &&
      Array.isArray(shopOrder.productIds) &&
      shopOrder.productIds.length === idsFromAPI.length &&
      shopOrder.productIds.every((id, idx) => id === idsFromAPI[idx]) &&
      now - shopOrder.timestamp < ORDER_EXPIRY_MS
    ) {
      shouldReshuffle = false;
    }
    if (shouldReshuffle) {
      order = idsFromAPI.slice();
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      dispatch(setOrder({ brand: selectedBrand, order, timestamp: now, productIds: idsFromAPI }));
    } else {
      order = shopOrder.order;
    }
    const idToProduct = Object.fromEntries(productsForBrand.map(p => [p.id, p]));
    let orderedProducts = order.map(id => idToProduct[id]).filter(Boolean);
    // If there are new products not in the stored order, append them at the end
    const extraProducts = productsForBrand.filter(p => !order.includes(p.id));
    orderedProducts = [...orderedProducts, ...extraProducts];
    if (selectedCategory !== 'All') {
      orderedProducts = orderedProducts.filter(product => product.category === selectedCategory);
    }
    if (searchTerm) {
      orderedProducts = orderedProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortOption === 'price-low') {
      orderedProducts = [...orderedProducts].sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      orderedProducts = [...orderedProducts].sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name') {
      orderedProducts = [...orderedProducts].sort((a, b) => a.name.localeCompare(b.name));
    }
    setFilteredProducts(orderedProducts);
  }, [products, searchTerm, selectedCategory, selectedBrand, sortOption, shopOrder, dispatch]);

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
    <div className="min-h-screen bg-gray-400 py-4 md:py-8 mt-16">
      <div className="container mx-auto px-2 sm:px-4 flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Header: Move to top on mobile, keep in main content on desktop */}
        <h2 className="block md:hidden text-2xl sm:text-3xl font-bold text-center mb-2 md:mb-6 text-black w-full mt-1 md:mt-2">Our <span className="text-white">Collection</span></h2>
        {/* Brand & Categories Card */}
        <div className="w-full md:w-60 lg:w-72 bg-gradient-to-br from-white via-pink-50 to-white rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl p-2 md:p-8 mb-1 md:mb-0 mt-1 md:mt-16 md:fixed top-12 left-0 md:left-4 h-auto md:h-[calc(100vh-3rem-80px)] overflow-y-auto z-10 flex flex-col gap-2 md:gap-6 border border-pink-100">
          {/* Brands */}
          <div>
            <h2 className="text-base md:text-xl font-bold text-gray-800 mb-1 md:mb-3 tracking-tight">Brands</h2>
            <div className="flex gap-3 md:gap-4 justify-center md:justify-start">
              {BRANDS.map((brand, idx) => (
                <button
                  key={brand}
                  className={`px-3 md:px-5 py-1 md:py-2 rounded-full font-semibold shadow-sm transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-pink-300 flex items-center gap-1 md:gap-2 text-xs md:text-base
                    ${selectedBrand === brand
                      ? 'bg-pink-600 text-white border-pink-600 hover:bg-pink-700 hover:border-pink-700 scale-105'
                      : 'bg-white text-black border-pink-300 hover:bg-pink-50'}
                    ${idx === 0 ? '' : 'ml-0 md:ml-2'}`}
                  style={{ minWidth: 70 }}
                  onClick={() => {
                    setSelectedBrand(brand);
                    setSelectedCategory('All');
                  }}
                >
                  {selectedBrand === brand && <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full border border-pink-600 animate-pulse"></span>}
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="my-1 md:my-2 border-t border-pink-100" />

          {/* Categories: Dropdown on mobile, sidebar on desktop */}
          <div className="block md:hidden mb-1">
            <button
              className="w-full flex items-center justify-between p-2 rounded-xl border border-pink-200 bg-pink-50 text-gray-700 font-medium shadow-sm text-xs"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <span className="flex items-center gap-1">
                {selectedCategory !== 'All' && <span className="inline-block w-1.5 h-1.5 bg-pink-600 rounded-full"></span>}
                {selectedCategory}
              </span>
              <ChevronDown size={16} />
            </button>
            {showCategoryDropdown && (
              <ul className="mt-1 bg-white rounded-xl shadow-lg border border-pink-100">
                {categories.map(category => (
                  <li
                    key={category}
                    className={`cursor-pointer p-2 rounded-xl transition-all duration-300 flex items-center gap-1 text-xs font-medium
                      ${selectedCategory === category
                        ? 'bg-pink-100 text-pink-700 font-semibold scale-105'
                        : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    {selectedCategory === category && <span className="inline-block w-1.5 h-1.5 bg-pink-600 rounded-full"></span>}
                    {category}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hidden md:block">
            <h2 className="text-xl font-bold text-gray-800 mb-3 tracking-tight">Categories</h2>
            <ul className="space-y-2">
              {categories.map(category => (
                <li
                  key={category}
                  className={`cursor-pointer p-2 md:p-3 rounded-full transition-all duration-300 flex items-center gap-2 text-base font-medium
                    ${selectedCategory === category
                      ? 'bg-pink-100 text-pink-700 font-semibold scale-105'
                      : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {selectedCategory === category && <span className="inline-block w-2 h-2 bg-pink-600 rounded-full"></span>}
                  {category}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 md:ml-64 lg:ml-80 pl-0 md:pl-0">
          {/* Header: Only show on desktop */}
          <h2 className="hidden md:block text-3xl sm:text-4xl font-bold text-center mb-4 text-black">Our <span className="text-white">Collection</span></h2>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between flex-wrap items-center gap-2 md:gap-4 mb-2 md:mb-6 bg-white/50 backdrop-blur-md border border-gray-200 rounded-xl md:rounded-2xl shadow-md p-2 md:p-6 mt-1 md:mt-0">
            {/* Search Bar */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 md:left-4 top-3 md:top-4 h-4 md:h-5 w-4 md:w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full sm:w-80 pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black outline-none bg-white text-gray-700 placeholder-gray-400 transition-all duration-300 shadow-sm text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Sort Dropdown */}
            <div className="relative w-full sm:w-auto sm:ml-auto">
              <select
                className="w-full sm:w-80 pl-3 md:pl-4 pr-8 md:pr-10 py-2 md:py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black outline-none bg-white text-gray-700 placeholder-gray-400 transition-all duration-300 shadow-sm appearance-none text-sm md:text-base"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Sort By : Default</option>
                <option value="price-low">Price : Low to High</option>
                <option value="price-high">Price : High to Low</option>
                <option value="name">Name : A-Z</option>
              </select>
              <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={16} className="md:w-5 md:h-5" />
              </div>
            </div>
          </div>

          {/* Product Grid - responsive columns */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
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