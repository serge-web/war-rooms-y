/**
 * Tab Label Component
 * Displays room name with unread count badge
 */

import { Badge } from '@mui/material';
import { useAtomValue } from 'jotai';
import { unreadCountAtomFamily } from '@war-rooms/state';

interface TabLabelProps {
  /** Room JID */
  roomJid: string;
  /** Room name */
  name: string;
}

export function TabLabel({ roomJid, name }: TabLabelProps) {
  const unreadCount = useAtomValue(unreadCountAtomFamily(roomJid));

  return (
    <Badge
      badgeContent={unreadCount}
      color="error"
      max={99}
      sx={{
        '& .MuiBadge-badge': {
          right: -12,
          top: 10,
          fontSize: '0.65rem',
          minWidth: '18px',
          height: '18px',
        },
      }}
    >
      <span>{name}</span>
    </Badge>
  );
}
