/**
 * REST Protocol Adapter
 * Projects unified data model to OpenFire REST API structures
 */

import type {
  UnifiedRoom,
  UnifiedUser,
  UnifiedForce,
  OpenFireRoom,
  OpenFireUser,
  OpenFireGroup,
} from '@war-rooms/backend-interface';

import type { Storage } from '../storage';

export class RESTAdapter {
  constructor(
    private storage: Storage,
    private domain: string,
    private conferenceService: string
  ) {}

  // ============================================================================
  // Room Operations
  // ============================================================================

  /**
   * Get room in REST format
   */
  async getRoom(roomName: string): Promise<OpenFireRoom | null> {
    const unified = await this.storage.getItem<UnifiedRoom>(
      `entities/rooms/${roomName}`
    );
    if (!unified) return null;
    return this.projectRoomToREST(unified);
  }

  /**
   * Get all rooms
   */
  async getAllRooms(): Promise<OpenFireRoom[]> {
    const roomIds = await this.storage.getItem<string[]>('entities/rooms/_index') || [];
    const rooms: OpenFireRoom[] = [];

    for (const roomId of roomIds) {
      const room = await this.storage.getItem<UnifiedRoom>(
        `entities/rooms/${roomId}`
      );
      if (room) {
        rooms.push(this.projectRoomToREST(room));
      }
    }

    return rooms;
  }

  /**
   * Create a new room
   */
  async createRoom(restRoom: OpenFireRoom): Promise<OpenFireRoom> {
    // Convert REST to unified
    const unified: UnifiedRoom = {
      id: restRoom.roomName,
      jid: `${restRoom.roomName}@${this.conferenceService}`,
      name: restRoom.naturalName,
      ...(restRoom.description ? { description: restRoom.description } : {}),
      xmpp: {
        persistent: restRoom.persistent ?? true,
        publicRoom: restRoom.publicRoom ?? false,
        membersOnly: restRoom.membersOnly ?? true,
        moderated: restRoom.moderated ?? false,
        ...(restRoom.maxUsers ? { maxUsers: restRoom.maxUsers } : {}),
        ...(restRoom.subject ? { subject: restRoom.subject } : {}),
        changeSubject: restRoom.canOccupantsChangeSubject ?? false,
      },
      wargaming: {
        type: 'standard',
        individualMembers: restRoom.members?.map(jid => jid.split('@')[0]).filter((u): u is string => !!u) || [],
      },
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };

    // Store unified
    await this.storage.setItem(`entities/rooms/${unified.id}`, unified);

    // Update index
    const roomIds = await this.storage.getItem<string[]>('entities/rooms/_index') || [];
    if (!roomIds.includes(unified.id)) {
      roomIds.push(unified.id);
      await this.storage.setItem('entities/rooms/_index', roomIds);
    }

    return this.projectRoomToREST(unified);
  }

  /**
   * Update room
   */
  async updateRoom(roomName: string, updates: Partial<OpenFireRoom>): Promise<OpenFireRoom | null> {
    const room = await this.storage.getItem<UnifiedRoom>(
      `entities/rooms/${roomName}`
    );
    if (!room) return null;

    // Apply updates
    if (updates.naturalName !== undefined) room.name = updates.naturalName;
    if (updates.description !== undefined) room.description = updates.description;
    if (updates.persistent !== undefined) room.xmpp.persistent = updates.persistent;
    if (updates.publicRoom !== undefined) room.xmpp.publicRoom = updates.publicRoom;
    if (updates.membersOnly !== undefined) room.xmpp.membersOnly = updates.membersOnly;
    if (updates.moderated !== undefined) room.xmpp.moderated = updates.moderated;
    if (updates.maxUsers !== undefined) room.xmpp.maxUsers = updates.maxUsers;
    if (updates.subject !== undefined) room.xmpp.subject = updates.subject;
    if (updates.members !== undefined) {
      room.wargaming.individualMembers = updates.members.map(jid => jid.split('@')[0]).filter((u): u is string => !!u);
    }

    room.modifiedAt = new Date().toISOString();

    await this.storage.setItem(`entities/rooms/${roomName}`, room);
    return this.projectRoomToREST(room);
  }

  /**
   * Delete room
   */
  async deleteRoom(roomName: string): Promise<void> {
    await this.storage.removeItem(`entities/rooms/${roomName}`);

    // Update index
    const roomIds = await this.storage.getItem<string[]>('entities/rooms/_index') || [];
    const index = roomIds.indexOf(roomName);
    if (index > -1) {
      roomIds.splice(index, 1);
      await this.storage.setItem('entities/rooms/_index', roomIds);
    }
  }

  // ============================================================================
  // User Operations
  // ============================================================================

