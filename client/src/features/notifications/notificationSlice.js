import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [], // array of notification objects: { id, title, defaultIcon, time, read }
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.list.unshift({
        id: Date.now().toString(),
        time: new Date().toISOString(),
        read: false,
        ...action.payload,
      });
      state.unreadCount += 1;
      
      // Limit to 50 notifications in memory to prevent leaks
      if (state.list.length > 50) {
        state.list.pop();
      }
    },
    markAllAsRead: (state) => {
      state.list.forEach((n) => { n.read = true; });
      state.unreadCount = 0;
    },
    clearAll: (state) => {
      state.list = [];
      state.unreadCount = 0;
    }
  },
});

export const { addNotification, markAllAsRead, clearAll } = notificationSlice.actions;
export default notificationSlice.reducer;
