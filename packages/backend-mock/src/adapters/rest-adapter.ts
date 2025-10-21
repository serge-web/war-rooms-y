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

  /**
   * Update user
   */
  async updateUser(username: string, updates: Partial<OpenFireUser>): Promise<OpenFireUser | null> {
    const user = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);
    if (!user) return null;

    const oldGroups = user.groups;

    // Apply updates
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.password !== undefined) user.password = updates.password;
    if (updates.properties?.sharedGroups !== undefined) {
      user.groups = updates.properties.sharedGroups;
      user.isGameMaster = updates.properties.sharedGroups.includes('Game Masters');
    }

    user.modifiedAt = new Date().toISOString();

    await this.storage.setItem(`entities/users/${username}`, user);

    // Update force membership if groups changed
    if (updates.properties?.sharedGroups) {
      const newGroups = updates.properties.sharedGroups;

      // Remove from old groups
      for (const groupName of oldGroups) {
        if (!newGroups.includes(groupName)) {
          const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${groupName}`);
          if (force) {
            force.members = force.members.filter(m => m !== username);
            await this.storage.setItem(`entities/forces/${groupName}`, force);
          }
        }
      }

      // Add to new groups
      for (const groupName of newGroups) {
        if (!oldGroups.includes(groupName)) {
          const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${groupName}`);
          if (force && !force.members.includes(username)) {
            force.members.push(username);
            await this.storage.setItem(`entities/forces/${groupName}`, force);
          }
        }
      }
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return this.projectUserToREST(userWithoutPassword as UnifiedUser);
  }

  /**
   * Delete user
   */
  async deleteUser(username: string): Promise<void> {
    const user = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);
    if (!user) return;

    // Remove from all forces
    for (const groupName of user.groups) {
      const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${groupName}`);
      if (force) {
        force.members = force.members.filter(m => m !== username);
        await this.storage.setItem(`entities/forces/${groupName}`, force);
      }
    }

    // Delete user
    await this.storage.removeItem(`entities/users/${username}`);

    // Update index
    const usernames = await this.storage.getItem<string[]>('entities/users/_index') || [];
    const index = usernames.indexOf(username);
    if (index > -1) {
      usernames.splice(index, 1);
      await this.storage.setItem('entities/users/_index', usernames);
    }
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

  /**
   * Create group (force)
   */
  async createGroup(restGroup: OpenFireGroup): Promise<OpenFireGroup> {
    const unified: UnifiedForce = {
      id: restGroup.name,
      name: restGroup.name,
      ...(restGroup.description ? { description: restGroup.description } : {}),
      color: '#000000',
      icon: 'group',
      members: restGroup.members || [],
      ...(restGroup.admins ? { admins: restGroup.admins } : {}),
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };

    await this.storage.setItem(`entities/forces/${unified.id}`, unified);

    // Update index
    const forceIds = await this.storage.getItem<string[]>('entities/forces/_index') || [];
    if (!forceIds.includes(unified.id)) {
      forceIds.push(unified.id);
      await this.storage.setItem('entities/forces/_index', forceIds);
    }

    // Update user group membership
    for (const username of unified.members) {
      const user = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);
      if (user && !user.groups.includes(unified.id)) {
        user.groups.push(unified.id);
        await this.storage.setItem(`entities/users/${username}`, user);
      }
    }

    return this.projectForceToGroup(unified);
  }

  /**
   * Update group (force)
   */
  async updateGroup(groupName: string, updates: Partial<OpenFireGroup>): Promise<OpenFireGroup | null> {
    const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${groupName}`);
    if (!force) return null;

    const oldMembers = force.members;

    // Apply updates
    if (updates.description !== undefined) force.description = updates.description;
    if (updates.members !== undefined) {
      // Deduplicate members
      force.members = Array.from(new Set(updates.members));
    }
    if (updates.admins !== undefined) {
      // Deduplicate admins
      force.admins = Array.from(new Set(updates.admins));
    }

    force.modifiedAt = new Date().toISOString();

    await this.storage.setItem(`entities/forces/${groupName}`, force);

    // Sync user groups if members changed
    if (updates.members !== undefined) {
      const newMembers = updates.members;

      // Remove groupName from users no longer in the group
      for (const username of oldMembers) {
        if (!newMembers.includes(username)) {
          const user = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);
          if (user) {
            user.groups = user.groups.filter(g => g !== groupName);
            await this.storage.setItem(`entities/users/${username}`, user);
          }
        }
      }

      // Add groupName to new users
      for (const username of newMembers) {
        if (!oldMembers.includes(username)) {
          const user = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);
          if (user && !user.groups.includes(groupName)) {
            user.groups.push(groupName);
            await this.storage.setItem(`entities/users/${username}`, user);
          }
        }
      }
    }

    return this.projectForceToGroup(force);
  }

  /**
   * Delete group (force)
   */
  async deleteGroup(groupName: string): Promise<void> {
    const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${groupName}`);
    if (!force) return;

    // Remove group from all user memberships
    for (const username of force.members) {
      const user = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);
      if (user) {
        user.groups = user.groups.filter(g => g !== groupName);
        await this.storage.setItem(`entities/users/${username}`, user);
      }
    }

    // Delete force
    await this.storage.removeItem(`entities/forces/${groupName}`);

    // Update index
    const forceIds = await this.storage.getItem<string[]>('entities/forces/_index') || [];
    const index = forceIds.indexOf(groupName);
    if (index > -1) {
      forceIds.splice(index, 1);
      await this.storage.setItem('entities/forces/_index', forceIds);
    }
  }

  /**
   * Add member to group (force)
   */
  async addGroupMember(groupName: string, username: string): Promise<void> {
    const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${groupName}`);
    if (!force) return;

    if (!force.members.includes(username)) {
      force.members.push(username);
      await this.storage.setItem(`entities/forces/${groupName}`, force);

      // Update user
      const user = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);
      if (user && !user.groups.includes(groupName)) {
        user.groups.push(groupName);
        await this.storage.setItem(`entities/users/${username}`, user);
      }
    }
  }

  /**
   * Remove member from group (force)
   */
  async removeGroupMember(groupName: string, username: string): Promise<void> {
    const force = await this.storage.getItem<UnifiedForce>(`entities/forces/${groupName}`);
    if (!force) return;

    force.members = force.members.filter(m => m !== username);
    await this.storage.setItem(`entities/forces/${groupName}`, force);

    // Update user
    const user = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);
    if (user) {
      user.groups = user.groups.filter(g => g !== groupName);
      await this.storage.setItem(`entities/users/${username}`, user);
    }
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