import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createStorage, seedAll, seedAdminUsers } from '@war-rooms/backend-mock';

// Seed unified mock data on first load (T033)
const STORAGE_NAMESPACE = import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms';
const hasSeededAdmin = localStorage.getItem(`${STORAGE_NAMESPACE}:admin-seeded`);

if (!hasSeededAdmin) {
  const storage = createStorage({
    backend: 'localStorage',
    namespace: STORAGE_NAMESPACE,
  });

  void Promise.all([
    // Seed unified XMPP + REST data
    seedAll(storage, {
      rest: true,
      domain: import.meta.env.VITE_MOCK_DOMAIN || 'wargame.local',
      conferenceService: import.meta.env.VITE_MOCK_CONFERENCE || 'conference.wargame.local',
    }),
    // Also seed admin users with passwords for admin UI login
    seedAdminUsers(storage),
  ]).then(() => {
    localStorage.setItem(`${STORAGE_NAMESPACE}:admin-seeded`, 'true');
    console.info('✅ Admin UI: Mock data seeded (XMPP + REST + Admin users)');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
