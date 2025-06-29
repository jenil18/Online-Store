// src/components/ProductCard.jsx
export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
        <p className="text-lg text-pink-500 font-medium">&#8377; {product.price}</p>
        <button className="mt-2 px-4 py-2 rounded-md bg-pink-500 text-white font-medium hover:bg-pink-600 transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
