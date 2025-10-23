/**
 * Unified Storage API Contract
 * Shared localStorage namespace for cross-UI data consistency
 *
 * DESIGN PRINCIPLE: Both XMPP and REST backends use same Storage instance
 * with protocol-specific key prefixes to prevent collisions
 */

// ============================================================================
// Storage Configuration
// ============================================================================

/**
 * Storage backend options
 */
export type StorageBackend = 'localStorage' | 'memory';

/**
 * Storage configuration
 *
 * @example
 * ```ts
 * // Chat UI configuration
 * const chatStorage = createStorage({
 *   backend: 'localStorage',
 *   namespace: 'war-rooms',  // Shared namespace
 * });
 *
 * // Admin UI configuration (same namespace!)
 * const adminStorage = createStorage({
 *   backend: 'localStorage',
 *   namespace: 'war-rooms',  // Same namespace = shared data
 * });
 * ```
 */
export interface StorageConfig {
  /**
   * Storage backend type
   * - localStorage: Browser persistent storage
   * - memory: In-memory (tests, ephemeral)
   */
  backend: StorageBackend;

  /**
   * Namespace for all keys (prevents cross-app collisions)
   *
   * CRITICAL: Both chat-ui and admin-ui MUST use same namespace
   * for unified data layer
   *
   * @default "war-rooms"
   */
  namespace: string;
}

// ============================================================================
// Storage Interface
// ============================================================================

/**
 * Unified storage abstraction
 *
 * Provides localStorage-compatible API with namespacing
 * and JSON serialization
 */
export interface Storage {
  /**
   * Retrieve item from storage
   *
   * @param key - Storage key (will be namespaced automatically)
   * @returns Parsed value or null if not found
   *
   * @example
   * ```ts
   * // XMPP backend reading user
   * const user = await storage.getItem<XMPPUser>('roster/commander.red@wargame.local');
   *
   * // REST backend reading same user (different key format)
   * const restUser = await storage.getItem<OpenFireUser>('rest:user:commander.red');
   * ```
   */
  getItem<T>(key: string): Promise<T | null>;

  /**
   * Store item in storage
   *
   * @param key - Storage key (will be namespaced automatically)
   * @param value - Value to store (will be JSON serialized)
   *
   * @example
   * ```ts
   * // Admin UI creates user via REST API
   * await storage.setItem('rest:user:newuser', {
   *   username: 'newuser',
   *   name: 'New User',
   *   properties: { sharedGroups: ['Blue Force'] }
   * });
   *
   * // MUST also create XMPP representation for chat UI
   * await storage.setItem('roster/newuser@wargame.local', {
   *   bare_jid: 'newuser@wargame.local',
   *   name: 'New User',
   *   groups: ['Blue Force'],
   *   subscription: 'both'
   * });
   * ```
   */
  setItem<T>(key: string, value: T): Promise<void>;

  /**
   * Remove item from storage
   *
   * @param key - Storage key to remove
   *
   * @example
   * ```ts
   * // Delete user from both representations
   * await storage.removeItem('rest:user:olduser');
   * await storage.removeItem('roster/olduser@wargame.local');
   * ```
   */
  removeItem(key: string): Promise<void>;

  /**
   * Clear all items in namespace
   *
   * WARNING: Clears ALL data for this namespace (both XMPP and REST)
   *
   * @example
   * ```ts
   * // Reset wargame (admin action)
   * await storage.clear();
   * // Re-seed with fresh fixtures
   * await seedAll(storage);
   * ```
   */
  clear(): Promise<void>;

  /**
   * List all keys in namespace
   *
   * @returns Array of all storage keys (without namespace prefix)
   *
   * @example
   * ```ts
   * const keys = await storage.keys();
   * const userKeys = keys.filter(k => k.startsWith('roster/'));
   * const restKeys = keys.filter(k => k.startsWith('rest:'));
   * ```
   */
  keys(): Promise<string[]>;
}

// ============================================================================
// Storage Key Conventions
// ============================================================================

/**
 * Key prefix conventions for protocol separation
 *
 * Both XMPP and REST use same Storage instance but different
 * key prefixes to prevent collisions
 */
