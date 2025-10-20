/**
 * Mock OpenFire REST API v1.12.0
 * Simulates OpenFire REST endpoints for admin UI
 */

import type { Storage } from '../storage';

// ============================================================================
// Types (OpenFire REST API v1.12.0)
// ============================================================================

export interface OpenFireUser {
  username: string;
  name?: string;
  email?: string;
  password?: string; // Only for creation/update
  properties?: {
    sharedGroups?: string[];
    [key: string]: unknown;
  };
}

export interface OpenFireGroup {
  name: string;
  description?: string;
  members?: string[]; // Usernames
  admins?: string[]; // Usernames
}

export interface OpenFireRoom {
  roomName: string;
  naturalName: string;
  description?: string;
  subject?: string;
  creationDate?: string;
  modificationDate?: string;
  maxUsers?: number;
  persistent?: boolean;
  publicRoom?: boolean;
  registrationEnabled?: boolean;
  canAnyoneDiscoverJID?: boolean;
  canOccupantsChangeSubject?: boolean;
  canOccupantsInvite?: boolean;
  canChangeNickname?: boolean;
  logEnabled?: boolean;
  loginRestrictedToNickname?: boolean;
  membersOnly?: boolean;
  moderated?: boolean;
  broadcastPresenceRoles?: string[];
  owners?: string[]; // JIDs
  admins?: string[]; // JIDs
  members?: string[]; // JIDs
  outcasts?: string[]; // JIDs
}

export interface PaginationParams {
  startIndex?: number;
  count?: number;
  search?: string;
}

// ============================================================================
// Storage Keys
// ============================================================================

const KEYS = {
  USER: (username: string) => `rest:user:${username}`,
  USERS_LIST: 'rest:users:list',
  GROUP: (name: string) => `rest:group:${name}`,
  GROUPS_LIST: 'rest:groups:list',
  ROOM: (name: string) => `rest:room:${name}`,
  ROOMS_LIST: 'rest:rooms:list',
};

// ============================================================================
// Mock OpenFire REST API
// ============================================================================

export class MockOpenFireAPI {
  constructor(private storage: Storage) {}

  // ==========================================================================
  // Users
  // ==========================================================================

  async getUsers(params?: PaginationParams): Promise<OpenFireUser[]> {
    const usernames = (await this.storage.getItem<string[]>(KEYS.USERS_LIST)) || [];

    let filtered = usernames;
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = usernames.filter((u) => u.toLowerCase().includes(searchLower));
    }

    const startIndex = params?.startIndex || 0;
    const count = params?.count || filtered.length;
    const page = filtered.slice(startIndex, startIndex + count);

    const users: OpenFireUser[] = [];
    for (const username of page) {
      const user = await this.storage.getItem<OpenFireUser>(KEYS.USER(username));
      if (user) {
        // Don't return password
        const { password, ...userWithoutPassword } = user;
        users.push(userWithoutPassword as OpenFireUser);
      }
    }

