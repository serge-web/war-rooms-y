import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import App from './App';
import { seedMockData } from './utils/seedMockData';

// Seed mock data on first load
const hasSeeded = localStorage.getItem('war-rooms-mock-seeded');
if (!hasSeeded) {
  void seedMockData().then(() => {
    localStorage.setItem('war-rooms-mock-seeded', 'true');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CssBaseline />
    <App />
  </React.StrictMode>
);
