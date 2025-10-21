/**
 * Mock PubSub Metadata Storage
 * Simulates XMPP PubSub nodes for admin metadata
 */

import type { Storage } from '../storage';
import type { Theme } from '@mui/material/styles';

// ============================================================================
// Types (from contracts/admin-rest-api.md)
// ============================================================================

export interface ForceMetadata {
  color: string;
  icon: string;
  objectives: string[];
  description: string;
}

export interface RoomMetadata {
  theme?: Partial<Theme>;
  description?: string;
  allowedGroups?: string[];
  members?: string[]; // Individual user members (synced to XMPP)
  formTemplates?: string[];
  maxOccupants?: number;
}

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
// Storage Keys
// ============================================================================

const KEYS = {
  FORCE: (groupName: string) => `pubsub:force:${groupName}`,
  ROOM: (roomName: string) => `pubsub:room:${roomName}`,
  GAME_OVERVIEW: 'pubsub:game:overview',
};

// ============================================================================
// Mock PubSub Metadata API
// ============================================================================

export class MockPubSubMetadata {
  constructor(private storage: Storage) {}

  // ==========================================================================
  // Force Metadata
  // ==========================================================================

  async getForceMetadata(groupName: string): Promise<ForceMetadata | null> {
    return await this.storage.getItem<ForceMetadata>(KEYS.FORCE(groupName));
  }

  async setForceMetadata(groupName: string, metadata: ForceMetadata): Promise<void> {
    await this.storage.setItem(KEYS.FORCE(groupName), metadata);
  }

  async deleteForceMetadata(groupName: string): Promise<void> {
    await this.storage.removeItem(KEYS.FORCE(groupName));
  }

  // ==========================================================================
  // Room Metadata
  // ==========================================================================

  async getRoomMetadata(roomName: string): Promise<RoomMetadata | null> {
    return await this.storage.getItem<RoomMetadata>(KEYS.ROOM(roomName));
  }

  async setRoomMetadata(roomName: string, metadata: RoomMetadata): Promise<void> {
    await this.storage.setItem(KEYS.ROOM(roomName), metadata);
  }

  async deleteRoomMetadata(roomName: string): Promise<void> {
    await this.storage.removeItem(KEYS.ROOM(roomName));
  }

  // ==========================================================================
  // Game Overview
  // ==========================================================================

  async getGameOverview(): Promise<GameOverview | null> {
    return await this.storage.getItem<GameOverview>(KEYS.GAME_OVERVIEW);
  }

  async setGameOverview(overview: GameOverview): Promise<void> {
    await this.storage.setItem(KEYS.GAME_OVERVIEW, overview);
  }

  async deleteGameOverview(): Promise<void> {
    await this.storage.removeItem(KEYS.GAME_OVERVIEW);
  }
}
