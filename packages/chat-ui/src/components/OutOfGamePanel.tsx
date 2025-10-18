/**
 * Out of Game Panel
 * Shows game state, all-hands room, and player info
 * Occupies 20% of screen width on the right side
 */

import { Box, Paper, Typography, Divider } from '@mui/material';
import { useConnectionStore, selectJid, selectBareJid } from '@war-rooms/state';
import { ChatRoom } from './ChatRoom';

export function OutOfGamePanel() {
  const jid = useConnectionStore(selectJid);
  const bareJid = useConnectionStore(selectBareJid);

  // Extract username from JID (e.g., "commander.red@wargame.local" -> "commander.red")
  const username = bareJid?.split('@')[0] || 'Unknown';

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
        <ChatRoom roomJid="all-hands@conference.wargame.local" />
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
