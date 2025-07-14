import React, { useEffect, useState } from 'react';

const PaymentPage = ({ order, paymentOrderData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const handlePayNow = async () => {
    setLoading(true);
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      const options = {
        key: paymentOrderData.key_id,
        amount: paymentOrderData.amount,
        currency: paymentOrderData.currency,
        name: 'Shree Krishna Beauty Products',
        description: `Order #${order.id}`,
        order_id: paymentOrderData.razorpay_order_id,
        handler: function (response) {
          console.log('Payment successful:', response);
          onSuccess(response);
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#F37254'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4">
      <div className="bg-white text-black p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2 font-bold text-pink-600">Payment</h1>
          <p className="text-gray-600">Complete your payment for Order #{order.id}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600"><b>💰Product Price:</b> ₹{order.total}</p>
            <p className="text-gray-600"><b>🎫 Shipping:</b> ₹{order.shipping_charge ? order.shipping_charge : 0}</p>
            <p className="text-gray-600"><b>💵Total:</b> ₹{order.shipping_charge && parseFloat(order.shipping_charge) > 0 ? (parseFloat(order.total) + parseFloat(order.shipping_charge)).toFixed(2) : order.total}</p>
            <p className="text-gray-600"><b>Address:</b> {order.address}</p>
          </div>
        </div>
        <button
          onClick={handlePayNow}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-full font-semibold text-lg shadow-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </section>
  );
};

export default PaymentPage; 