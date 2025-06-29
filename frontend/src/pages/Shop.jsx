// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import products from "../data/products";

// const categories = ["All", "Face", "Eyes", "Lips"];

// const Shop = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");

//   const filteredProducts = products.filter((product) => {
//     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
//     return matchesSearch && matchesCategory;
//   });

//   return (
//     <div className="min-h-screen bg-gray-400 py-12 px-4 sm:px-8">
//       <h2 className="mt-[50px] text-4xl font-bold text-center mb-10 text-black">Our <span className="text-white">Collection</span></h2>

//       {/* Search & Filter */}
//       <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-8">
//         <input
//           type="text"
//           placeholder="Search products..."
//           className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 outline-none"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />

//         <div className="flex gap-3 flex-wrap">
//           {categories.map((category) => (
//             <button
//               key={category}
//               onClick={() => setSelectedCategory(category)}
//               className={`px-4 py-2 rounded-full border ${
//                 selectedCategory === category
//                   ? "bg-black/85 text-white border-white"
//                   : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
//               } transition`}
//             >
//               {category}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Product Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
//         {filteredProducts.length > 0 ? (
//           filteredProducts.map((product) => (
//             <Link to={`/product/${product.id}`} key={product.id} className="group">
//               <div className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition duration-300">
//                 <img
//                   src={product.image}
//                   alt={product.name}
//                   className="h-60 w-full object-cover group-hover:scale-105 transition duration-300"
//                 />
//                 <div className="p-4">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     {product.name}
//                   </h3>
//                   <p className="text-gray-500">{product.category}</p>
//                   <p className="text-xl font-bold text-black">&#8377; {product.price}</p>
//                 </div>
//               </div>
//             </Link>
//           ))
//         ) : (
//           <p className="text-center text-gray-500 text-lg">No products found.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Shop;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import products from '../data/products';

const Shop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products || []);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');
  const handleProductClick = (productId) => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate(`/product/${productId}`);
    }
  };  

  // Unique categories and brands for filters, with fallback for empty/undefined products
  const categories = products && products.length > 0 
    ? ['All', ...new Set(products.map(product => product.category))]
    : ['All'];

  // Filter and sort products
  useEffect(() => {
    let updatedProducts = [...(products || [])];

    // Search filter
    if (searchTerm) {
      updatedProducts = updatedProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      updatedProducts = updatedProducts.filter(product => product.category === selectedCategory);
    }

    // Sort
    if (sortOption === 'price-low') {
      updatedProducts.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      updatedProducts.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name') {
      updatedProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(updatedProducts);
  }, [searchTerm, selectedCategory, sortOption]);

  return (
    <div className="min-h-screen bg-gray-400 py-12 mt-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8">
        {/* Category Sidebar */}
        <div className="w-full mt-16 md:w-60 lg:w-72 bg-white rounded-xl shadow-lg p-6 fixed top-12 left-0 md:left-4 h-[calc(100vh-3rem-80px)] overflow-y-auto z-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Categories</h2>
          <ul className="space-y-2">
            {categories.map(category => (
              <li
                key={category}
                className={`cursor-pointer p-3 rounded-lg transition-all duration-300 ${
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
        <div className="w-full md:w-3/4 md:ml-64 lg:ml-80 pl-4 md:pl-0">
          {/* Header */}
           <h2 className="text-4xl font-bold text-center mb-10 text-black">Our <span className="text-white">Collection</span></h2>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between flex-wrap items-center gap-4 mb-10 bg-white/50 backdrop-blur-md border border-gray-200 rounded-2xl shadow-md p-6">
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

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="cursor-pointer group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-gray-600 transition-colors duration-300">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500">{product.category} | {product.brand}</p>
                  <p className="text-gray-600 font-bold mt-2">${product.price.toFixed(2)}</p>
                </div>
              </div>
              ))
            ) : (
              <p className="text-center text-gray-600 col-span-full transition-opacity duration-500">
                {products && products.length > 0 ? 'No products found.' : 'Loading products...'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;