import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createStorage, seedAll } from '@war-rooms/backend-mock';

// Seed unified mock data on first load (T033)
const STORAGE_NAMESPACE = import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms';
const hasSeeded = localStorage.getItem(`${STORAGE_NAMESPACE}:seeded`);

if (!hasSeeded) {
  const storage = createStorage({
    backend: 'localStorage',
    namespace: STORAGE_NAMESPACE,
  });

  void seedAll(storage, {
    rest: true,
    domain: import.meta.env.VITE_MOCK_DOMAIN || 'wargame.local',
    conferenceService: import.meta.env.VITE_MOCK_CONFERENCE || 'conference.wargame.local',
  }).then(() => {
    localStorage.setItem(`${STORAGE_NAMESPACE}:seeded`, 'true');
    console.info('✅ Admin UI: Mock data seeded (XMPP + REST)');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
