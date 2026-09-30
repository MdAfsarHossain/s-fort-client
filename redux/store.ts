import { configureStore } from "@reduxjs/toolkit";

import { baseApi } from "@/redux/api/baseApi";
import accessReducer from "@/redux/features/accessSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    access: accessReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
