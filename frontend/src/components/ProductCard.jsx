// src/components/ProductCard.jsx
export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group flex flex-col">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-40 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-base sm:text-xl font-semibold text-gray-800">{product.name}</h3>
        <div className="flex items-end gap-2">
          <span className="text-pink-600 font-bold text-lg sm:text-xl">-{product.discount_percent}%</span>
          <span className="text-black font-extrabold text-xl sm:text-2xl">&#8377; {product.discounted_price}</span>
        </div>
        <div className="text-gray-500 text-xs sm:text-sm">
          M.R.P.: <span className="line-through">&#8377; {product.original_price}</span>
        </div>
        <button className="mt-2 px-3 py-2 sm:px-4 sm:py-2 rounded-md bg-pink-500 text-white font-medium hover:bg-pink-600 transition text-sm sm:text-base">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