    return users;
  }

  async getUser(username: string): Promise<OpenFireUser | null> {
    const user = await this.storage.getItem<OpenFireUser>(KEYS.USER(username));
    if (!user) return null;

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as OpenFireUser;
  }

  async createUser(user: OpenFireUser): Promise<OpenFireUser> {
    const existing = await this.getUser(user.username);
    if (existing) {
      throw new Error(`User ${user.username} already exists`);
    }

    // Store user
    await this.storage.setItem(KEYS.USER(user.username), user);

    // Update users list
    const usernames = (await this.storage.getItem<string[]>(KEYS.USERS_LIST)) || [];
    usernames.push(user.username);
    await this.storage.setItem(KEYS.USERS_LIST, usernames);

    // Add to shared groups if specified
    if (user.properties?.sharedGroups) {
      for (const groupName of user.properties.sharedGroups) {
        await this.addGroupMember(groupName, user.username);
      }
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as OpenFireUser;
  }

  async updateUser(username: string, updates: Partial<OpenFireUser>): Promise<OpenFireUser> {
    const existing = await this.storage.getItem<OpenFireUser>(KEYS.USER(username));
    if (!existing) {
      throw new Error(`User ${username} not found`);
    }

    const updated = { ...existing, ...updates, username }; // username cannot change
    await this.storage.setItem(KEYS.USER(username), updated);

    // Update shared groups if changed
    if (updates.properties?.sharedGroups) {
      const oldGroups = existing.properties?.sharedGroups || [];
      const newGroups = updates.properties.sharedGroups;

      // Remove from old groups
      for (const groupName of oldGroups) {
        if (!newGroups.includes(groupName)) {
          await this.removeGroupMember(groupName, username);
        }
      }

      // Add to new groups
      for (const groupName of newGroups) {
        if (!oldGroups.includes(groupName)) {
          await this.addGroupMember(groupName, username);
        }
      }
    }

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword as OpenFireUser;
  }

  async deleteUser(username: string): Promise<void> {
    const user = await this.storage.getItem<OpenFireUser>(KEYS.USER(username));
    if (!user) {
      throw new Error(`User ${username} not found`);
    }

    // Remove from groups
    if (user.properties?.sharedGroups) {
      for (const groupName of user.properties.sharedGroups) {
        await this.removeGroupMember(groupName, username);
      }
    }

    // Delete user
    await this.storage.removeItem(KEYS.USER(username));

    // Update users list
    const usernames = (await this.storage.getItem<string[]>(KEYS.USERS_LIST)) || [];
    const index = usernames.indexOf(username);
    if (index > -1) {
      usernames.splice(index, 1);
      await this.storage.setItem(KEYS.USERS_LIST, usernames);
    }
  }

  // ==========================================================================
  // Groups (Forces)
  // ==========================================================================

  async getGroups(): Promise<OpenFireGroup[]> {
    const groupNames = (await this.storage.getItem<string[]>(KEYS.GROUPS_LIST)) || [];

    const groups: OpenFireGroup[] = [];
    for (const name of groupNames) {
      const group = await this.storage.getItem<OpenFireGroup>(KEYS.GROUP(name));
      if (group) {
        groups.push(group);
      }
    }

    return groups;
  }

  async getGroup(name: string): Promise<OpenFireGroup | null> {
    return await this.storage.getItem<OpenFireGroup>(KEYS.GROUP(name));
  }

  async createGroup(group: OpenFireGroup): Promise<OpenFireGroup> {
    const existing = await this.getGroup(group.name);
    if (existing) {
      throw new Error(`Group ${group.name} already exists`);
    }

    // Initialize with empty members if not provided
    const newGroup: OpenFireGroup = {
      ...group,
      members: group.members || [],
      admins: group.admins || [],
    };

    await this.storage.setItem(KEYS.GROUP(group.name), newGroup);

    // Update groups list
    const groupNames = (await this.storage.getItem<string[]>(KEYS.GROUPS_LIST)) || [];
    groupNames.push(group.name);
    await this.storage.setItem(KEYS.GROUPS_LIST, groupNames);

    // Update user shared groups
    for (const username of newGroup.members || []) {
      const user = await this.storage.getItem<OpenFireUser>(KEYS.USER(username));
      if (user) {
        const sharedGroups = user.properties?.sharedGroups || [];
        if (!sharedGroups.includes(group.name)) {
          sharedGroups.push(group.name);
          await this.updateUser(username, {
            properties: { ...user.properties, sharedGroups },
          });
        }
      }
    }

    return newGroup;
  }

  async updateGroup(name: string, updates: Partial<OpenFireGroup>): Promise<OpenFireGroup> {
    const existing = await this.storage.getItem<OpenFireGroup>(KEYS.GROUP(name));
    if (!existing) {
      throw new Error(`Group ${name} not found`);
    }

    const updated = { ...existing, ...updates, name }; // name cannot change
    await this.storage.setItem(KEYS.GROUP(name), updated);

    return updated;
  }

  async deleteGroup(name: string): Promise<void> {
    const group = await this.storage.getItem<OpenFireGroup>(KEYS.GROUP(name));
    if (!group) {
      throw new Error(`Group ${name} not found`);
    }

    // Remove from user shared groups
    for (const username of group.members || []) {
      const user = await this.storage.getItem<OpenFireUser>(KEYS.USER(username));
      if (user) {
        const sharedGroups = (user.properties?.sharedGroups || []).filter((g) => g !== name);
        await this.updateUser(username, {
          properties: { ...user.properties, sharedGroups },
        });
      }
    }

    // Delete group
    await this.storage.removeItem(KEYS.GROUP(name));

    // Update groups list
    const groupNames = (await this.storage.getItem<string[]>(KEYS.GROUPS_LIST)) || [];
    const index = groupNames.indexOf(name);
    if (index > -1) {
      groupNames.splice(index, 1);
      await this.storage.setItem(KEYS.GROUPS_LIST, groupNames);
    }
  }

  async addGroupMember(groupName: string, username: string): Promise<void> {
    const group = await this.storage.getItem<OpenFireGroup>(KEYS.GROUP(groupName));
    if (!group) {
      throw new Error(`Group ${groupName} not found`);
    }

    const members = group.members || [];
    if (!members.includes(username)) {
      members.push(username);
      group.members = members;
      await this.storage.setItem(KEYS.GROUP(groupName), group);

      // Update user
      const user = await this.storage.getItem<OpenFireUser>(KEYS.USER(username));
      if (user) {
        const sharedGroups = user.properties?.sharedGroups || [];
        if (!sharedGroups.includes(groupName)) {
          sharedGroups.push(groupName);
          await this.updateUser(username, {
            properties: { ...user.properties, sharedGroups },
          });
        }
      }
    }
  }

  async removeGroupMember(groupName: string, username: string): Promise<void> {
    const group = await this.storage.getItem<OpenFireGroup>(KEYS.GROUP(groupName));
    if (!group) {
      throw new Error(`Group ${groupName} not found`);
    }

    const members = group.members || [];
    const index = members.indexOf(username);
    if (index > -1) {
      members.splice(index, 1);
      group.members = members;
      await this.storage.setItem(KEYS.GROUP(groupName), group);

      // Update user
      const user = await this.storage.getItem<OpenFireUser>(KEYS.USER(username));
      if (user) {
        const sharedGroups = (user.properties?.sharedGroups || []).filter((g) => g !== groupName);
        await this.updateUser(username, {
          properties: { ...user.properties, sharedGroups },
        });
      }
    }
  }

  // ==========================================================================
  // Rooms (MUC)
  // ==========================================================================

  async getRooms(): Promise<OpenFireRoom[]> {
    const roomNames = (await this.storage.getItem<string[]>(KEYS.ROOMS_LIST)) || [];

    const rooms: OpenFireRoom[] = [];
    for (const name of roomNames) {
      const room = await this.storage.getItem<OpenFireRoom>(KEYS.ROOM(name));
      if (room) {
        rooms.push(room);
      }
    }

    return rooms;
  }

  async getRoom(roomName: string): Promise<OpenFireRoom | null> {
    return await this.storage.getItem<OpenFireRoom>(KEYS.ROOM(roomName));
  }

  async createRoom(room: OpenFireRoom): Promise<OpenFireRoom> {
    const existing = await this.getRoom(room.roomName);
    if (existing) {
      throw new Error(`Room ${room.roomName} already exists`);
    }

    const now = new Date().toISOString();
    const newRoom: OpenFireRoom = {
      ...room,
      creationDate: now,
      modificationDate: now,
      owners: room.owners || [],
      admins: room.admins || [],
      members: room.members || [],
      outcasts: room.outcasts || [],
      broadcastPresenceRoles: room.broadcastPresenceRoles || ['moderator', 'participant', 'visitor'],
    };

    await this.storage.setItem(KEYS.ROOM(room.roomName), newRoom);

    // Update rooms list
    const roomNames = (await this.storage.getItem<string[]>(KEYS.ROOMS_LIST)) || [];
    roomNames.push(room.roomName);
    await this.storage.setItem(KEYS.ROOMS_LIST, roomNames);

    return newRoom;
  }

  async updateRoom(roomName: string, updates: Partial<OpenFireRoom>): Promise<OpenFireRoom> {
    const existing = await this.storage.getItem<OpenFireRoom>(KEYS.ROOM(roomName));
    if (!existing) {
      throw new Error(`Room ${roomName} not found`);
    }

    const updated: OpenFireRoom = {
      ...existing,
      ...updates,
      roomName, // roomName cannot change
      modificationDate: new Date().toISOString(),
    };

    await this.storage.setItem(KEYS.ROOM(roomName), updated);

    return updated;
  }

  async deleteRoom(roomName: string): Promise<void> {
    const room = await this.storage.getItem<OpenFireRoom>(KEYS.ROOM(roomName));
    if (!room) {
      throw new Error(`Room ${roomName} not found`);
    }

    // Delete room
    await this.storage.removeItem(KEYS.ROOM(roomName));

    // Update rooms list
    const roomNames = (await this.storage.getItem<string[]>(KEYS.ROOMS_LIST)) || [];
    const index = roomNames.indexOf(roomName);
    if (index > -1) {
      roomNames.splice(index, 1);
      await this.storage.setItem(KEYS.ROOMS_LIST, roomNames);
    }
  }

  async addRoomMember(roomName: string, jid: string, role: 'owner' | 'admin' | 'member' | 'outcast'): Promise<void> {
    const room = await this.storage.getItem<OpenFireRoom>(KEYS.ROOM(roomName));
    if (!room) {
      throw new Error(`Room ${roomName} not found`);
    }

    const listKey = `${role}s` as keyof Pick<OpenFireRoom, 'owners' | 'admins' | 'members' | 'outcasts'>;
    const list = (room[listKey] as string[]) || [];

    if (!list.includes(jid)) {
      list.push(jid);
      (room[listKey] as string[]) = list;
      room.modificationDate = new Date().toISOString();
      await this.storage.setItem(KEYS.ROOM(roomName), room);
    }
  }

  async removeRoomMember(roomName: string, jid: string, role: 'owner' | 'admin' | 'member' | 'outcast'): Promise<void> {
    const room = await this.storage.getItem<OpenFireRoom>(KEYS.ROOM(roomName));
    if (!room) {
      throw new Error(`Room ${roomName} not found`);
    }

    const listKey = `${role}s` as keyof Pick<OpenFireRoom, 'owners' | 'admins' | 'members' | 'outcasts'>;
    const list = (room[listKey] as string[]) || [];
    const index = list.indexOf(jid);

    if (index > -1) {
      list.splice(index, 1);
      (room[listKey] as string[]) = list;
      room.modificationDate = new Date().toISOString();
      await this.storage.setItem(KEYS.ROOM(roomName), room);
    }
  }
}
