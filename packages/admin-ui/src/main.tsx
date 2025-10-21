import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createStorage, seedTestWargame } from '@war-rooms/backend-mock';

// Seed unified mock data on first load
const STORAGE_NAMESPACE = import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms';
const hasSeededAdmin = localStorage.getItem(`${STORAGE_NAMESPACE}:admin-seeded`);

if (!hasSeededAdmin) {
  const storage = createStorage({
    backend: 'localStorage',
    namespace: STORAGE_NAMESPACE,
  });

  // Seed unified wargame data (includes users with passwords)
  void seedTestWargame(storage).then(() => {
    localStorage.setItem(`${STORAGE_NAMESPACE}:admin-seeded`, 'true');
    console.info('✅ Admin UI: Unified wargame data seeded');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
