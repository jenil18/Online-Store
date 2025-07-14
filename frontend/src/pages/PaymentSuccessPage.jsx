import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, MapPin, DollarSign, Download, Home, ShoppingBag, Star } from 'lucide-react';
// Remove import './PaymentSuccessPage.css';

const BURST_COUNT = 7;
const CONFETTI_PER_BURST = 16;
const CONFETTI_COLORS = [
  'bg-pink-400', 'bg-yellow-300', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-300', 'bg-red-400', 'bg-teal-300'
];
const CONFETTI_SHAPES = ['palate', 'ribbon'];

const PaymentSuccessPage = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Prefer props, fallback to location.state
  const order = props.order || (location.state && location.state.order);
  const [orderNumber] = useState(`ORD-${Date.now()}`);
  const [bursts, setBursts] = useState(() =>
    Array.from({ length: BURST_COUNT }).map((_, i) => ({
      id: i,
      left: 8 + Math.random() * 84, // percent
      confetti: Array.from({ length: CONFETTI_PER_BURST }).map((_, j) => ({
        id: j,
        angle: Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 1.5, // mostly downward
        distance: 60 + Math.random() * 60, // px
        color: CONFETTI_COLORS[j % CONFETTI_COLORS.length],
        size: 10 + Math.random() * 12,
        delay: Math.random() * 0.2,
        shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
        rotate: Math.random() * 360,
      })),
    }))
  );
  const [showBursts, setShowBursts] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!showBursts) return;
    const timer = setTimeout(() => setShowBursts(false), 2500);
    return () => clearTimeout(timer);
  }, [showBursts]);

  const handleDownloadReceipt = () => {
    const receiptContent = `
      SHREE KRISHNA BEAUTY PRODUCTS
      ===============================
      
      Receipt Number: ${orderNumber}
      Order ID: ${order.id}
      Date: ${new Date().toLocaleDateString()}
      Time: ${new Date().toLocaleTimeString()}
      
      ===============================
      ITEMS:
      ${order.items?.map(item => 
        `${item.product?.name || 'Product'} x ${item.quantity} = ₹${(item.product?.price || 0) * (item.quantity || 0)}`
      ).join('\n')}
      
      ===============================
      Subtotal: ₹${order.total}
      Shipping: ₹${order.shipping_charge || 0}
      Total: ₹${order.shipping_charge && parseFloat(order.shipping_charge) > 0 ? 
        (parseFloat(order.total) + parseFloat(order.shipping_charge)).toFixed(2) : order.total}
      
      ===============================
      Payment Status: ✅ PAID
      Payment Method: Razorpay
      
      ===============================
      Delivery Address:
      ${order.address}
      
      ===============================
      Thank you for your purchase!
      We'll notify you when your order ships.
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderNumber}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">No Order Data</h2>
          <p className="text-gray-600">No payment/order information found. Please return to the home page.</p>
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 text-white p-4 pt-24 sm:pt-32 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Inline style for confetti burst animation */}
      <style>{`
        @keyframes confetti-burst {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          80% { opacity: 1; }
          100% { opacity: 0.7; transform: translate(var(--dx), var(--dy)) rotate(360deg); }
        }
      `}</style>
      {showBursts && (
        <div className="pointer-events-none absolute top-0 left-0 w-full h-full z-40">
          {/* Confetti bursts from top */}
          {bursts.map((burst) => (
            <span key={burst.id} className="absolute" style={{ left: `${burst.left}%`, top: '-8px', width: 0, height: 0 }}>
              {burst.confetti.map((c) => {
                const dx = Math.cos(c.angle) * c.distance;
                const dy = Math.sin(c.angle) * c.distance + 60;
                return (
                  <span
                    key={c.id}
                    className={`absolute ${c.color} shadow-lg opacity-80 ${c.shape === 'palate' ? 'rounded-sm' : 'rounded-full'}`}
                    style={{
                      left: 0,
                      top: 0,
                      width: c.shape === 'palate' ? `${c.size}px` : `${c.size * 0.5}px`,
                      height: c.shape === 'palate' ? `${c.size * 0.4}px` : `${c.size * 1.2}px`,
                      transform: `rotate(${c.rotate}deg)`,
                      '--dx': `${dx}px`,
                      '--dy': `${dy}px`,
                      animation: `confetti-burst 1.5s cubic-bezier(0.23, 1, 0.32, 1) ${c.delay}s 1 both`,
                    }}
                  />
                );
              })}
            </span>
          ))}
        </div>
      )}
      <div className="w-full max-w-2xl bg-white text-gray-900 rounded-3xl shadow-2xl p-8 mx-auto flex flex-col items-center relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-green-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-green-600 mb-2 text-center">Payment Successful!</h1>
          <p className="text-gray-700 text-lg text-center">Thank you for your purchase</p>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">Order #{order.id}</p>
            <p className="text-green-700 text-sm">Receipt: {orderNumber}</p>
          </div>
        </div>

        <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            Order Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Product Total:</span>
              <span className="font-semibold">₹{order.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-semibold">₹{order.shipping_charge || 0}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">Total Paid:</span>
              <span className="text-xl font-bold text-green-600">
                ₹{order.shipping_charge && parseFloat(order.shipping_charge) > 0 ? 
                  (parseFloat(order.total) + parseFloat(order.shipping_charge)).toFixed(2) : order.total}
              </span>
            </div>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="w-full bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Items Purchased</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded-full mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.product?.name || 'Product'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">x{item.quantity}</span>
                    <div className="font-semibold">₹{(item.product?.price || 0) * (item.quantity || 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-yellow-600" />
            Delivery Information
          </h3>
          <p className="text-gray-700">{order.address}</p>
          <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium">
              📦 We'll notify you when your order ships!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 w-full">
          <button
            onClick={handleDownloadReceipt}
            className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl w-full"
          >
            <Download className="w-5 h-5" />
            Download Receipt (.txt)
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl w-full"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>
        </div>

        <div className="flex flex-col items-center mt-4">
          <p className="text-lg text-gray-700 font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            We appreciate your trust in us!
          </p>
          <p className="text-sm text-gray-500 mt-2 text-center">If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </section>
  );
};

export default PaymentSuccessPage; 