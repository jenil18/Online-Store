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

  // Validate cart item
  const validateCartItem = (item) => {
    return item && item.id && item.name && item.price && item.quantity > 0;
  };

  // Merge carts with frontend priority
  const mergeCarts = (localCart, backendCart) => {
    const merged = [...localCart];
    
    // Add backend items that don't exist in local cart
    backendCart.forEach(backendItem => {
      const exists = merged.find(localItem => localItem.id === backendItem.id);
      if (!exists && validateCartItem(backendItem)) {
        merged.push(backendItem);
      }
    });
    
    return merged;
  };

  // Load cart items from backend when user logs in (with localStorage priority)
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
        
        const backendCartItems = data
          .filter(item => item.product && validateCartItem({
            id: item.product.id,
            name: item.product.name,
            price: parseFloat(item.product.price),
            image: item.product.image,
            quantity: item.quantity,
            brand: item.product.category
          }))
          .map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: parseFloat(item.product.price),
            image: item.product.image,
            quantity: item.quantity,
            brand: item.product.category
          }));
        
        // Merge with existing local cart (local cart takes priority)
        const currentLocalCart = cartItems;
        const mergedCart = mergeCarts(currentLocalCart, backendCartItems);
        
        if (mergedCart.length !== currentLocalCart.length) {
          setCartItems(mergedCart);
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

  // Sync local cart to backend (only when user is logged in)
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

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
  };

  // Clear cart completely (local + backend)
  const clearCartCompletely = async () => {
    // Clear local cart
    setCartItems([]);
    localStorage.removeItem('cartItems');
    
    // Clear backend cart if user is logged in
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/cart/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const existingItems = await response.json();
          
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
    }
  };

  // Local checkout: just clear cart
  const checkout = () => {
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
        clearCartCompletely,
        syncCartToBackend,
        loading,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
