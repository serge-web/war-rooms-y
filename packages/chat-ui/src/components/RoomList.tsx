/**
 * Room List Component
 * Display available rooms and join functionality
 */

import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  Button,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import {
  MeetingRoom as RoomIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useRoomsStore, selectJoinedRooms } from '@war-rooms/state';

interface RoomListProps {
  onRoomSelect?: (roomJid: string) => void;
}

export function RoomList({ onRoomSelect }: RoomListProps) {
  const [nickname, setNickname] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = useRoomsStore((state) => state.joinRoom);
  const joinedRooms = useRoomsStore(selectJoinedRooms);

  // Hardcoded room list for demo (in real app, would discover via service discovery)
  const availableRooms = [
    { jid: 'all-hands@conference.wargame.local', name: 'All Hands' },
    { jid: 'red-command@conference.wargame.local', name: 'Red Force Command' },
    { jid: 'blue-command@conference.wargame.local', name: 'Blue Force Command' },
  ];

  const handleJoin = async (roomJid: string) => {
    setError(null);

    if (!nickname) {
      setError('Please enter a nickname');
      return;
    }

    try {
      await joinRoom(roomJid, nickname);
      setSelectedRoom(null);
      onRoomSelect?.(roomJid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  const isJoined = (roomJid: string) => {
    return joinedRooms.some((r) => r.info.jid === roomJid);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Rooms
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {selectedRoom && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Join Room
          </Typography>
          <TextField
            size="small"
            label="Nickname"
            fullWidth
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={() => handleJoin(selectedRoom)}
            >
              Join
            </Button>
            <Button size="small" onClick={() => setSelectedRoom(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      <List>
        {availableRooms.map((room) => {
          const joined = isJoined(room.jid);

          return (
            <ListItem key={room.jid} disablePadding>
              <ListItemButton
                onClick={() => {
                  if (joined) {
                    onRoomSelect?.(room.jid);
                  } else {
                    setSelectedRoom(room.jid);
                  }
                }}
              >
                <ListItemIcon>
                  <RoomIcon />
                </ListItemIcon>
                <ListItemText
                  primary={room.name}
                  secondary={room.jid}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {joined ? (
                  <Chip label="Joined" size="small" color="primary" />
                ) : (
                  <AddIcon color="action" />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {joinedRooms.length > 0 && (
        <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            {joinedRooms.length} room{joinedRooms.length !== 1 ? 's' : ''} joined
          </Typography>
        </Box>
      )}
    </Box>
  );
}
