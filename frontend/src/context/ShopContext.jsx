import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
  const [selectedBrand, setSelectedBrand] = useState(() => {
    return localStorage.getItem(SHOP_BRAND_KEY) || 'Orane';
  });

  const inMemoryOrderCache = useRef({}); // <--- New: holds cached orders while app is open

  useEffect(() => {
    localStorage.setItem(SHOP_BRAND_KEY, selectedBrand);
  }, [selectedBrand]);

  const getOrSetRandomOrder = (productsForBrand, brand) => {
    const storageKey = SHOP_ORDER_KEY_PREFIX + brand;
    const productIds = productsForBrand.map(p => p.id).sort().join(',');
    const now = Date.now();

    // Check in-memory cache first
    if (
      inMemoryOrderCache.current[brand] &&
      inMemoryOrderCache.current[brand].productIds === productIds &&
      now - inMemoryOrderCache.current[brand].timestamp < TWELVE_HOURS
    ) {
      return inMemoryOrderCache.current[brand].order;
    }

    let storedData = null;
    try {
      storedData = JSON.parse(localStorage.getItem(storageKey));
    } catch (e) {
      storedData = null;
    }

    let shouldReshuffle = true;
    if (
      storedData &&
      Array.isArray(storedData.order) &&
      storedData.productIds === productIds &&
      now - storedData.timestamp < TWELVE_HOURS
    ) {
      shouldReshuffle = false;
    }

    let order;
    if (shouldReshuffle) {
      order = productsForBrand.map(p => p.id);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const newData = { order, timestamp: now, productIds };
      localStorage.setItem(storageKey, JSON.stringify(newData));
      inMemoryOrderCache.current[brand] = newData; // update cache
    } else {
      order = storedData.order;
      inMemoryOrderCache.current[brand] = storedData; // sync to cache
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
