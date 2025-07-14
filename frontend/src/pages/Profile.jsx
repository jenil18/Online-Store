import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Package, DollarSign, Calendar, MapPin } from "lucide-react";

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editableUser, setEditableUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user) {
      setEditableUser(user);
      fetchOrderHistory();
    }
  }, [user]);

  const fetchOrderHistory = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch('http://localhost:8000/api/cart/order-history/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const orders = await response.json();
        setOrderHistory(orders);
      } else {
        console.error('Failed to fetch order history');
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await updateProfile(editableUser);
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!editableUser) return <div>Loading profile...</div>;

  return (
    <section className="min-h-screen bg-gray-400 py-16 px-4 md:px-20">
      <div className="mt-[50px] max-w-5xl mx-auto bg-white p-8 rounded-3xl shadow-lg">
        <h1 className="text-4xl font-bold mb-8 text-center">My Profile</h1>

        {/* Profile Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Profile Details</h2>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                {["username", "email", "phone", "altPhone", "salon", "address", "city"].map((field) => (
                  <div key={field}>
                    <label className="block text-gray-600 capitalize">{field}</label>
                    <input
                      type="text"
                      name={field}
                      value={editableUser[field] || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-gray-400"
                    />
                  </div>
                ))}
                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && <div className="text-green-600 text-sm">{success}</div>}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-black text-white hover:bg-gray-600 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-gray-700 text-lg">
                {["username", "email", "phone", "altPhone", "salon", "address", "city"].map((field) => (
                  <p key={field}>
                    <span className="font-semibold capitalize">{field}:</span>{" "}
                    {editableUser[field] || "—"}
                  </p>
                ))}
                <div className="text-center">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 px-6 py-2 rounded-full bg-black text-white hover:bg-black/40 transition"
                  >
                    Edit Profile
                  </button>
                </div>
                 {/* Logout */}
                  <div className="text-center">
                    <button
                      onClick={handleLogout}
                      className="px-8 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                    >
                      Logout
                    </button>
                  </div>
              </div>
            )}
          </div>

          {/* Order History */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Order History</h2>
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : orderHistory.length === 0 ? (
                <div className="text-gray-600 italic">No orders found.</div>
              ) : (
                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="bg-gray-50 p-6 rounded-lg shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Order #{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.toUpperCase()}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-gray-700 text-sm">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          <span><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                          <span><strong>Total:</strong> ₹{order.total}</span>
                        </div>
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-500" />
                          <span><strong>Items:</strong> {order.items?.length || 0} products</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span><strong>Address:</strong> {order.address}</span>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="mt-4 p-3 bg-white rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Items:</h4>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.product?.name || 'Product'} x {item.quantity}</span>
                                <span className="font-semibold">₹{(item.product?.price || 0) * (item.quantity || 0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

       
      </div>
    </section>
  );
};

export default Profile;
