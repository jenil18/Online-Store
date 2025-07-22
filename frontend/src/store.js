import { configureStore } from '@reduxjs/toolkit';
import shopOrderReducer from './shopOrderSlice';
import productsReducer from './productsSlice';

// LocalStorage persistence helpers
const SHOP_ORDER_STORAGE_KEY = 'shopOrderReduxState';

function loadShopOrderState() {
  try {
    const serializedState = localStorage.getItem(SHOP_ORDER_STORAGE_KEY);
    if (!serializedState) return undefined;
    return { shopOrder: JSON.parse(serializedState) };
  } catch (e) {
    return undefined;
  }
}

function saveShopOrderState(state) {
  try {
    const serializedState = JSON.stringify(state.shopOrder);
    localStorage.setItem(SHOP_ORDER_STORAGE_KEY, serializedState);
  } catch (e) {
    // Ignore write errors
  }
}

const store = configureStore({
  reducer: {
    shopOrder: shopOrderReducer,
    products: productsReducer,
  },
  preloadedState: loadShopOrderState(),
});

store.subscribe(() => {
  saveShopOrderState(store.getState());
});

export default store; 