import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: {}, // { brand: { order: [], timestamp, productIds: [] } }
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const shopOrderSlice = createSlice({
  name: 'shopOrder',
  initialState,
  reducers: {
    setOrder(state, action) {
      const { brand, order, timestamp, productIds } = action.payload;
      state.orders[brand] = { order, timestamp, productIds };
    },
    clearOrder(state, action) {
      delete state.orders[action.payload.brand];
    },
  },
});

export const { setOrder, clearOrder } = shopOrderSlice.actions;
export const ORDER_EXPIRY_MS = TWENTY_FOUR_HOURS;
export default shopOrderSlice.reducer; 