  /**
   * Get user in REST format
   */
  async getUser(username: string): Promise<OpenFireUser | null> {
    const unified = await this.storage.getItem<UnifiedUser>(
      `entities/users/${username}`
    );
    if (!unified) return null;
    return this.projectUserToREST(unified);
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<OpenFireUser[]> {
    const usernames = await this.storage.getItem<string[]>('entities/users/_index') || [];
    const users: OpenFireUser[] = [];

    for (const username of usernames) {
      const user = await this.storage.getItem<UnifiedUser>(
        `entities/users/${username}`
      );
      if (user) {
        users.push(this.projectUserToREST(user));
      }
    }

    return users;
  }

  /**
   * Create user
   */
  async createUser(restUser: OpenFireUser): Promise<OpenFireUser> {
    const unified: UnifiedUser = {
      username: restUser.username,
      ...(restUser.name ? { name: restUser.name } : {}),
      ...(restUser.email ? { email: restUser.email } : {}),
      ...(restUser.password ? { password: restUser.password } : {}),
      groups: restUser.properties?.sharedGroups || [],
      isGameMaster: restUser.properties?.sharedGroups?.includes('Game Masters') || false,
      ...(restUser.name ? {
        vcard: {
          fn: restUser.name,
        },
      } : {}),
      createdAt: new Date().toISOString(),
    };

    await this.storage.setItem(`entities/users/${unified.username}`, unified);

    // Update index
    const usernames = await this.storage.getItem<string[]>('entities/users/_index') || [];
    if (!usernames.includes(unified.username)) {
      usernames.push(unified.username);
      await this.storage.setItem('entities/users/_index', usernames);
    }

    // Update force membership
    for (const groupName of unified.groups) {
      const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${groupName}`);
      if (force && !force.members.includes(unified.username)) {
        force.members.push(unified.username);
        await this.storage.setItem(`entities/forces/${groupName}`, force);
      }
    }

    // Don't return password
    const { password, ...userWithoutPassword } = unified;
    return this.projectUserToREST(userWithoutPassword as UnifiedUser);
  }

  // ============================================================================
  // Group Operations
  // ============================================================================

  /**
   * Get group in REST format
   */
  async getGroup(groupName: string): Promise<OpenFireGroup | null> {
    const unified = await this.storage.getItem<UnifiedForce>(
      `entities/forces/${groupName}`
    );
    if (!unified) return null;
    return this.projectForceToGroup(unified);
  }

  /**
   * Get all groups
   */
  async getAllGroups(): Promise<OpenFireGroup[]> {
    const forceIds = await this.storage.getItem<string[]>('entities/forces/_index') || [];
    const groups: OpenFireGroup[] = [];

    for (const forceId of forceIds) {
      const force = await this.storage.getItem<UnifiedForce>(
        `entities/forces/${forceId}`
      );
      if (force) {
        groups.push(this.projectForceToGroup(force));
      }
    }

    // Also add Game Masters group
    groups.push({
      name: 'Game Masters',
      description: 'Game administrators',
      members: await this.getGameMasterUsernames(),
    });

    return groups;
  }

  // ============================================================================
  // Projection Functions
  // ============================================================================

  /**
   * Project UnifiedRoom to OpenFireRoom
   */
  private projectRoomToREST(room: UnifiedRoom): OpenFireRoom {
    // Convert usernames to JIDs
    const memberJids = room.wargaming.individualMembers?.map(
      username => `${username}@${this.domain}`
    ) || [];

    return {
      roomName: room.id,
      naturalName: room.name,
      ...(room.description ? { description: room.description } : {}),
      ...(room.xmpp.subject ? { subject: room.xmpp.subject } : {}),
      ...(room.xmpp.maxUsers ? { maxUsers: room.xmpp.maxUsers } : {}),
      persistent: room.xmpp.persistent,
      publicRoom: room.xmpp.publicRoom,
      membersOnly: room.xmpp.membersOnly,
      moderated: room.xmpp.moderated,
      members: memberJids,
      ...(room.xmpp.changeSubject !== undefined ? { canOccupantsChangeSubject: room.xmpp.changeSubject } : {}),
      creationDate: room.createdAt,
      ...(room.modifiedAt ? { modificationDate: room.modifiedAt } : {}),
    };
  }

  /**
   * Project UnifiedUser to OpenFireUser
   */
  private projectUserToREST(user: UnifiedUser): OpenFireUser {
    return {
      username: user.username,
      ...(user.name ? { name: user.name } : {}),
      ...(user.email ? { email: user.email } : {}),
      // Never return password
      properties: {
        sharedGroups: user.groups,
      },
    };
  }

  /**
   * Project UnifiedForce to OpenFireGroup
   */
  private projectForceToGroup(force: UnifiedForce): OpenFireGroup {
    return {
      name: force.id,
      ...(force.description ? { description: force.description } : {}),
      members: force.members,
      ...(force.admins ? { admins: force.admins } : {}),
    };
  }

  /**
   * Get all users who are game masters
   */
  private async getGameMasterUsernames(): Promise<string[]> {
    const usernames = await this.storage.getItem<string[]>('entities/users/_index') || [];
    const gameMasters: string[] = [];

    for (const username of usernames) {
      const user = await this.storage.getItem<UnifiedUser>(
        `entities/users/${username}`
      );
      if (user?.isGameMaster) {
        gameMasters.push(username);
      }
    }

    return gameMasters;
  }
}