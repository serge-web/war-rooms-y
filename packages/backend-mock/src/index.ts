/**
 * Mock Backend Package
 * XMPP protocol simulation for offline development
 */

export { MockXMPPBackend } from './mock-xmpp';
export { MockPubSubMetadata } from './mock-pubsub';
export { createStorage } from './storage';
export type { Storage, StorageBackend, StorageOptions } from './storage';
export * from './helpers';
export * from './fixtures';
export {
  seedMockData,
  seedAll,
  clearAll,
  seedRestUsers,
  seedRestGroups,
  seedRestRooms,
  seedRestFromXmpp,
  DEFAULT_SEED_OPTIONS,
} from './seed';
export type { SeedOptions } from './seed';

// REST API exports for admin UI
export { MockOpenFireAPI } from './rest/openfire-api';
export type {
  OpenFireUser,
  OpenFireGroup,
  OpenFireRoom,
  PaginationParams,
} from './rest/openfire-api';

export { MockPubSubMetadata as MockPubSubMetadataREST } from './rest/pubsub-metadata';
export type {
  ForceMetadata,
  RoomMetadata,
  GameOverview,
} from './rest/pubsub-metadata';

// Admin user seeding (separate from unified seeding)
export { seedRestUsers as seedAdminUsers } from './rest/seed-rest';

// React-Admin auth provider (for admin UIs)
export { createAuthProvider } from './rest/authProvider';

// Test utilities
export { seedTestWargame, TEST_DOMAIN, TEST_CONFERENCE } from './adapters/__tests__/test-fixtures';
