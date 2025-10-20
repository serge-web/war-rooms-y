/**
 * Unified Seeding API Contract
 * Single source of truth for mock data initialization
 * 
 * DESIGN PRINCIPLE: Seed XMPP fixtures first, then transform to REST
 * This ensures both protocols share identical data
 */

import type { Storage } from './storage-api';

// ============================================================================
// Seeding Options
// ============================================================================

/**
 * Seeding configuration
 * 
 * Controls which entities are seeded and seeding behavior
 */
export interface SeedOptions {
  /**
   * Clear existing data before seeding
   * 
   * WARNING: This deletes ALL data in the namespace
   * 
   * @default true
   */
  clear?: boolean;

  /**
   * Seed user roster entries
   * 
   * Creates XMPP users and transforms to REST users
   * 
   * @default true
   */
  users?: boolean;

  /**
   * Seed game metadata
   * 
   * Creates game overview and theme in PubSub
   * 
   * @default true
   */
  game?: boolean;

  /**
   * Seed forces (groups)
   * 
   * Creates force metadata in PubSub and transforms to REST groups
   * 
   * @default true
   */
  forces?: boolean;

  /**
   * Seed rooms
   * 
   * Creates XMPP MUC rooms and transforms to REST rooms
   * 
   * @default true
   */
  rooms?: boolean;

  /**
   * Seed messages
   * 
   * Creates message history in XMPP MAM
   * (No REST representation - XMPP only)
   * 
   * @default true
   */
  messages?: boolean;

  /**
   * Seed form schemas
   * 
   * Creates RJSF form templates in PubSub
   * (No REST representation - XMPP only)
   * 
   * @default true
   */
  forms?: boolean;

  /**
   * Seed REST representations
   * 
   * Transform XMPP entities to REST format
   * 
   * CRITICAL: Set to true for unified data layer
   * 
   * @default true
   */
  rest?: boolean;
}

/**
 * Default seeding options (seed everything)
 */
export const DEFAULT_SEED_OPTIONS: SeedOptions = {
  clear: true,
  users: true,
  game: true,
  forces: true,
  rooms: true,
  messages: true,
  forms: true,
  rest: true,  // ← NEW: Enable REST seeding
};

// ============================================================================
// Master Seeding Function
// ============================================================================

/**
 * Seed mock backend with unified XMPP and REST data
 * 
 * Execution order:
 * 1. Clear storage (if options.clear)
 * 2. Seed XMPP entities (canonical source)
 * 3. Transform and seed REST representations
 * 4. Validate consistency
 * 
 * @param storage - Shared storage instance
 * @param options - Seeding configuration
 * 
 * @example
 * ```ts
 * // Full seeding (both XMPP and REST)
 * await seedAll(storage, DEFAULT_SEED_OPTIONS);
 * 
 * // Seed only users and rooms
 * await seedAll(storage, {
 *   clear: true,
 *   users: true,
 *   rooms: true,
 *   rest: true,  // Transform to REST
 * });
 * 
 * // Re-seed without clearing (add more data)
 * await seedAll(storage, {
 *   clear: false,
 *   forces: true,
 *   rest: true,
 * });
 * ```
 */
export async function seedAll(
  storage: Storage,
  options?: SeedOptions
): Promise<void>;

// ============================================================================
// XMPP Seeding Functions
// ============================================================================

/**
 * Seed XMPP user roster
 * 
 * Seeds MOCK_USERS from fixtures.ts into roster/ keys
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedXmppUsers(storage);
 * // Creates: roster/commander.red@wargame.local, etc.
 * ```
 */
export async function seedXmppUsers(storage: Storage): Promise<void>;

/**
 * Seed game metadata (PubSub)
 * 
 * Seeds MOCK_GAME and MOCK_GAME_THEME into PubSub nodes
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedGameMetadata(storage);
 * // Creates: pubsub/nodes//war-rooms/game/items/current
 * //          pubsub/nodes//war-rooms/game/theme/items/current
 * ```
 */
export async function seedGameMetadata(storage: Storage): Promise<void>;

/**
 * Seed forces metadata (PubSub)
 * 
 * Seeds MOCK_FORCES into PubSub nodes
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedForces(storage);
 * // Creates: pubsub/nodes//war-rooms/forces/items/force-red
 * //          pubsub/nodes//war-rooms/forces/items/force-blue
 * ```
 */
export async function seedForces(storage: Storage): Promise<void>;

/**
 * Seed XMPP MUC rooms
 * 
 * Seeds MOCK_ROOMS into rooms/ keys
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedXmppRooms(storage);
 * // Creates: rooms/all-hands@conference.wargame.local
 * //          rooms/red-command@conference.wargame.local
 * ```
 */
export async function seedXmppRooms(storage: Storage): Promise<void>;

/**
 * Seed message archives (MAM)
 * 
 * Seeds MOCK_MESSAGES into messages/ keys
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedMessages(storage);
 * // Creates: messages/all-hands@conference/msg-001
 * //          messages/all-hands@conference/index
 * ```
 */
export async function seedMessages(storage: Storage): Promise<void>;

/**
 * Seed form schemas (PubSub)
 * 
 * Seeds MOCK_FORM_SCHEMAS into PubSub nodes
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedFormSchemas(storage);
 * // Creates: pubsub/nodes//war-rooms/forms/items/sitrep
 * ```
 */
export async function seedFormSchemas(storage: Storage): Promise<void>;

