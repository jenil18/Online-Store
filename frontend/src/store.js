import { configureStore } from '@reduxjs/toolkit';
import shopOrderReducer from './shopOrderSlice';

const store = configureStore({
  reducer: {
    shopOrder: shopOrderReducer,
  },
});

export default store; 