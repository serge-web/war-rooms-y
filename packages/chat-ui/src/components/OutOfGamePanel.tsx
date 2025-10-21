/**
 * Out of Game Panel
 * Shows game state, all-hands room, and player info
 * Occupies 20% of screen width on the right side
 */

import { Box, Paper, Typography, Divider } from '@mui/material';
import { useEffect } from 'react';
import { useConnectionStore, selectJid, selectBareJid, useRoomsStore, selectIsJoined, type RoomsStore } from '@war-rooms/state';
import { ChatRoom } from './ChatRoom';

const ALL_HANDS_JID = 'all-hands@conference.wargame.local';

export function OutOfGamePanel() {
  const jid = useConnectionStore(selectJid);
  const bareJid = useConnectionStore(selectBareJid);
  const isJoined = useRoomsStore(selectIsJoined(ALL_HANDS_JID));
  const joinRoom = useRoomsStore((state: RoomsStore) => state.joinRoom);

  // Extract username from JID (e.g., "commander.red@wargame.local" -> "commander.red")
  const username = bareJid?.split('@')[0] || 'Unknown';

  // Auto-join all-hands room when component mounts
  useEffect(() => {
    if (username && username !== 'Unknown' && !isJoined) {
      joinRoom(ALL_HANDS_JID, username).catch((err) => {
        console.error('[OutOfGamePanel] Failed to join all-hands:', err);
      });
    }
  }, [username, isJoined, joinRoom]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Game State */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Game State
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Turn: 1
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Time: 09:00Z
        </Typography>
      </Paper>

      <Divider />

      {/* All Hands Room - takes remaining space */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Paper
          elevation={2}
          sx={{
            p: 1.5,
            borderRadius: 0,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">All Hands</Typography>
        </Paper>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ChatRoom roomJid={ALL_HANDS_JID} />
        </Box>
      </Box>

      <Divider />

      {/* Player Info */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 0,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Player
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {username}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {jid}
        </Typography>
      </Paper>
    </Box>
  );
}
