/**
 * Room List Component
 * Display assigned rooms (no manual join - rooms are pre-assigned by Game Designer)
 */

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
} from '@mui/material';
import {
  MeetingRoom as RoomIcon,
} from '@mui/icons-material';
import { useRoomsStore, selectAllRooms } from '@war-rooms/state';

interface RoomListProps {
  onRoomSelect?: (roomJid: string) => void;
}

export function RoomList({ onRoomSelect }: RoomListProps) {
  const allRooms = useRoomsStore(selectAllRooms);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        My Rooms
      </Typography>

      <List>
        {allRooms.map((room) => {
          const roomName = room.info.info.identity.name;

          return (
            <ListItem key={room.info.jid} disablePadding>
              <ListItemButton
                onClick={() => onRoomSelect?.(room.info.jid)}
              >
                <ListItemIcon>
                  <RoomIcon />
                </ListItemIcon>
                <ListItemText
                  primary={roomName}
                  secondary={room.info.jid}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {allRooms.length === 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            No rooms assigned
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          {allRooms.length} room{allRooms.length !== 1 ? 's' : ''} assigned
        </Typography>
      </Box>
    </Box>
  );
}
