/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_MODE: string;
  readonly VITE_MOCK_DOMAIN: string;
  readonly VITE_MOCK_CONFERENCE: string;
  readonly VITE_MOCK_PUBSUB: string;
  readonly VITE_MOCK_PERSISTENCE: string;
  readonly VITE_MOCK_LATENCY: string;
  readonly VITE_MOCK_DEBUG: string;
  readonly VITE_OPENFIRE_WS: string;
  readonly VITE_OPENFIRE_DOMAIN: string;
  readonly VITE_OPENFIRE_CONFERENCE: string;
  readonly VITE_OPENFIRE_PUBSUB: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
