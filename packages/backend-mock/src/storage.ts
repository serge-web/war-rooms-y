/**
 * Mock Storage Layer
 * Abstraction over localStorage, indexedDB (via localforage), and memory
 */

import localforage from 'localforage';

// ============================================================================
// Storage Types
// ============================================================================

export type StorageBackend = 'localStorage' | 'indexedDB' | 'memory';

export interface StorageOptions {
  backend: StorageBackend;
  debug?: boolean;
  namespace?: string; // Prefix for keys
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
