/**
 * Main App Component
 * Orchestrates authentication, backend initialization, and main UI
 * Routes: / = Chat UI, /admin = Admin UI
 */

import { Box } from '@mui/material';
import { Provider } from 'jotai';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useConnectionStore, selectIsConnected } from '@war-rooms/state';
import { BackendProvider } from './providers/BackendProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { Login } from './components/Login';
import { GameLayout } from './components/GameLayout';
import { OutOfGamePanel } from './components/OutOfGamePanel';
import AdminApp from './admin/AdminApp';

function ChatApp() {
  const isConnected = useConnectionStore(selectIsConnected);

  // Show login if not connected
  if (!isConnected) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Game Area (80%) - Room Columns */}
      <Box sx={{ width: '80%', height: '100%', overflow: 'hidden' }}>
        <GameLayout />
      </Box>

      {/* Out of Game Panel (20%) */}
      <Box sx={{ width: '20%', height: '100%', borderLeft: 1, borderColor: 'divider' }}>
        <OutOfGamePanel />
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Chat UI Route */}
        <Route
          path="/"
          element={
            <Provider>
              <BackendProvider>
                <ThemeProvider>
                  <ChatApp />
                </ThemeProvider>
              </BackendProvider>
            </Provider>
          }
        />

        {/* Admin UI Route */}
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
