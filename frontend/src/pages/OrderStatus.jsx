import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import { CheckCircle, XCircle, Clock, Package, User, MapPin, DollarSign, RefreshCw } from 'lucide-react';
import PaymentPage from './PaymentPage';

const OrderStatus = () => {
  const navigate = useNavigate();
  const { currentOrder, loading, error, getOrderStatus } = useOrder();
  const { clearCart } = useCart();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [paymentOrderData, setPaymentOrderData] = useState(null);
   const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL + "/api/cart";

  useEffect(() => {
    getOrderStatus();
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/order-history/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrderHistory(data);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
    }
  };

  // Razorpay payment handler
  const handleProceedToCheckout = async () => {
    setPaymentLoading(true);
    setPaymentError("");
    try {
      // 1. Call backend to create Razorpay order
      const API_BASE = process.env.REACT_APP_API_URL;
      const response = await fetch(`${API_BASE}/api/cart/orders/${currentOrder.id}/razorpay-order/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create Razorpay order');
      setPaymentOrderData(data);
      setShowPaymentPage(true);
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRefresh = () => {
    getOrderStatus();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'approved':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <section className="mt-20 min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4">
        <div className="bg-white text-black p-8 rounded-2xl shadow-2xl w-full max-w-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading order status...</p>
        </div>
      </section>
    );
  }

  if (!currentOrder) {
    return (
      <section className="mt-20 min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4">
        <div className="bg-white text-black p-8 rounded-2xl shadow-2xl w-full max-w-lg text-center">
          <div className="text-6xl mb-6">📦</div>
          <h1 className="text-3xl mb-6 font-bold text-pink-600">No Order Found</h1>
          <p className="text-gray-600 mb-6">You don't have any pending orders.</p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-semibold"
          >
            Go to Cart
          </button>
        </div>
      </section>
    );
  }

  if (showPaymentPage && paymentOrderData) {
    return (
      <PaymentPage
        order={currentOrder}
        paymentOrderData={paymentOrderData}
        onSuccess={async (response) => {
          try {
            // Call backend to mark payment as completed
            const completionResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/${currentOrder.id}/complete-payment/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id
              }),
            });
            if (!completionResponse.ok) {
              console.error('Failed to mark payment as completed');
            }
            // Fetch the latest order data (now completed)
            const orderData = await completionResponse.json();
            // Redirect to payment success page with latest order data
            navigate('/payment-success', { state: { order: { ...currentOrder, ...orderData } } });
          } catch (error) {
            console.error('Error completing payment:', error);
            // Redirect to payment success page with fallback order data
            navigate('/payment-success', { state: { order: currentOrder } });
          }
          setPaymentSuccess(false);
          setShowPaymentPage(false);
          setPaymentOrderData(null);
        }}
        onError={setPaymentError}
      />
    );
  }

  return (
    <section className="mt-20 min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4">
      <div className="bg-white text-black p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2 font-bold text-pink-600">Order Status</h1>
          <p className="text-gray-600">Track your order progress</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-pink-100 p-3 rounded-full mr-4">
                <Package className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Order #{currentOrder.id}</h2>
                <p className="text-gray-600 text-sm">Created: {new Date(currentOrder.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <span className={`px-3 py-2 rounded-full text-sm font-semibold border flex items-center ${getStatusColor(currentOrder.status)}`}>
              {getStatusIcon(currentOrder.status)}
              <span className="ml-1">
                {currentOrder.status ? currentOrder.status.toUpperCase() : "UNKNOWN"}
              </span>
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2 text-pink-600" />
              Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-pink-600" />
                <span><strong>Product Total:</strong> ₹{currentOrder.total}</span>
              </p>
              <p className="text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-pink-600" />
                <span><strong>Shipping Charge:</strong> ₹{currentOrder.shipping_charge ? currentOrder.shipping_charge : 0}</span>
              </p>
              <p className="text-gray-800 flex items-center font-bold">
                <DollarSign className="w-4 h-4 mr-2 text-pink-600" />
                <span>Total: ₹{currentOrder.shipping_charge && parseFloat(currentOrder.shipping_charge) > 0 ? (parseFloat(currentOrder.total) + parseFloat(currentOrder.shipping_charge)).toFixed(2) : currentOrder.total}</span>
              </p>
              <p className="text-gray-600 flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-pink-600 flex-shrink-0" />
                <span><strong>Address:</strong> {currentOrder.address}</span>
              </p>
              {currentOrder.decision_time && (
                <p className="text-gray-600">
                  <strong>Approved Date:</strong> {new Date(currentOrder.decision_time).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {currentOrder.items && currentOrder.items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Package className="w-4 h-4 mr-2 text-pink-600" />
                Items
              </h3>
              <div className="space-y-2">
                {currentOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600"><b>{item.product?.name || 'Unknown Product'}</b> x {item.quantity}</span>
                    <span className="text-gray-800 font-semibold">₹{(item.product?.price || 0) * (item.quantity || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentOrder.admin_comment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Admin Comment
              </h3>
              <p className="text-blue-700">{currentOrder.admin_comment}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {currentOrder.status === 'pending' && (
            <div className="text-center">
              <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Under Review</h3>
              <p className="text-gray-600 mb-4">Your order is being reviewed by our admin team. Please wait...</p>
              <button
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </button>
            </div>
          )}

          {currentOrder.status === 'approved' && (
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">Order Approved!</h3>
              <p className="text-gray-600 mb-4">Your order has been approved and is ready for checkout.</p>
              <button
                onClick={handleProceedToCheckout}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold w-full flex items-center justify-center"
                disabled={paymentLoading}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {paymentLoading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          )}

          {currentOrder.status === 'rejected' && (
            <div className="text-center">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">Order Rejected</h3>
              <p className="text-gray-600 mb-4">Your order has been rejected due to unavailability of some products. Please try again after few days!</p>
              <button
                onClick={() => navigate('/cart')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold w-full"
              >
                Go to Cart
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4 text-pink-600">Order History</h2>
        {orderHistory.length === 0 ? (
          <p className="text-gray-600">No past orders found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {orderHistory.map(order => (
              <li key={order.id} className="py-2 flex justify-between items-center">
                <span>Order #{order.id} - Status: <span className="font-semibold">{order.status}</span></span>
                <span>Total: ₹{order.total}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default OrderStatus; 