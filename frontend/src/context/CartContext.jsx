import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  const API_BASE = 'http://localhost:8000/api';

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
          id: item.id,
          name: item.product.name,
          price: parseFloat(item.product.price),
          image: item.product.image,
          quantity: item.quantity,
          brand: item.product.category
        }));
        
        // Merge with local cart items, giving priority to local items
        setCartItems(prevItems => {
          const merged = [...prevItems];
          backendCartItems.forEach(backendItem => {
            const existingIndex = merged.findIndex(item => item.id === backendItem.id);
            if (existingIndex === -1) {
              merged.push(backendItem);
            }
          });
          return merged;
        });
      }
    } catch (err) {
      console.error('Error loading cart items:', err);
    }
  };

  // Sync local cart to backend
  const syncCartToBackend = async () => {
    if (!token || cartItems.length === 0) {
      console.log('No token or cart items, skipping sync');
      return;
    }

    try {
      console.log('Syncing cart to backend, items:', cartItems);
      
      // First, clear existing cart items in backend
      const existingResponse = await fetch(`${API_BASE}/cart/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (existingResponse.ok) {
        const existingItems = await existingResponse.json();
        console.log('Existing cart items in backend:', existingItems);
        
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
        console.log('Adding item to backend:', item);
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
        } else {
          console.log('Item added to backend successfully');
        }
      }
    } catch (err) {
      console.error('Error syncing cart to backend:', err);
    }
  };

  const addToCart = (product) => {
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
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: parseInt(quantity) || 1 } : item
      )
    );
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
    
    // Also clear cart from backend if user is logged in
    if (token) {
      try {
        console.log('Clearing cart from backend...');
        const response = await fetch(`${API_BASE}/cart/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const existingItems = await response.json();
          console.log('Found existing cart items in backend:', existingItems);
          
          // Delete each cart item from backend
          for (const item of existingItems) {
            await fetch(`${API_BASE}/cart/${item.id}/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          }
          console.log('✅ Cart cleared from backend successfully');
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
      loadCartItems();
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
