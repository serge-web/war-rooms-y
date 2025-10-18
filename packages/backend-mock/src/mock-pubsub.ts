/**
 * Mock PubSub Metadata Implementation
 * Typed operations for War Rooms metadata (game, forces, rooms, forms)
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
import { getISOTimestamp } from './helpers';

// ============================================================================
// Mock PubSub Metadata Implementation
// ============================================================================

export class MockPubSubMetadata implements PubSubMetadata {
  private backend: XMPPBackend;
  private subscriptions: Map<string, (update: PubSubUpdate<unknown>) => void> = new Map();

  constructor(backend: XMPPBackend) {
    this.backend = backend;
  }

  // ===== Game Operations =====

  async getGame(): Promise<GameMetadata | null> {
    const items = await this.backend.retrievePubSub('/war-rooms/game', 1);
    return items.length > 0 && items[0] ? (items[0].payload as GameMetadata) : null;
  }

  async setGame(game: GameMetadata): Promise<void> {
    await this.backend.publishPubSub('/war-rooms/game', game, 'current');
  }

  async getGameTheme(): Promise<GameTheme | null> {
    const items = await this.backend.retrievePubSub('/war-rooms/game/theme', 1);
    return items.length > 0 && items[0] ? (items[0].payload as GameTheme) : null;
  }

  async setGameTheme(theme: GameTheme): Promise<void> {
    await this.backend.publishPubSub('/war-rooms/game/theme', theme, 'current');
  }

  async subscribeGame(callback: (update: PubSubUpdate<GameMetadata>) => void): Promise<void> {
    await this.backend.subscribePubSub('/war-rooms/game');
    this.subscriptions.set('/war-rooms/game', callback as (update: PubSubUpdate<unknown>) => void);

    // Register handler with backend
    this.backend.on({
      onPubSubNotification: (node, payload) => {
        if (node === '/war-rooms/game') {
          callback({
            node,
            itemId: 'current',
            payload: payload as GameMetadata,
            timestamp: getISOTimestamp(),
          });
        }
      },
    });
  }

  async subscribeGameTheme(callback: (update: PubSubUpdate<GameTheme>) => void): Promise<void> {
    await this.backend.subscribePubSub('/war-rooms/game/theme');
    this.subscriptions.set('/war-rooms/game/theme', callback as (update: PubSubUpdate<unknown>) => void);

    // Register handler with backend
    this.backend.on({
      onPubSubNotification: (node, payload) => {
        if (node === '/war-rooms/game/theme') {
          callback({
            node,
            itemId: 'current',
            payload: payload as GameTheme,
            timestamp: getISOTimestamp(),
          });
        }
      },
    });
  }

  // ===== Force Operations =====

  async getForces(): Promise<ForceMetadata[]> {
    const items = await this.backend.retrievePubSub('/war-rooms/forces');
    return items.map((item) => item.payload as ForceMetadata);
  }

  async getForce(forceId: string): Promise<ForceMetadata | null> {
    const items = await this.backend.retrievePubSub('/war-rooms/forces');
    const force = items.find((item) => (item.payload as ForceMetadata).id === forceId);
    return force ? (force.payload as ForceMetadata) : null;
  }

  async setForce(force: ForceMetadata): Promise<void> {
    await this.backend.publishPubSub('/war-rooms/forces', force, force.id);
  }

  async deleteForce(forceId: string): Promise<void> {
    await this.backend.deletePubSubItem('/war-rooms/forces', forceId);
  }

  async subscribeForces(callback: (update: PubSubUpdate<ForceMetadata>) => void): Promise<void> {
    await this.backend.subscribePubSub('/war-rooms/forces');
    this.subscriptions.set('/war-rooms/forces', callback as (update: PubSubUpdate<unknown>) => void);

    // Register handler with backend
    this.backend.on({
      onPubSubNotification: (node, payload) => {
        if (node === '/war-rooms/forces') {
          const force = payload as ForceMetadata;
          callback({
            node,
            itemId: force.id,
            payload: force,
            timestamp: getISOTimestamp(),
          });
        }
      },
    });
  }

  // ===== Room Extension Operations =====

  async getRoomExtensions(): Promise<RoomExtension[]> {
    const items = await this.backend.retrievePubSub('/war-rooms/rooms');
    return items
      .map((item) => item.payload as RoomExtension)
      .filter((ext) => !ext.archivedAt); // Exclude archived
  }

  async getRoomExtension(roomJid: string): Promise<RoomExtension | null> {
    const items = await this.backend.retrievePubSub('/war-rooms/rooms');
    const extension = items.find((item) => (item.payload as RoomExtension).roomJid === roomJid);

    if (!extension) {
      return null;
    }

    const ext = extension.payload as RoomExtension;

    // Return null if archived
    return ext.archivedAt ? null : ext;
  }

  async setRoomExtension(extension: RoomExtension): Promise<void> {
    // Use roomJid as item ID
    const itemId = this.encodeRoomJid(extension.roomJid);
    await this.backend.publishPubSub('/war-rooms/rooms', extension, itemId);
  }

  async archiveRoomExtension(roomJid: string): Promise<void> {
    const existing = await this.getRoomExtension(roomJid);

    if (!existing) {
      throw new Error(`Room extension not found: ${roomJid}`);
    }

    // Soft-delete by setting archivedAt
    const archived: RoomExtension = {
      ...existing,
      archivedAt: getISOTimestamp(),
    };

    await this.setRoomExtension(archived);
  }

  async subscribeRoomExtensions(callback: (update: PubSubUpdate<RoomExtension>) => void): Promise<void> {
    await this.backend.subscribePubSub('/war-rooms/rooms');
    this.subscriptions.set('/war-rooms/rooms', callback as (update: PubSubUpdate<unknown>) => void);

    // Register handler with backend
    this.backend.on({
      onPubSubNotification: (node, payload) => {
        if (node === '/war-rooms/rooms') {
          const extension = payload as RoomExtension;
          callback({
            node,
            itemId: this.encodeRoomJid(extension.roomJid),
            payload: extension,
            timestamp: getISOTimestamp(),
          });
        }
      },
    });
  }

  // ===== Form Schema Operations =====

  async getFormSchemas(): Promise<FormSchema[]> {
    const items = await this.backend.retrievePubSub('/war-rooms/forms');
    return items.map((item) => item.payload as FormSchema);
  }

  async getFormSchema(schemaId: string): Promise<FormSchema | null> {
    const items = await this.backend.retrievePubSub('/war-rooms/forms');
    const schema = items.find((item) => (item.payload as FormSchema).id === schemaId);
    return schema ? (schema.payload as FormSchema) : null;
  }

  async setFormSchema(schema: FormSchema): Promise<void> {
    await this.backend.publishPubSub('/war-rooms/forms', schema, schema.id);
  }

  async deleteFormSchema(schemaId: string): Promise<void> {
    await this.backend.deletePubSubItem('/war-rooms/forms', schemaId);
  }

  async subscribeFormSchemas(callback: (update: PubSubUpdate<FormSchema>) => void): Promise<void> {
    await this.backend.subscribePubSub('/war-rooms/forms');
    this.subscriptions.set('/war-rooms/forms', callback as (update: PubSubUpdate<unknown>) => void);

    // Register handler with backend
    this.backend.on({
      onPubSubNotification: (node, payload) => {
        if (node === '/war-rooms/forms') {
          const schema = payload as FormSchema;
          callback({
            node,
            itemId: schema.id,
            payload: schema,
            timestamp: getISOTimestamp(),
          });
        }
      },
    });
  }

  // ===== Cleanup =====

  async unsubscribeAll(): Promise<void> {
    for (const node of this.subscriptions.keys()) {
      await this.backend.unsubscribePubSub(node);
    }

    this.subscriptions.clear();
  }

  // ===== Private Helpers =====

  private encodeRoomJid(roomJid: string): string {
    // Encode room JID for use as PubSub item ID
    // Replace @ and / with safe characters
    return roomJid.replace(/@/g, '_at_').replace(/\//g, '_slash_');
  }
}