export const KEY_PREFIXES = {
  // XMPP Protocol Keys
  ROSTER: 'roster/', // User roster entries
  ROOMS: 'rooms/', // MUC room info
  MESSAGES: 'messages/', // Message archives
  PUBSUB_NODES: 'pubsub/nodes/', // PubSub node data

  // REST API Keys
  REST_USER: 'rest:user:', // OpenFire users
  REST_GROUP: 'rest:group:', // OpenFire groups
  REST_ROOM: 'rest:room:', // OpenFire rooms

  // REST Indexes (for list operations)
  REST_USERS_LIST: 'rest:users:list', // Array of usernames
  REST_GROUPS_LIST: 'rest:groups:list', // Array of group names
  REST_ROOMS_LIST: 'rest:rooms:list', // Array of room names
} as const;

/**
 * Example key formats
 *
 * XMPP Keys:
 * - roster/commander.red@wargame.local → XMPPUser
 * - rooms/red-command@conference.wargame.local → XMPPRoom
 * - messages/room-jid@conference/msg-id → XMPPMessage
 * - pubsub/nodes//war-rooms/forces/items/force-red → ForceMetadata
 *
 * REST Keys:
 * - rest:user:commander.red → OpenFireUser
 * - rest:group:force-red → OpenFireGroup
 * - rest:room:red-command → OpenFireRoom
 * - rest:users:list → string[] (usernames)
 */

// ============================================================================
// Storage Factory
// ============================================================================

/**
 * Create storage instance
 *
 * @param config - Storage configuration
 * @returns Storage instance
 *
 * @example
 * ```ts
 * // Production: shared localStorage
 * const storage = createStorage({
 *   backend: 'localStorage',
 *   namespace: process.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
 * });
 *
 * // Testing: isolated memory storage
 * const testStorage = createStorage({
 *   backend: 'memory',
 *   namespace: 'test-' + Date.now(),
 * });
 * ```
 */
export function createStorage(config: StorageConfig): Storage;

// ============================================================================
// Namespace Migration
// ============================================================================

/**
 * Migrate data from old namespace to new namespace
 *
 * Used when upgrading from separate namespaces to unified namespace
 *
 * @param oldNamespace - Old namespace (e.g., "war-rooms-admin")
 * @param newNamespace - New namespace (e.g., "war-rooms")
 * @param backend - Storage backend
 *
 * @example
 * ```ts
 * // One-time migration when unifying namespaces
 * await migrateNamespace('war-rooms-admin', 'war-rooms', 'localStorage');
 * ```
 */
export async function migrateNamespace(
  oldNamespace: string,
  newNamespace: string,
  backend: StorageBackend
): Promise<void>;

/**
 * Check if namespace has data
 *
 * @param namespace - Namespace to check
 * @param backend - Storage backend
 * @returns true if namespace has any keys
 *
 * @example
 * ```ts
 * if (await hasData('war-rooms-admin', 'localStorage')) {
 *   console.log('Found old admin data - migration needed');
 * }
 * ```
 */
export async function hasData(namespace: string, backend: StorageBackend): Promise<boolean>;

// ============================================================================
// Debugging Utilities
// ============================================================================

/**
 * Dump all storage data for debugging
 *
 * @param storage - Storage instance
 * @returns Map of keys to values
 *
 * @example
 * ```ts
 * const dump = await dumpStorage(storage);
 * console.log('Users:', dump.filter((k, v) => k.startsWith('roster/')));
 * console.log('REST users:', dump.filter((k, v) => k.startsWith('rest:user:')));
 * ```
 */
export async function dumpStorage(storage: Storage): Promise<Map<string, unknown>>;

/**
 * Compare XMPP and REST representations for consistency
 *
 * Validates that transformations are working correctly
 *
 * @param storage - Storage instance
 * @returns Inconsistencies found (empty if all consistent)
 *
 * @example
 * ```ts
 * const issues = await validateStorageConsistency(storage);
 * if (issues.length > 0) {
 *   console.error('Data inconsistencies detected:', issues);
 * }
 * ```
 */
export async function validateStorageConsistency(storage: Storage): Promise<string[]>;
