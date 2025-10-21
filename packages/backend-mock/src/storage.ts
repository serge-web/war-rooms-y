/**
 * Mock Storage Layer
 * Abstraction over localStorage, indexedDB (via localforage), and memory
 *
 * ## Unified Storage Architecture
 *
 * **CRITICAL**: Both chat-ui and admin-ui MUST use the SAME namespace for unified data.
 *
 * ### Namespace Strategy
 *
 * - **Production**: Use `war-rooms` namespace (shared across chat-ui and admin-ui)
 * - **Testing**: Use `test-war-rooms` or unique test ID for isolation
 * - **Configuration**: Set via `VITE_STORAGE_NAMESPACE` environment variable
 *
 * ### Unified Storage Keys (Single Source of Truth)
 *
 * All data is stored in a unified format under `entities/*`. Protocol adapters
 * (XMPPAdapter, RESTAdapter, PubSubAdapter) project this data to protocol-specific formats.
 *
 * **Unified Keys**:
 * - `entities/users/{username}` → UnifiedUser records
 * - `entities/users/_index` → Array of usernames (index)
 * - `entities/forces/{forceId}` → UnifiedForce records
 * - `entities/forces/_index` → Array of force IDs (index)
 * - `entities/rooms/{roomId}` → UnifiedRoom records
 * - `entities/rooms/_index` → Array of room IDs (index)
 * - `entities/templates/{templateId}` → UnifiedFormTemplate records
 * - `entities/templates/_index` → Array of template IDs (index)
 *
 * **Transient Data** (not projected, session-specific):
 * - `rooms/{roomJid}/occupants/*` → Real-time room occupants
 * - `archive/rooms/{roomJid}/*` → Message history
 * - `presence/self` → Current user presence
 * - `session` → Current XMPP session info
 *
 * ### Example Usage
 *
 * ```typescript
 * // All UIs use unified storage
 * const storage = createStorage({
 *   backend: 'localStorage',
 *   namespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
 * });
 *
 * // Read unified user data
 * const user = await storage.getItem<UnifiedUser>('entities/users/gamemaster');
 *
 * // Adapters project to protocol-specific formats:
 * const xmppAdapter = new XMPPAdapter(storage, 'wargame.local');
 * const xmppUser = await xmppAdapter.getUser('gamemaster'); // Returns XMPPUser
 *
 * const restAdapter = new RESTAdapter(storage, 'wargame.local', 'conference.wargame.local');
 * const restUser = await restAdapter.getUser('gamemaster'); // Returns OpenFireUser
 * ```
 */

import localforage from 'localforage';

// ============================================================================
// Storage Types
// ============================================================================

export type StorageBackend = 'localStorage' | 'indexedDB' | 'memory';

export interface StorageOptions {
  backend: StorageBackend;
  debug?: boolean;
  /**
   * Namespace for all storage keys (prevents cross-app collisions)
   *
   * **CRITICAL FOR UNIFIED DATA LAYER**: Both chat-ui and admin-ui MUST use
   * the SAME namespace to enable cross-UI data synchronization.
   *
   * @default 'war-rooms'
   * @example
   * // Production (shared namespace)
   * namespace: 'war-rooms'
   *
   * // Testing (isolated namespace)
   * namespace: `test-war-rooms-${testId}`
   */
  namespace?: string;
}

// ============================================================================
// Storage Interface
// ============================================================================

export interface Storage {
  /**
   * Get item by key
   */
  getItem<T>(key: string): Promise<T | null>;

  /**
   * Set item
   */
  setItem<T>(key: string, value: T): Promise<void>;

  /**
   * Remove item
   */
  removeItem(key: string): Promise<void>;

  /**
   * Get all keys matching prefix
   */
  keys(prefix?: string): Promise<string[]>;

  /**
   * Clear all data
   */
  clear(): Promise<void>;

  /**
   * Get multiple items by prefix
   */
  getAll<T>(prefix: string): Promise<Record<string, T>>;
}

// ============================================================================
// LocalStorage Implementation
// ============================================================================

class LocalStorageBackend implements Storage {
  constructor(private namespace: string) {}

  private prefixKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private unprefixKey(prefixedKey: string): string {
    return prefixedKey.slice(this.namespace.length + 1);
  }

  async getItem<T>(key: string): Promise<T | null> {
    const prefixedKey = this.prefixKey(key);
    const value = localStorage.getItem(prefixedKey);
    return value ? JSON.parse(value) : null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    localStorage.setItem(prefixedKey, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    localStorage.removeItem(prefixedKey);
  }

  async keys(prefix = ''): Promise<string[]> {
    const fullPrefix = this.prefixKey(prefix);
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        keys.push(this.unprefixKey(key));
      }
    }
    return keys;
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    for (const key of keys) {
      await this.removeItem(key);
    }
  }

  async getAll<T>(prefix: string): Promise<Record<string, T>> {
    const keys = await this.keys(prefix);
    const result: Record<string, T> = {};

    for (const key of keys) {
      const value = await this.getItem<T>(key);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result;
  }
}

// ============================================================================
// IndexedDB Implementation (via localforage)
// ============================================================================

class IndexedDBBackend implements Storage {
  private instance: typeof localforage;

  constructor(namespace: string) {
    this.instance = localforage.createInstance({
      name: namespace,
      storeName: 'xmpp_data',
    });
  }

  async getItem<T>(key: string): Promise<T | null> {
    const value = await this.instance.getItem<T>(key);
    return value;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await this.instance.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.instance.removeItem(key);
  }

  async keys(prefix = ''): Promise<string[]> {
    const allKeys = await this.instance.keys();
    const filtered = prefix ? allKeys.filter((k) => k.startsWith(prefix)) : allKeys;
    return filtered;
  }

  async clear(): Promise<void> {
    await this.instance.clear();
  }

  async getAll<T>(prefix: string): Promise<Record<string, T>> {
    const keys = await this.keys(prefix);
    const result: Record<string, T> = {};

    for (const key of keys) {
      const value = await this.getItem<T>(key);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result;
  }
}

// ============================================================================
// In-Memory Implementation
// ============================================================================

class MemoryBackend implements Storage {
  private data = new Map<string, unknown>();

  constructor(private namespace: string) {}

  private prefixKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async getItem<T>(key: string): Promise<T | null> {
    const prefixedKey = this.prefixKey(key);
    const value = this.data.get(prefixedKey) as T | undefined;
    return value ?? null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    this.data.set(prefixedKey, value);
  }

  async removeItem(key: string): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    this.data.delete(prefixedKey);
  }

  async keys(prefix = ''): Promise<string[]> {
    const fullPrefix = this.prefixKey(prefix);
    const keys: string[] = [];

    for (const key of this.data.keys()) {
      if (key.startsWith(fullPrefix)) {
        keys.push(key.slice(this.namespace.length + 1));
      }
    }
    return keys;
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    for (const key of keys) {
      await this.removeItem(key);
    }
  }

  async getAll<T>(prefix: string): Promise<Record<string, T>> {
    const keys = await this.keys(prefix);
    const result: Record<string, T> = {};

    for (const key of keys) {
      const value = await this.getItem<T>(key);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result;
  }
}

// ============================================================================
// Storage Factory
// ============================================================================

export function createStorage(options: StorageOptions): Storage {
  const namespace = options.namespace || 'war-rooms';

  switch (options.backend) {
    case 'localStorage':
      return new LocalStorageBackend(namespace);

    case 'indexedDB':
      return new IndexedDBBackend(namespace);

    case 'memory':
      return new MemoryBackend(namespace);

    default:
      throw new Error(`Unknown storage backend: ${options.backend}`);
  }
}
