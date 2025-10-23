/**
 * PubSub Protocol Adapter
 * Projects unified data model to PubSub metadata structures
 */

import type { UnifiedRoom, UnifiedForce, RoomExtension } from '@war-rooms/backend-interface';

import type { Storage } from '../storage';
import type { Theme } from '@mui/material/styles';

// PubSub-specific metadata interfaces (admin UI view)
export interface RoomMetadata {
  theme?: Partial<Theme>;
  description?: string;
  allowedGroups?: string[];
  members?: string[];
  formTemplates?: string[];
  maxOccupants?: number;
}

// Simplified force metadata for admin UI (replaces backend-interface ForceMetadata)
export interface ForceMetadata {
  color: string;
  icon: string;
  objectives: string[];
  description: string;
}

export interface GameOverview {
  title: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
  currentTurn: number;
  gameTime: string;
  description?: string;
  startTime?: string;
  scenario?: string;
}

export class PubSubAdapter {
  constructor(private storage: Storage) {}

  // ============================================================================
  // Room Metadata Operations (Admin UI)
  // ============================================================================

  /**
   * Get room metadata for admin UI
   */
  async getRoomMetadata(roomName: string): Promise<RoomMetadata | null> {
    const unified = await this.storage.getItem<UnifiedRoom>(`entities/rooms/${roomName}`);
    if (!unified) return null;
    return this.projectRoomToMetadata(unified);
  }

  /**
   * Set room metadata from admin UI
   */
  async setRoomMetadata(roomName: string, metadata: RoomMetadata): Promise<void> {
    const room = await this.storage.getItem<UnifiedRoom>(`entities/rooms/${roomName}`);
    if (!room) return;

    // Update unified room with metadata
    if (metadata.allowedGroups !== undefined) {
      room.wargaming.groupMembers = metadata.allowedGroups;
    }
    if (metadata.members !== undefined) {
      room.wargaming.individualMembers = metadata.members;
    }
    if (metadata.formTemplates !== undefined) {
      room.wargaming.formTemplates = metadata.formTemplates;
    }
    if (metadata.theme !== undefined) {
      room.wargaming.theme = metadata.theme;
    }
    if (metadata.description !== undefined) {
      room.description = metadata.description;
    }
    if (metadata.maxOccupants !== undefined) {
      room.xmpp.maxUsers = metadata.maxOccupants;
    }

    room.modifiedAt = new Date().toISOString();

    await this.storage.setItem(`entities/rooms/${roomName}`, room);
  }

  /**
   * Delete room metadata
   */
  async deleteRoomMetadata(roomName: string): Promise<void> {
    const room = await this.storage.getItem<UnifiedRoom>(`entities/rooms/${roomName}`);
    if (!room) return;

    // Clear wargaming extensions
    room.wargaming = {
      type: 'standard',
    };

    room.modifiedAt = new Date().toISOString();

    await this.storage.setItem(`entities/rooms/${roomName}`, room);
  }

  // ============================================================================
  // Room Extension Operations (XMPP PubSub)
  // ============================================================================

  /**
   * Get room extension for XMPP PubSub
   */
  async getRoomExtension(roomJid: string): Promise<RoomExtension | null> {
    const roomName = roomJid.split('@')[0];
    if (!roomName) return null;

    const unified = await this.storage.getItem<UnifiedRoom>(`entities/rooms/${roomName}`);
    if (!unified) return null;
    return this.projectRoomToExtension(unified);
  }

  /**
   * Get all room extensions
   */
  async getAllRoomExtensions(): Promise<RoomExtension[]> {
    const roomIds = (await this.storage.getItem<string[]>('entities/rooms/_index')) || [];
    const extensions: RoomExtension[] = [];

    for (const roomId of roomIds) {
      const room = await this.storage.getItem<UnifiedRoom>(`entities/rooms/${roomId}`);
      if (room && room.wargaming.groupMembers?.length) {
        extensions.push(this.projectRoomToExtension(room));
      }
    }

    return extensions;
  }

  // ============================================================================
  // Force Metadata Operations
  // ============================================================================

