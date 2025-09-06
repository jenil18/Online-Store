import React, { useState, useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Clock, Package, User, MapPin, DollarSign } from 'lucide-react';

const AdminApproval = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [shippingCharges, setShippingCharges] = useState({});
  const [orderTotals, setOrderTotals] = useState({});
  
  const { getPendingOrders, approveOrder, rejectOrder } = useOrder();
  const { user } = useAuth();

  console.log('AdminApproval component rendered, user:', user);

  useEffect(() => {
    console.log('AdminApproval useEffect triggered');
    loadPendingOrders();
    // Refresh every 20 minutes
    const interval = setInterval(loadPendingOrders, 1200000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingOrders = async () => {
    try {
      console.log('Loading pending orders...');
      const orders = await getPendingOrders();
      console.log('Pending orders loaded:', orders);
      
      // Add debugging for each order
      if (orders && orders.length > 0) {
        orders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            user: order.user_username,
            total: order.total,
            status: order.status,
            items: order.items?.length || 0,
            address: order.address
          });
        });
      }
      
      setPendingOrders(orders);
    } catch (err) {
      console.error('Error loading pending orders:', err);
      setError('Failed to load pending orders');
    } finally {
      setLoading(false);
    }
  };

  const handleShippingChargeChange = (orderId, value) => {
    setShippingCharges((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleAddShippingCharge = (order) => {
    const charge = parseInt(shippingCharges[order.id] || 0) || 0;
    setOrderTotals((prev) => ({ ...prev, [order.id]: (parseFloat(order.total) + charge) }));
    // Optionally, you can update the order in state to reflect the new shipping charge
    setPendingOrders((prev) => prev.map(o => o.id === order.id ? { ...o, shipping_charge: charge } : o));
  };

  const handleAction = async (orderId, action) => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage('');
    const shippingCharge = parseInt(shippingCharges[orderId] || 0) || 0;
    try {
      if (action === 'approve') {
        await approveOrder(orderId, comment, shippingCharge);
        setSuccessMessage('Order approved successfully!');
      } else {
        await rejectOrder(orderId, comment);
        setSuccessMessage('Order rejected successfully!');
      }
      await loadPendingOrders();
      setSelectedOrder(null);
      setComment('');
      setShippingCharges((prev) => ({ ...prev, [orderId]: '' }));
      setOrderTotals((prev) => ({ ...prev, [orderId]: undefined }));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return `px-3 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.pending}`;
  };

  if (loading) {
    return (
      <section className="mt-40 min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-pink-400 to-purple-500 text-white p-4">
        <div className="bg-white text-black p-8 rounded-2xl shadow-2xl w-full max-w-6xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading pending orders...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-16 md:pt-28 px-2 sm:px-4 py-4 sm:py-8 bg-gradient-to-r from-pink-400 to-purple-500 text-white">
      <div className="bg-white text-black p-8 rounded-2xl shadow-2xl w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-pink-600 mb-2">Admin Order Approval</h1>
            <p className="text-gray-600">Manage and approve customer orders</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Welcome,</div>
            <div className="text-lg font-semibold text-pink-600">{user?.username}</div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Package className="w-6 h-6 mr-2 text-pink-600" />
              Pending Orders ({pendingOrders.length})
            </h2>
            <button
              onClick={loadPendingOrders}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Orders</h3>
              <p className="text-gray-600">All orders have been processed!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <div className="bg-pink-100 p-3 rounded-full mr-4">
                        <Package className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          Order #{order.id}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Created: {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={getStatusBadge(order.status)}>
                      {order.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                      {order.status === 'approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {order.status === 'rejected' && <XCircle className="w-3 h-3 inline mr-1" />}
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2 text-pink-600" />
                        Customer Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600"><strong>User:</strong> {order.user_username || 'Unknown User'}</p>
                        <p className="text-gray-600"><strong>Name:</strong> {order.user_name || 'Unknown User'}</p>
                        <p className="text-gray-600 flex items-start">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 text-pink-600 flex-shrink-0" />
                          <span><strong>Address:</strong> {order.address || 'Address not provided'}</span>
                        </p>
                        <p className="text-gray-600 flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-pink-600" />
                          <span><strong>Total:</strong> ₹{order.total || 0}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-pink-600" />
                        Order Items
                      </h4>
                      <div className="space-y-2">
                        {order.items.length > 0 ? (
                          order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                <b>{item.product?.name || 'Unknown Product'}</b> x {item.quantity || 0}
                              </span>
                              <span className="text-gray-800 font-semibold">
                                ₹{((item.product?.price || 0) * (item.quantity || 0))}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm italic">
                            No items found for this order
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Shipping Charge"
                        value={shippingCharges[order.id] || order.shipping_charge || ''}
                        onChange={e => handleShippingChargeChange(order.id, e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-40"
                      />
                      <button
                        onClick={() => handleAddShippingCharge(order)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Shipping Charge
                      </button>
                      <input
                        type="text"
                        placeholder="Add a comment (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleAction(order.id, 'approve')}
                        disabled={actionLoading}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                      >
                        {actionLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(order.id, 'reject')}
                        disabled={actionLoading}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                      >
                        {actionLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <span>Product Total: ₹{order.total}</span>
                      {((order.shipping_charge && parseInt(order.shipping_charge) > 0) || (shippingCharges[order.id] && parseInt(shippingCharges[order.id]) > 0)) && (
                        <span className="ml-4">Shipping Charge: ₹{shippingCharges[order.id] || order.shipping_charge}</span>
                      )}
                      <span className="ml-4 font-bold">Total: ₹{orderTotals[order.id] || (order.total && order.shipping_charge ? (parseFloat(order.total) + parseInt(order.shipping_charge)).toFixed(2) : order.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-gray-500 text-sm bg-gray-50 rounded-lg p-4">
          <p className="flex items-center justify-center">
            <Clock className="w-4 h-4 mr-2" />
            Orders will automatically refresh every 20 minutes
          </p>
        </div>

        {/* Debug Section - Remove in production */}
        {process.env.NODE_ENV === 'development' && pendingOrders.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Information</h3>
            <details className="text-sm">
              <summary className="cursor-pointer text-yellow-700">Raw Order Data</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                {JSON.stringify(pendingOrders, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminApproval; 