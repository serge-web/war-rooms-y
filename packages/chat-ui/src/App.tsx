/**
 * Main App Component
 * Orchestrates authentication, backend initialization, and main UI
 */

import { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Provider } from 'jotai';
import { useConnectionStore, selectIsConnected } from '@war-rooms/state';
import { BackendProvider } from './providers/BackendProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { Login } from './components/Login';
import { RoomList } from './components/RoomList';
import { ChatRoom } from './components/ChatRoom';

const DRAWER_WIDTH = 300;

function AppContent() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const isConnected = useConnectionStore(selectIsConnected);
  const jid = useConnectionStore((state) => state.connectionInfo.jid);

  // Show login if not connected
  if (!isConnected) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            War Rooms Y
          </Typography>
          <Typography variant="body2" color="inherit">
            {jid}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <RoomList onRoomSelect={setSelectedRoom} />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          ml: drawerOpen ? 0 : `-${DRAWER_WIDTH}px`,
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar />

        {selectedRoom ? (
          <ChatRoom roomJid={selectedRoom} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a room to start chatting
            </Typography>
          </Box>
        )}
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