// ============================================================================
// REST Seeding Functions (NEW)
// ============================================================================

/**
 * Seed REST representations from XMPP fixtures
 * 
 * Reads XMPP entities from storage, transforms to REST format,
 * and writes REST representations
 * 
 * PREREQUISITE: XMPP entities must be seeded first
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * // Seed XMPP first
 * await seedXmppUsers(storage);
 * await seedXmppRooms(storage);
 * await seedForces(storage);
 * 
 * // Then transform to REST
 * await seedRestFromXmpp(storage);
 * 
 * // Now both UIs see same data:
 * const xmppUser = await storage.getItem('roster/commander.red@wargame.local');
 * const restUser = await storage.getItem('rest:user:commander.red');
 * // Both represent same user!
 * ```
 */
export async function seedRestFromXmpp(storage: Storage): Promise<void>;

/**
 * Seed REST users from XMPP roster
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedRestUsers(storage);
 * // Creates: rest:user:commander.red
 * //          rest:user:commander.blue
 * //          rest:users:list (index)
 * ```
 */
export async function seedRestUsers(storage: Storage): Promise<void>;

/**
 * Seed REST groups from forces and roster
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedRestGroups(storage);
 * // Creates: rest:group:force-red
 * //          rest:group:force-blue
 * //          rest:groups:list (index)
 * ```
 */
export async function seedRestGroups(storage: Storage): Promise<void>;

/**
 * Seed REST rooms from XMPP MUC rooms
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * await seedRestRooms(storage);
 * // Creates: rest:room:all-hands
 * //          rest:room:red-command
 * //          rest:rooms:list (index)
 * ```
 */
export async function seedRestRooms(storage: Storage): Promise<void>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate seeded data consistency
 * 
 * Checks that XMPP and REST representations match for all entities
 * 
 * @param storage - Storage instance
 * @returns Validation errors (empty array if valid)
 * 
 * @example
 * ```ts
 * await seedAll(storage);
 * const errors = await validateSeededData(storage);
 * 
 * if (errors.length > 0) {
 *   console.error('Seeding validation failed:', errors);
 *   throw new Error('Data inconsistency detected');
 * }
 * ```
 */
export async function validateSeededData(storage: Storage): Promise<string[]>;

/**
 * Count seeded entities by type
 * 
 * @param storage - Storage instance
 * @returns Entity counts
 * 
 * @example
 * ```ts
 * await seedAll(storage);
 * const counts = await countSeededEntities(storage);
 * // => {
 * //   xmppUsers: 5,
 * //   restUsers: 5,
 * //   xmppRooms: 6,
 * //   restRooms: 6,
 * //   forces: 3,
 * //   messages: 20
 * // }
 * ```
 */
export async function countSeededEntities(storage: Storage): Promise<{
  xmppUsers: number;
  restUsers: number;
  xmppRooms: number;
  restRooms: number;
  forces: number;
  groups: number;
  messages: number;
  forms: number;
}>;

// ============================================================================
// Admin Operations
// ============================================================================

/**
 * Reset wargame (clear all data and re-seed)
 * 
 * Admin operation to reset game state to initial fixtures
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * // Admin clicks "Reset Wargame" button
 * await resetWargame(storage);
 * // All messages deleted, users/rooms restored to fixtures
 * ```
 */
export async function resetWargame(storage: Storage): Promise<void>;

/**
 * Clear messages only (preserve users, rooms, forces)
 * 
 * Admin operation to reset chat history without losing setup
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * // Admin clicks "Clear Messages" button
 * await clearMessages(storage);
 * // Messages deleted, everything else preserved
 * ```
 */
export async function clearMessages(storage: Storage): Promise<void>;

// ============================================================================
// Migration Utilities
// ============================================================================

/**
 * Migrate from old dual-seeding to new unified seeding
 * 
 * Reads existing XMPP data, generates REST representations,
 * validates consistency
 * 
 * @param storage - Storage instance
 * @returns Migration report
 * 
 * @example
 * ```ts
 * // One-time migration when upgrading to unified data layer
 * const report = await migrateToUnifiedSeeding(storage);
 * console.log('Migrated:', report);
 * // => {
 * //   xmppEntitiesFound: 15,
 * //   restEntitiesCreated: 15,
 * //   errors: []
 * // }
 * ```
 */
export async function migrateToUnifiedSeeding(storage: Storage): Promise<{
  xmppEntitiesFound: number;
  restEntitiesCreated: number;
  errors: string[];
}>;

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Create minimal test fixture (fast seeding for tests)
 * 
 * Seeds only essential data (1 user, 1 room, 1 message)
 * 
 * @param storage - Storage instance
 * 
 * @example
 * ```ts
 * // In test setup
 * const testStorage = createStorage({ backend: 'memory', namespace: 'test' });
 * await seedMinimalFixture(testStorage);
 * 
 * // Now test with minimal but valid data
 * ```
 */
export async function seedMinimalFixture(storage: Storage): Promise<void>;

/**
 * Create isolated test storage with fresh fixtures
 * 
 * Convenience function for test setup
 * 
 * @returns Storage instance with seeded data
 * 
 * @example
 * ```ts
 * // Each test gets isolated storage
 * test('user creation', async () => {
 *   const storage = await createTestStorage();
 *   // Test with fresh fixtures
 * });
 * ```
 */
export async function createTestStorage(): Promise<Storage>;
