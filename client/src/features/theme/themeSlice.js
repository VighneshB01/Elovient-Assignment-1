import { createSlice } from '@reduxjs/toolkit';

// Theme persisted in localStorage so it survives refresh
const savedTheme = localStorage.getItem('theme') || 'light';

// Apply theme to <html> element on load
document.documentElement.setAttribute('data-theme', savedTheme);

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: savedTheme },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
      document.documentElement.setAttribute('data-theme', state.mode);
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
