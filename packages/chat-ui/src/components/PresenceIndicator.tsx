/**
 * Presence Indicator Component
 * Shows online/away/dnd status with a colored dot
 */

import { Box, Tooltip } from '@mui/material';
import {
  Circle as CircleIcon,
  RemoveCircle as AwayIcon,
  DoNotDisturb as DndIcon,
  Help as XaIcon,
} from '@mui/icons-material';

interface PresenceIndicatorProps {
  /** Presence show type */
  show?: 'away' | 'chat' | 'dnd' | 'xa';
  /** Optional status message */
  status?: string;
  /** Size of the indicator */
  size?: 'small' | 'medium' | 'large';
}

export function PresenceIndicator({ show, status, size = 'small' }: PresenceIndicatorProps) {
  const getPresenceColor = () => {
    if (!show) return 'success.main'; // Available/online (green)
    switch (show) {
      case 'chat':
        return 'success.main'; // Free for chat (green)
      case 'away':
        return 'warning.main'; // Away (yellow/orange)
      case 'dnd':
        return 'error.main'; // Do not disturb (red)
      case 'xa':
        return 'grey.500'; // Extended away (gray)
      default:
        return 'success.main';
    }
  };

  const getPresenceLabel = () => {
    if (!show) return 'Available';
    switch (show) {
      case 'chat':
        return 'Free for chat';
      case 'away':
        return 'Away';
      case 'dnd':
        return 'Do not disturb';
      case 'xa':
        return 'Extended away';
      default:
        return 'Available';
    }
  };

  const getPresenceIcon = () => {
    const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
    const sx = { fontSize: iconSize };

    if (!show || show === 'chat') {
      return <CircleIcon sx={sx} />;
    }
    switch (show) {
      case 'away':
        return <AwayIcon sx={sx} />;
      case 'dnd':
        return <DndIcon sx={sx} />;
      case 'xa':
        return <XaIcon sx={sx} />;
      default:
        return <CircleIcon sx={sx} />;
    }
  };

  const tooltipTitle = status ? `${getPresenceLabel()}: ${status}` : getPresenceLabel();

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          color: getPresenceColor(),
        }}
      >
        {getPresenceIcon()}
      </Box>
    </Tooltip>
  );
}
