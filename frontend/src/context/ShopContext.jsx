import React, { createContext, useContext, useState, useEffect } from 'react';

const SHOP_BRAND_KEY = 'shop_selected_brand_v2';
const SHOP_ORDER_KEY_PREFIX = 'shop_random_order_v4_';
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  // Get initial brand from localStorage
  const [selectedBrand, setSelectedBrand] = useState(() => {
    return localStorage.getItem(SHOP_BRAND_KEY) || 'Orane';
  });

  // Store brand orders in state to prevent recalculation
  const [brandOrders, setBrandOrders] = useState({});

  // Persist selected brand
  useEffect(() => {
    localStorage.setItem(SHOP_BRAND_KEY, selectedBrand);
  }, [selectedBrand]);

  const getOrSetRandomOrder = (productsForBrand, brand) => {
    // First check if we have the order in state
    if (brandOrders[brand]) {
      const { order, timestamp, productIds } = brandOrders[brand];
      const currentProductIds = productsForBrand.map(p => p.id).sort().join(',');
      
      // If product set hasn't changed and order hasn't expired, use cached order
      if (productIds === currentProductIds && Date.now() - timestamp < TWELVE_HOURS) {
        return order;
      }
    }

    // Otherwise, check localStorage
    const storageKey = SHOP_ORDER_KEY_PREFIX + brand;
    let storedData = null;
    try {
      storedData = JSON.parse(localStorage.getItem(storageKey));
    } catch (e) {
      storedData = null;
    }

    const productIds = productsForBrand.map(p => p.id).sort().join(',');
    const now = Date.now();
    let shouldReshuffle = true;

    if (storedData && 
        Array.isArray(storedData.order) &&
        storedData.productIds === productIds &&
        now - storedData.timestamp < TWELVE_HOURS) {
      shouldReshuffle = false;
    }

    let order;
    if (shouldReshuffle) {
      // Create new random order
      order = productsForBrand.map(p => p.id);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }

      // Save to localStorage and state
      const orderData = { order, timestamp: now, productIds };
      localStorage.setItem(storageKey, JSON.stringify(orderData));
      setBrandOrders(prev => ({
        ...prev,
        [brand]: orderData
      }));
    } else {
      order = storedData.order;
      // Update state cache
      setBrandOrders(prev => ({
        ...prev,
        [brand]: storedData
      }));
    }

    return order;
  };

  const value = {
    selectedBrand,
    setSelectedBrand,
    getOrSetRandomOrder
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}; 