/**
 * Mock PubSub Metadata Implementation (STUB)
 *
 * NOTE: This is temporarily stubbed out during Stanza.js migration.
 * Full PubSub implementation will be added later.
 */

import type {
  PubSubMetadata,
  GameMetadata,
  GameTheme,
  ForceMetadata,
  RoomExtension,
  FormSchema,
  PubSubUpdate,
} from '@war-rooms/backend-interface';

import type { XMPPBackend } from '@war-rooms/backend-interface';

// ============================================================================
// Mock PubSub Metadata Implementation (STUB)
// ============================================================================

export class MockPubSubMetadata implements PubSubMetadata {
  // @ts-expect-error - Unused but kept for future implementation
  private _backend: XMPPBackend;

  constructor(backend: XMPPBackend) {
    this._backend = backend;
  }

  // ===== Game Operations =====

  async getGame(): Promise<GameMetadata | null> {
    return null;
  }

  async setGame(_game: GameMetadata): Promise<void> {
    // Stubbed
  }

  async getGameTheme(): Promise<GameTheme | null> {
    return null;
  }

  async setGameTheme(_theme: GameTheme): Promise<void> {
    // Stubbed
  }

  async subscribeGame(_callback: (update: PubSubUpdate<GameMetadata>) => void): Promise<void> {
    // Stubbed
  }

  async subscribeGameTheme(_callback: (update: PubSubUpdate<GameTheme>) => void): Promise<void> {
    // Stubbed
  }

  // ===== Force Operations =====

  async getForces(): Promise<ForceMetadata[]> {
    return [];
  }

  async getForce(_forceId: string): Promise<ForceMetadata | null> {
    return null;
  }

  async setForce(_force: ForceMetadata): Promise<void> {
    // Stubbed
  }

  async deleteForce(_forceId: string): Promise<void> {
    // Stubbed
  }

  async subscribeForces(_callback: (update: PubSubUpdate<ForceMetadata>) => void): Promise<void> {
    // Stubbed
  }

  // ===== Room Extension Operations =====

  async getRoomExtensions(): Promise<RoomExtension[]> {
    return [];
  }

  async getRoomExtension(_roomJid: string): Promise<RoomExtension | null> {
    return null;
  }

  async setRoomExtension(_extension: RoomExtension): Promise<void> {
    // Stubbed
  }

  async subscribeRoomExtensions(
    _callback: (update: PubSubUpdate<RoomExtension>) => void
  ): Promise<void> {
    // Stubbed
  }

  async archiveRoomExtension(_roomJid: string): Promise<void> {
    // Stubbed
  }

  // ===== Form Schema Operations =====

  async getFormSchemas(): Promise<FormSchema[]> {
    return [];
  }

  async getFormSchema(_schemaId: string): Promise<FormSchema | null> {
    return null;
  }

  async setFormSchema(_schema: FormSchema): Promise<void> {
    // Stubbed
  }

  async deleteFormSchema(_schemaId: string): Promise<void> {
    // Stubbed
  }

  async subscribeFormSchemas(_callback: (update: PubSubUpdate<FormSchema>) => void): Promise<void> {
    // Stubbed
  }

  // ===== Cleanup =====

  async unsubscribeAll(): Promise<void> {
    // Stubbed
  }
}
