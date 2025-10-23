/**
 * Mock PubSub Metadata Storage
 * Simulates XMPP PubSub nodes for admin metadata
 */

import type { Storage } from '../storage';
import { PubSubAdapter } from '../adapters/pubsub-adapter';
import type { ForceMetadata, RoomMetadata } from '../adapters/pubsub-adapter';

// Re-export types from adapter
export type { ForceMetadata, RoomMetadata };

export interface GameOverview {
  title: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
  currentTurn: number;
  gameTime: string; // ISO 8601
  description?: string;
  startTime?: string; // ISO 8601
  scenario?: string;
}

// ============================================================================
// Mock PubSub Metadata API
// ============================================================================

export class MockPubSubMetadata {
  private adapter: PubSubAdapter;
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
    this.adapter = new PubSubAdapter(storage);
  }

  // ==========================================================================
  // Force Metadata
  // ==========================================================================

  async getForceMetadata(groupName: string): Promise<ForceMetadata | null> {
    return await this.adapter.getForceMetadata(groupName);
  }

  async setForceMetadata(groupName: string, metadata: ForceMetadata): Promise<void> {
    await this.adapter.setForceMetadata(groupName, metadata);
  }

  async deleteForceMetadata(groupName: string): Promise<void> {
    await this.adapter.deleteForceMetadata(groupName);
  }

  // ==========================================================================
  // Room Metadata
  // ==========================================================================

  async getRoomMetadata(roomName: string): Promise<RoomMetadata | null> {
    return await this.adapter.getRoomMetadata(roomName);
  }

  async setRoomMetadata(roomName: string, metadata: RoomMetadata): Promise<void> {
    await this.adapter.setRoomMetadata(roomName, metadata);
  }

  async deleteRoomMetadata(roomName: string): Promise<void> {
    await this.adapter.deleteRoomMetadata(roomName);
  }

  // ==========================================================================
  // Game Overview
  // ==========================================================================

  async getGameOverview(): Promise<GameOverview | null> {
    return await this.storage.getItem<GameOverview>('entities/game-overview');
  }

  async setGameOverview(overview: GameOverview): Promise<void> {
    await this.storage.setItem('entities/game-overview', overview);
  }

  async deleteGameOverview(): Promise<void> {
    await this.storage.removeItem('entities/game-overview');
  }
}
