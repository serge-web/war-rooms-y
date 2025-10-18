/**
 * Connection State Store
 * Manages XMPP backend connection state using Zustand
 */

import { create } from 'zustand';
import type {
  XMPPBackend,
  ConnectionInfo,
  ConnectionState,
} from '@war-rooms/backend-interface';

// ============================================================================
// Store State
// ============================================================================

export interface ConnectionStore {
  // State
  backend: XMPPBackend | null;
  connectionInfo: ConnectionInfo;

  // Actions
  setBackend: (backend: XMPPBackend) => void;
  connect: (username: string, password: string) => Promise<void>;
  disconnect: () => Promise<void>;
  updateConnectionInfo: (info: ConnectionInfo) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialConnectionInfo: ConnectionInfo = {
  state: 'disconnected',
};

// ============================================================================
// Store
// ============================================================================

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  // Initial state
  backend: null,
  connectionInfo: initialConnectionInfo,

  // Actions
  setBackend: (backend: XMPPBackend) => {
    // Register connection state change handler
    backend.on({
      onConnectionStateChange: (info) => {
        get().updateConnectionInfo(info);
      },
    });

    set({ backend });
  },

  connect: async (username: string, password: string) => {
    const { backend } = get();

    if (!backend) {
      throw new Error('Backend not initialized');
    }

    try {
      await backend.connect(username, password);
    } catch (error) {
      console.error('[ConnectionStore] Connect failed:', error);
      throw error;
    }
  },

  disconnect: async () => {
    const { backend } = get();

    if (!backend) {
      return;
    }

    try {
      await backend.disconnect();
    } catch (error) {
      console.error('[ConnectionStore] Disconnect failed:', error);
      throw error;
    }
  },

  updateConnectionInfo: (info: ConnectionInfo) => {
    set({ connectionInfo: info });
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectConnectionState = (state: ConnectionStore): ConnectionState =>
  state.connectionInfo.state;

export const selectJid = (state: ConnectionStore): string | undefined =>
  state.connectionInfo.jid;

export const selectBareJid = (state: ConnectionStore): string | undefined =>
  state.connectionInfo.bareJid;

export const selectIsConnected = (state: ConnectionStore): boolean =>
  state.connectionInfo.state === 'authenticated';

export const selectIsConnecting = (state: ConnectionStore): boolean =>
  state.connectionInfo.state === 'connecting' ||
  state.connectionInfo.state === 'authenticating';
