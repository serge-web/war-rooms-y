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
export { seedMockData, seedAll, clearAll, DEFAULT_SEED_OPTIONS } from './seed';
export type { SeedOptions } from './seed';