  /**
   * Get force metadata
   */
  async getForceMetadata(forceName: string): Promise<ForceMetadata | null> {
    const unified = await this.storage.getItem<UnifiedForce>(`entities/forces/${forceName}`);
    if (!unified) return null;
    return this.projectForceToMetadata(unified);
  }

  /**
   * Set force metadata
   */
  async setForceMetadata(forceName: string, metadata: ForceMetadata): Promise<void> {
    let force = await this.storage.getItem<UnifiedForce>(`entities/forces/${forceName}`);

    if (!force) {
      // Create new force
      force = {
        id: forceName,
        name: forceName,
        description: metadata.description,
        color: metadata.color,
        icon: metadata.icon,
        objectives: metadata.objectives,
        members: [],
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      };

      // Update index
      const forceIds = (await this.storage.getItem<string[]>('entities/forces/_index')) || [];
      if (!forceIds.includes(forceName)) {
        forceIds.push(forceName);
        await this.storage.setItem('entities/forces/_index', forceIds);
      }
    } else {
      // Update existing force
      force.color = metadata.color;
      force.icon = metadata.icon;
      force.objectives = metadata.objectives;
      force.description = metadata.description;
      force.modifiedAt = new Date().toISOString();
    }

    await this.storage.setItem(`entities/forces/${forceName}`, force);
  }

  /**
   * Delete force metadata
   */
  async deleteForceMetadata(forceName: string): Promise<void> {
    // We don't delete the force itself, just clear extended metadata
    const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${forceName}`);
    if (!force) return;

    delete force.objectives;
    delete force.metadata;
    force.modifiedAt = new Date().toISOString();

    await this.storage.setItem(`entities/forces/${forceName}`, force);
  }

  // ============================================================================
  // Game Overview Operations
  // ============================================================================

  /**
   * Get game overview
   */
  async getGameOverview(): Promise<GameOverview | null> {
    return await this.storage.getItem<GameOverview>('entities/game/overview');
  }

  /**
   * Set game overview
   */
  async setGameOverview(overview: GameOverview): Promise<void> {
    await this.storage.setItem('entities/game/overview', overview);
  }

  /**
   * Delete game overview
   */
  async deleteGameOverview(): Promise<void> {
    await this.storage.removeItem('entities/game/overview');
  }

  // ============================================================================
  // Projection Functions
  // ============================================================================

  /**
   * Project UnifiedRoom to RoomMetadata (admin UI)
   */
  private projectRoomToMetadata(room: UnifiedRoom): RoomMetadata {
    return {
      ...(room.wargaming.theme ? { theme: room.wargaming.theme } : {}),
      ...(room.description ? { description: room.description } : {}),
      ...(room.wargaming.groupMembers ? { allowedGroups: room.wargaming.groupMembers } : {}),
      ...(room.wargaming.individualMembers ? { members: room.wargaming.individualMembers } : {}),
      ...(room.wargaming.formTemplates ? { formTemplates: room.wargaming.formTemplates } : {}),
      ...(room.xmpp.maxUsers ? { maxOccupants: room.xmpp.maxUsers } : {}),
    };
  }

  /**
   * Project UnifiedRoom to RoomExtension (XMPP PubSub)
   */
  private projectRoomToExtension(room: UnifiedRoom): RoomExtension {
    return {
      roomJid: room.jid,
      type: room.wargaming.type,
      ...(room.wargaming.theme ? { theme: room.wargaming.theme } : {}),
      ...(room.wargaming.formTemplates ? { formSchemaIds: room.wargaming.formTemplates } : {}),
      ...(room.wargaming.groupMembers ? { forceRestrictions: room.wargaming.groupMembers } : {}),
      createdAt: room.createdAt,
      createdBy: room.createdBy,
    };
  }

  /**
   * Project UnifiedForce to ForceMetadata
   */
  private projectForceToMetadata(force: UnifiedForce): ForceMetadata {
    return {
      color: force.color,
      icon: force.icon,
      objectives: force.objectives || [],
      description: force.description || '',
    };
  }
}
