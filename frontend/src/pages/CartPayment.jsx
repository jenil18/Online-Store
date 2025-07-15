import React from "react";
import { useCart } from "../context/CartContext";

const CartPayment = () => {
  const { cartItems } = useCart();
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const API_BASE = process.env.REACT_APP_API_URL;

  return (
    <section className="mt-40 min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4">
      <div className="bg-white text-black p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        <h1 className="text-3xl mb-6 font-bold text-center text-pink-600">Payment</h1>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">Invoice</h2>
          <div className="bg-gray-100 rounded-lg p-4 shadow-inner">
            {cartItems.length === 0 ? (
              <div className="text-center text-gray-500">No items in cart.</div>
            ) : (
              <>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-gray-600 border-b">
                      <th className="py-2 text-left">Product</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="py-2 flex items-center gap-2">
                          <img src={item.image && !item.image.startsWith('http') ? `${API_BASE}/media/${item.image}` : item.image} alt={item.name} className="w-8 h-8 rounded object-cover" />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">₹ {(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center font-semibold text-lg mt-2">
                  <span>Total</span>
                  <span className="text-pink-600">₹ {subtotal}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">Choose your payment method</h2>
          <div className="flex flex-col gap-4">
            <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow">Stripe (Card)</button>
            <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow">Razorpay (UPI/Card)</button>
            <button className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-semibold shadow">PayPal</button>
          </div>
        </div>
        <div className="text-center text-gray-500 text-xs mt-4">
          <em>Payment gateway integration coming soon!</em>
        </div>
      </div>
    </section>
  );
};

export default CartPayment; 