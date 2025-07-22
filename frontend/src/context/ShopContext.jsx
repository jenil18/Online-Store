import React, { createContext, useContext, useState, useEffect } from 'react';

const SHOP_BRAND_KEY = 'shop_selected_brand_v2';

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

  useEffect(() => {
    localStorage.setItem(SHOP_BRAND_KEY, selectedBrand);
  }, [selectedBrand]);

  const value = {
    selectedBrand,
    setSelectedBrand,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};
