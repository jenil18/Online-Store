import { useState } from "react";
import { useCart } from "../context/CartContext";
import { Trash2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const coupons = {
    SAVE10: 0.1,
    SAVE20: 0.2,
    GLOW30: 0.3,
  };

  const applyCoupon = () => {
    const normalized = coupon.trim().toUpperCase();
    if (coupons[normalized]) {
      setDiscount(coupons[normalized]);
    } else {
      setDiscount(0);
      alert("Invalid coupon code.");
    }
  };

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const total = subtotal - subtotal * discount;

  return (
    <section className="mt-16 min-h-screen bg-gray-400 py-12 px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="container mx-auto">
        <h1 className="text-4xl text-center font-bold mb-6">Cart</h1>

        {/* Cart Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {cartItems.length > 0 ? (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-all duration-300 rounded-lg"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.brand}</p>
                    <p className="text-gray-800 font-medium mt-1">₹ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                      className="w-16 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 text-center"
                    />
                    <p className="text-gray-800 font-medium">
                      ₹ {(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors duration-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-600 text-lg mt-4">Your cart is empty.</p>
              <a
                href="/shop"
                className="mt-4 inline-block px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
              >
                Shop Now
              </a>
            </div>
          )}
        </div>

        {/* Coupon and Totals */}
        {cartItems.length > 0 && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Coupon Section */}
            <div className="md:w-1/2 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply Coupon</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Enter coupon code (e.g., GLOW30)"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 bg-gray-50"
                />
                <button
                  onClick={applyCoupon}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
                >
                  Apply
                </button>
              </div>
              {discount > 0 && (
                <p className="mt-3 text-green-600">
                  Coupon applied! {(discount * 100).toFixed(0)}% off
                </p>
              )}
            </div>

            {/* Cart Totals Section */}
            <div className="md:w-1/2 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Cart Totals</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({(discount * 100).toFixed(0)}%)</span>
                    <span>-₹ {(subtotal * discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold text-gray-800 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>₹ {total.toFixed(2)}</span>
                </div>
              </div>
              <button className="w-full mt-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}