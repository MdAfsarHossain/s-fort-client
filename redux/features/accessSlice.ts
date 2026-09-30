import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AccessState {
  blockedMessage: string | null;
}

const initialState: AccessState = {
  blockedMessage: null,
};

const accessSlice = createSlice({
  name: "access",
  initialState,
  reducers: {
    setAccountBlocked: (state, action: PayloadAction<string>) => {
      state.blockedMessage = action.payload;
    },
    clearAccountBlocked: (state) => {
      state.blockedMessage = null;
    },
  },
});

export const { setAccountBlocked, clearAccountBlocked } = accessSlice.actions;
export default accessSlice.reducer;
