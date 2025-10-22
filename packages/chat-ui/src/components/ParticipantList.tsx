/**
 * Participant List Component
 * Shows list of participants/occupants in a room with presence indicators
 */

import { Box, List, ListItem, ListItemIcon, ListItemText, Typography, Chip } from '@mui/material';
import type { XMPPOccupant } from '@war-rooms/backend-interface';
import { PresenceIndicator } from './PresenceIndicator';

interface ParticipantListProps {
  /** Array of room occupants */
  occupants: XMPPOccupant[];
  /** Optional title for the list */
  title?: string;
  /** Compact mode (smaller text, no roles shown) */
  compact?: boolean;
}

export function ParticipantList({
  occupants,
  title = 'Participants',
  compact = false,
}: ParticipantListProps) {
  const getRoleColor = (role: XMPPOccupant['role']) => {
    switch (role) {
      case 'moderator':
        return 'primary';
      case 'participant':
        return 'default';
      case 'visitor':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAffiliationLabel = (affiliation: XMPPOccupant['affiliation']) => {
    switch (affiliation) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'member':
        return 'Member';
      default:
        return null;
    }
  };

  // Sort occupants: moderators first, then by nickname
  const sortedOccupants = [...occupants]
    .filter((occupant) => occupant.nick) // Filter out occupants without nick
    .sort((a, b) => {
      // Moderators first
      if (a.role === 'moderator' && b.role !== 'moderator') return -1;
      if (a.role !== 'moderator' && b.role === 'moderator') return 1;

      // Then alphabetically by nickname
      return a.nick!.localeCompare(b.nick!);
    });

  return (
    <Box>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary">
          {title} ({occupants.length})
        </Typography>
      </Box>

      <List dense={compact} sx={{ py: 0 }}>
        {sortedOccupants.map((occupant) => (
          <ListItem
            key={occupant.nick}
            sx={{
              py: compact ? 0.5 : 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PresenceIndicator size={compact ? 'small' : 'medium'} />
            </ListItemIcon>

            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant={compact ? 'body2' : 'body1'}
                    component="span"
                    color="text.primary"
                  >
                    {occupant.nick}
                  </Typography>

                  {!compact && occupant.role === 'moderator' && (
                    <Chip
                      label="Mod"
                      size="small"
                      color={getRoleColor(occupant.role)}
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}

                  {!compact && getAffiliationLabel(occupant.affiliation) && (
                    <Chip
                      label={getAffiliationLabel(occupant.affiliation)}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
              }
              secondaryTypographyProps={{
                variant: 'caption',
                noWrap: true,
              }}
            />
          </ListItem>
        ))}

        {occupants.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No participants"
              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
}
