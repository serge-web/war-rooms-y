/**
 * Main App Component
 * Orchestrates authentication, backend initialization, and main UI
 */

import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { Provider } from 'jotai';
import { useConnectionStore, selectIsConnected, selectBareJid } from '@war-rooms/state';
import { BackendProvider } from './providers/BackendProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { Login } from './components/Login';
import { GameLayout } from './components/GameLayout';
import { OutOfGamePanel } from './components/OutOfGamePanel';

function AppContent() {
  const isConnected = useConnectionStore(selectIsConnected);
  const bareJid = useConnectionStore(selectBareJid);

  // Show login if not connected
  if (!isConnected) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            War Rooms Y
          </Typography>
          <Typography variant="body2" color="inherit">
            {bareJid}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content: 80% Game Area + 20% Out of Game */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Game Area (80%) - Room Columns */}
        <Box sx={{ width: '80%', height: '100%', overflow: 'hidden' }}>
          <GameLayout />
        </Box>

        {/* Out of Game Panel (20%) */}
        <Box sx={{ width: '20%', height: '100%', borderLeft: 1, borderColor: 'divider' }}>
          <OutOfGamePanel />
        </Box>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <Provider>
      <BackendProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </BackendProvider>
    </Provider>
  );
}
