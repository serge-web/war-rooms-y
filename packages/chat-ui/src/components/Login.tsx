/**
 * Login Component
 * Simple XMPP authentication form
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  useConnectionStore,
  selectIsConnecting,
  useRoomsStore,
  type ConnectionStore,
  type RoomsStore,
} from '@war-rooms/state';

export function Login() {
  const [username, setUsername] = useState('commander.red');
  const [password, setPassword] = useState('any');
  const [error, setError] = useState<string | null>(null);

  const connect = useConnectionStore((state: ConnectionStore) => state.connect);
  const isConnecting = useConnectionStore(selectIsConnecting);
  const loadMyRooms = useRoomsStore((state: RoomsStore) => state.loadMyRooms);
  const joinRoom = useRoomsStore((state: RoomsStore) => state.joinRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    try {
      connect(username, password);

      // Wait for connection to complete (poll connection state with timeout)
      await new Promise<void>((resolve, reject) => {
        const startTime = Date.now();
        const timeout = 10000; // 10 second timeout

        const checkConnection = () => {
          const state = useConnectionStore.getState().connectionInfo.state;

          if (state === 'authenticated') {
            resolve();
          } else if (state === 'disconnected') {
            reject(new Error('Connection failed'));
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Connection timeout'));
          } else {
            setTimeout(checkConnection, 50);
          }
        };

        // Start checking after a small delay to allow connect() to start
        setTimeout(checkConnection, 50);
      });

      // Load user's assigned rooms after successful connection
      await loadMyRooms();

      // Auto-join all discovered rooms
      const rooms = useRoomsStore.getState().rooms;
      for (const [roomJid, roomState] of rooms.entries()) {
        if (!roomState.joined) {
          // Use username as nickname
          await joinRoom(roomJid, username);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ minWidth: 400, maxWidth: 500 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            War Rooms Y
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            align="center"
            sx={{ mb: 3 }}
          >
            Multi-Room Wargaming Chat
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
          >
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isConnecting}
              autoFocus
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isConnecting}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Mock users: commander.red, commander.blue, gamemaster (password: any)
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
