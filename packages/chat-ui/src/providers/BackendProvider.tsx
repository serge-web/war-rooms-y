/**
 * Backend Provider
 * Initializes backend and injects into state stores
 */

import React, { useEffect, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import type { XMPPConfig, XMPPMessage, XMPPBackend } from '@war-rooms/backend-interface';
import { MockXMPPBackend, MockPubSubMetadata } from '@war-rooms/backend-mock';
import {
  useConnectionStore,
  useRoomsStore,
  useMetadataStore,
  messageBackendAtom,
  addMessageAtom,
  type ConnectionStore,
  type RoomsStore,
  type MetadataStore,
} from '@war-rooms/state';

// ============================================================================
// Configuration from environment
// ============================================================================

function getBackendConfig(): XMPPConfig {
  const mode = import.meta.env.VITE_BACKEND_MODE || 'mock';

  if (mode === 'mock') {
    return {
      domain: import.meta.env.VITE_MOCK_DOMAIN || 'wargame.local',
      conferenceService: import.meta.env.VITE_MOCK_CONFERENCE || 'conference.wargame.local',
      pubsubService: import.meta.env.VITE_MOCK_PUBSUB || 'pubsub.wargame.local',
      mockPersistence:
        (import.meta.env.VITE_MOCK_PERSISTENCE as 'localStorage' | 'memory' | undefined) ||
        'localStorage',
      mockLatency: Number(import.meta.env.VITE_MOCK_LATENCY || 100),
      mockDebug: import.meta.env.VITE_MOCK_DEBUG === 'true',
      mockNamespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms', // Use unified namespace
    };
  }

  // OpenFire config (future)
  return {
    websocketUrl: import.meta.env.VITE_OPENFIRE_WS || 'wss://localhost:7443/ws',
    domain: import.meta.env.VITE_OPENFIRE_DOMAIN || 'wargame.local',
    conferenceService: import.meta.env.VITE_OPENFIRE_CONFERENCE || 'conference.wargame.local',
    pubsubService: import.meta.env.VITE_OPENFIRE_PUBSUB || 'pubsub.wargame.local',
  };
}

// ============================================================================
// Provider Component
// ============================================================================

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const setBackend = useConnectionStore((state: ConnectionStore) => state.setBackend);
  const setRoomsBackend = useRoomsStore((state: RoomsStore) => state.setBackend);
  const setPubSub = useMetadataStore((state: MetadataStore) => state.setPubSub);
  const setMessageBackend = useSetAtom(messageBackendAtom);
  const addMessage = useSetAtom(addMessageAtom);

  // Create backend instance
  const backend = useMemo(() => {
    const config = getBackendConfig();
    return new MockXMPPBackend(config);
  }, []);

  // Create PubSub metadata wrapper
  const pubsub = useMemo(
    () => new MockPubSubMetadata(backend as unknown as XMPPBackend),
    [backend]
  );

  // Inject backend into stores
  useEffect(() => {
    setBackend(backend as unknown as XMPPBackend);
    setRoomsBackend(backend as unknown as XMPPBackend);
    setPubSub(pubsub);
    setMessageBackend({ backend: backend as unknown as XMPPBackend });

    // Register message handler to update Jotai atoms
    backend.setEventHandlers({
      onMessage: (message: XMPPMessage) => {
        // Extract room JID from groupchat message
        if (message.type === 'groupchat' && message.from) {
          const roomJid = message.from.split('/')[0];
          if (roomJid) {
            addMessage({ roomJid, message });
          }
        }
      },
    });

    // Cleanup on unmount
    return () => {
      backend.disconnect();
    };
  }, [backend, pubsub, setBackend, setRoomsBackend, setPubSub, setMessageBackend, addMessage]);

  return <>{children}</>;
}
