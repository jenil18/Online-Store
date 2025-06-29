import { useParams, Link } from "react-router-dom";
import products from "../data/products";
import { useCart } from "../context/CartContext";
import { useState } from "react";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const product = products.find((p) => p.id === Number(id));

  const [added, setAdded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2500); // Hide popup after 2.5s
  };

  if (!product)
    return <div className="min-h-screen flex justify-center items-center">Product Not Found</div>;

  return (
    <section className="min-h-screen py-16 px-4 mt-[20px] md:px-20 bg-gray-400 relative">
      {/* Popup Notification */}
      {showPopup && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full text-sm animate-fade-in-out shadow-lg z-30">
          <span className="font-semibold">{product.name}</span> is added to cart
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
        <img
          src={product.image}
          alt={product.name}
          className="w-full rounded-3xl shadow-2xl"
        />
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-black">{product.name}</h1>
          <p className="text-2xl font-semibold text-white">&#8377; {product.price}</p>
          <p className="text-black">
            This is a premium cosmetic product crafted for your beauty needs. Enjoy flawless
            results and gentle care with our formula.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              className="px-6 py-3 bg-black text-white rounded-full hover:bg-black/70 transition"
            >
              Add to Cart
            </button>

            {/* View Cart button → only visible if added */}
            {added && (
              <Link
                to="/cart"
                className="px-6 py-3 border-2 border-black text-black rounded-full hover:bg-black hover:text-white transition"
              >
                View Cart
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;
