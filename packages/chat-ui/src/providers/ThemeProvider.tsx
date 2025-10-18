/**
 * Theme Provider
 * Hierarchical Material UI theming: MUI defaults → Global game theme → Room theme
 */

import React, { useMemo } from 'react';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  Theme,
} from '@mui/material/styles';
import { useMetadataStore, selectGameTheme } from '@war-rooms/state';

// ============================================================================
// Default War Rooms Theme
// ============================================================================

const baseTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90CAF9',
    },
    secondary: {
      main: '#F48FB1',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// ============================================================================
// Provider Component
// ============================================================================

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get global game theme from metadata store
  const gameTheme = useMetadataStore(selectGameTheme);

  // Compose theme: base → game theme
  const theme = useMemo(() => {
    if (!gameTheme) {
      return baseTheme;
    }

    // Merge game theme with base
    return createTheme(baseTheme, gameTheme);
  }, [gameTheme]);

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}

// ============================================================================
// Room Theme Hook (for per-room theme composition)
// ============================================================================

/**
 * Get room-specific theme (if room has theme override)
 * Usage: const theme = useRoomTheme(roomJid);
 */
export function useRoomTheme(roomJid?: string): Theme {
  const gameTheme = useMetadataStore(selectGameTheme);
  const getRoomExtension = useMetadataStore((state) => state.getRoomExtension);

  return useMemo(() => {
    let theme = baseTheme;

    // Apply game theme
    if (gameTheme) {
      theme = createTheme(theme, gameTheme);
    }

    // Apply room-specific theme
    if (roomJid) {
      const roomExtension = getRoomExtension(roomJid);
      if (roomExtension?.theme) {
        theme = createTheme(theme, roomExtension.theme);
      }
    }

    return theme;
  }, [gameTheme, roomJid, getRoomExtension]);
}
