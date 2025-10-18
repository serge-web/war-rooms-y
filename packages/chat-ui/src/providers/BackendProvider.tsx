/**
 * Backend Provider
 * Initializes backend and injects into state stores
 */

import React, { useEffect, useMemo } from 'react';
import type { XMPPConfig } from '@war-rooms/backend-interface';
import { MockXMPPBackend, MockPubSubMetadata } from '@war-rooms/backend-mock';
import {
  useConnectionStore,
  useRoomsStore,
  useMetadataStore,
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
      mockPersistence: (import.meta.env.VITE_MOCK_PERSISTENCE || 'localStorage') as any,
      mockLatency: Number(import.meta.env.VITE_MOCK_LATENCY || 100),
      mockDebug: import.meta.env.VITE_MOCK_DEBUG === 'true',
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
  const setBackend = useConnectionStore((state) => state.setBackend);
  const setRoomsBackend = useRoomsStore((state) => state.setBackend);
  const setPubSub = useMetadataStore((state) => state.setPubSub);

  // Create backend instance
  const backend = useMemo(() => {
    const config = getBackendConfig();
    console.info('[BackendProvider] Initializing backend', { config });
    return new MockXMPPBackend(config);
  }, []);

  // Create PubSub metadata wrapper
  const pubsub = useMemo(() => new MockPubSubMetadata(backend), [backend]);

  // Inject backend into stores
  useEffect(() => {
    setBackend(backend);
    setRoomsBackend(backend);
    setPubSub(pubsub);

    console.info('[BackendProvider] Backend initialized');

    // Cleanup on unmount
    return () => {
      backend.disconnect().catch(console.error);
    };
  }, [backend, pubsub, setBackend, setRoomsBackend, setPubSub]);

  return <>{children}</>;
}
