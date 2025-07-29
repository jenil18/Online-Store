import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  const API_BASE = process.env.REACT_APP_API_URL + "/api/cart";

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem('cartItems');
      }
    }
  }, []);

  // Save cart items to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Load cart items from backend when user logs in
  const loadCartItems = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/cart/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        const backendCartItems = data.map(item => ({
          id: item.product.id, // Use product.id instead of item.id
          name: item.product.name,
          price: parseFloat(item.product.price),
          image: item.product.image,
          quantity: item.quantity,
          brand: item.product.category
        }));
        
        // Only replace if backend has items, otherwise keep local cart
        if (backendCartItems.length > 0) {
          setCartItems(backendCartItems);
        }
      }
    } catch (err) {
      console.error('Error loading cart items:', err);
    }
  };

  // Force refresh cart from backend
  const refreshCart = async () => {
    if (!token) return;
    await loadCartItems();
  };

  // Sync local cart to backend
  const syncCartToBackend = async () => {
    if (!token) return;

    try {
      // First, clear existing cart items in backend
      const existingResponse = await fetch(`${API_BASE}/cart/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (existingResponse.ok) {
        const existingItems = await existingResponse.json();
        
        for (const item of existingItems) {
          await fetch(`${API_BASE}/cart/${item.id}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      }

      // Add current cart items to backend
      for (const item of cartItems) {
        const response = await fetch(`${API_BASE}/cart/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: item.id,
            quantity: item.quantity
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Error adding item to backend:', error);
        }
      }
    } catch (err) {
      console.error('Error syncing cart to backend:', err);
    }
  };

  const addToCart = async (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    
    // Sync to backend after adding
    if (token) {
      setTimeout(() => syncCartToBackend(), 100);
    }
  };

  const removeFromCart = async (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    
    // Sync to backend after removing
    if (token) {
      setTimeout(() => syncCartToBackend(), 100);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }
    
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: parseInt(quantity) || 1 } : item
      )
    );
    
    // Sync to backend after updating
    if (token) {
      setTimeout(() => syncCartToBackend(), 100);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
    
    // Also clear cart from backend if user is logged in
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/cart/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const existingItems = await response.json();
          
          // Delete each cart item from backend
          for (const item of existingItems) {
            await fetch(`${API_BASE}/cart/${item.id}/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          }
        }
      } catch (err) {
        console.error('Error clearing cart from backend:', err);
      }
    }
  };

  // Local checkout: just clear cart
  const checkout = async () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
  };

  // Load cart items when user logs in
  useEffect(() => {
    if (token && user) {
      // Small delay to ensure user is fully loaded
      setTimeout(() => {
        loadCartItems();
      }, 500);
    }
  }, [token, user]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        checkout,
        clearCart,
        syncCartToBackend,
        loading,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
