import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const { cartItems } = useCart();

  const API_BASE = 'http://localhost:8000/api/cart';

  // Place order for approval
  const placeOrderForApproval = async (discountedTotal = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🚀 Starting order placement...');
      console.log('🔑 Token present:', token ? 'Yes' : 'No');
      console.log('📦 Cart items to send:', cartItems);
      console.log('💰 Discounted total:', discountedTotal);
      console.log('🌐 API URL:', `${API_BASE}/orders/`);
      
      if (!cartItems || cartItems.length === 0) {
        throw new Error('No items in cart to place order');
      }
      
      // Prepare order items data from cart
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));
      
      const orderData = {
        items: orderItems
      };
      
      // Add discounted total if provided
      if (discountedTotal !== null) {
        orderData.discounted_total = discountedTotal;
      }
      
      console.log('📤 Sending order data:', JSON.stringify(orderData, null, 2));
      
      const response = await fetch(`${API_BASE}/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Order placement error:', errorData);
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}: Failed to place order`);
      }

      const orderResponse = await response.json();
      console.log('✅ Order placed successfully:', orderResponse);
      setCurrentOrder(orderResponse);
      
      return orderResponse;
    } catch (err) {
      console.error('❌ Order placement exception:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get current order status
  const getOrderStatus = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/order-status/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const orderData = await response.json();
        setCurrentOrder(orderData);
        return orderData;
      } else if (response.status === 404) {
        // No order found
        setCurrentOrder(null);
        return null;
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
    }
  };

  // Proceed to checkout (only for approved orders)
  const proceedToCheckout = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/checkout/${orderId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to proceed to checkout');
      }

      const result = await response.json();
      console.log('Checkout successful:', result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin functions
  const getPendingOrders = async () => {
    if (!token) {
      console.log('No token available for getPendingOrders');
      return [];
    }
    
    try {
      console.log('Fetching pending orders from:', `${API_BASE}/admin/orders/`);
      const response = await fetch(`${API_BASE}/admin/orders/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Pending orders response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Pending orders data:', data);
        return data;
      } else {
        const errorData = await response.json();
        console.error('Pending orders error:', errorData);
        return [];
      }
    } catch (err) {
      console.error('Error fetching pending orders:', err);
      return [];
    }
  };

  const approveOrder = async (orderId, comment = '', shippingCharge = null) => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'approve', comment, shipping_charge: shippingCharge }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve order');
      }

      const result = await response.json();
      console.log('Order approved:', result);
      return result;
    } catch (err) {
      console.error('Error approving order:', err);
      throw err;
    }
  };

  const rejectOrder = async (orderId, comment = '') => {
    try {
      const response = await fetch(`${API_BASE}/admin/orders/${orderId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'reject', comment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject order');
      }

      const result = await response.json();
      console.log('Order rejected:', result);
      return result;
    } catch (err) {
      console.error('Error rejecting order:', err);
      throw err;
    }
  };

  // Clear current order (useful after checkout)
  const clearCurrentOrder = () => {
    setCurrentOrder(null);
    setError(null);
  };

  // Poll for order status updates
  useEffect(() => {
    if (currentOrder && currentOrder.status === 'pending') {
      const interval = setInterval(() => {
        getOrderStatus();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentOrder]);

  const value = {
    currentOrder,
    loading,
    error,
    placeOrderForApproval,
    getOrderStatus,
    proceedToCheckout,
    getPendingOrders,
    approveOrder,
    rejectOrder,
    clearCurrentOrder,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}; 