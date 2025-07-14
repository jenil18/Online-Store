import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import { Trash2, ShoppingBag, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { placeOrderForApproval, loading, error } = useOrder();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const navigate = useNavigate();

  const coupons = {
    SAVE10: 0.1,
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

  const handlePlaceOrderForApproval = async () => {
    setOrderError("");
    setOrderSuccess(false);
    
    try {
      console.log("🛒 Cart items before placing order:", cartItems);
      console.log("💰 Subtotal:", subtotal);
      console.log("🎫 Discount:", discount);
      console.log("💵 Final total:", total);
      
      // Place order with discounted total
      const result = await placeOrderForApproval(total);
      console.log("✅ Order placed successfully:", result);
      
      // No cart clearing here
      
      setOrderSuccess(true);
      setTimeout(() => {
        navigate("/order-status");
      }, 2000);
    } catch (err) {
      console.error("❌ Error placing order:", err);
      console.error("❌ Error details:", {
        message: err.message,
        stack: err.stack,
        cartItems: cartItems,
        total: total
      });
      setOrderError(err.message || "Failed to place order. Please try again.");
    }
  };

  const handleRemoveFromCart = (id) => {
    removeFromCart(id);
  };

  const handleUpdateQuantity = (id, quantity) => {
    updateQuantity(id, quantity);
  };

  return (
    <section className="mt-16 min-h-screen bg-gradient-to-r from-pink-400 to-purple-500 py-12 px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Shopping Cart</h1>
          <p className="text-white/80">Review your items and place your order</p>
        </div>

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
                    <p className="text-gray-800 font-medium mt-1">₹ {item.price}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.id, Number(e.target.value))}
                      className="w-16 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-center"
                    />
                    <p className="text-gray-800 font-medium">
                      ₹ {(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
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
                className="mt-4 inline-block px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors duration-300"
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
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                />
                <button
                  onClick={applyCoupon}
                  className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors duration-300"
                >
                  Apply
                </button>
              </div>
              {discount > 0 && (
                <p className="mt-3 text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Coupon applied! {(discount * 100)}% off
                </p>
              )}
            </div>

            {/* Cart Totals Section */}
            <div className="md:w-1/2 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Cart Totals</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹ {subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({(discount * 100)}%)</span>
                    <span>-₹ {(subtotal * discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold text-gray-800 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>₹ {total}</span>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}
              
              {orderError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {orderError}
                </div>
              )}
              
              <button
                className="w-full mt-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
                onClick={handlePlaceOrderForApproval}
                disabled={loading || cartItems.length === 0}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Place Order for Approval
                  </>
                )}
              </button>
              
              {orderSuccess && (
                <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Order placed successfully! Redirecting to order status...
                </div>
              )}
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Order Approval Process
                </h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Your order will be reviewed by our team</p>
                  <p>• We'll check stock availability and approve/reject</p>
                  <p>• You'll receive live status updates</p>
                  <p>• Once approved, you can proceed to checkout from order section</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}