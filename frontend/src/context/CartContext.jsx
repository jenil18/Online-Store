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
        
        // Validate and filter cart items
        const validCartItems = data
          .filter(item => item.product && item.product.id && item.product.name)
          .map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: parseFloat(item.product.price) || 0,
            image: item.product.image || '',
            quantity: parseInt(item.quantity) || 1,
            brand: item.product.category || ''
          }));
        
        // Only replace if backend has valid items
        if (validCartItems.length > 0) {
          console.log('Loading cart items from backend:', validCartItems);
          setCartItems(validCartItems);
        } else {
          console.log('No valid cart items found in backend, keeping local cart');
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

  // Reset cart completely - clear both local and backend
  const resetCart = async () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
    
    if (token) {
      await clearBackendCart();
    }
  };

  // Clear backend cart completely
  const clearBackendCart = async () => {
    if (!token) return;
    
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
      console.error('Error clearing backend cart:', err);
    }
  };

  // Sync local cart to backend
  const syncCartToBackend = async () => {
    if (!token) return;

    try {
      // First, clear existing cart items in backend
      await clearBackendCart();

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
    // Remove from local state immediately
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    
    // Also remove from backend immediately
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/cart/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const existingItems = await response.json();
          
          // Find and delete the specific item
          for (const item of existingItems) {
            if (item.product.id === id) {
              await fetch(`${API_BASE}/cart/${item.id}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              break;
            }
          }
        }
      } catch (err) {
        console.error('Error removing item from backend:', err);
      }
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
      await clearBackendCart();
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
        resetCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
