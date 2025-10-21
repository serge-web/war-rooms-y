import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import App from './App';
import { seedMockData } from './utils/seedMockData';

// Seed mock data on first load (T032)
const STORAGE_NAMESPACE = import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms';
const hasSeeded = localStorage.getItem(`${STORAGE_NAMESPACE}:seeded`);
if (!hasSeeded) {
  void seedMockData().then(() => {
    localStorage.setItem(`${STORAGE_NAMESPACE}:seeded`, 'true');
    console.info('✅ Chat UI: Mock data seeded (XMPP + REST)');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CssBaseline />
    <App />
  </React.StrictMode>
);
