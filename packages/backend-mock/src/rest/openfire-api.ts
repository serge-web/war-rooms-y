/**
 * Mock OpenFire REST API v1.12.0
 * Simulates OpenFire REST endpoints for admin UI
 */

import type { Storage } from '../storage';
import { RESTAdapter } from '../adapters/rest-adapter';

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
// Mock OpenFire REST API
// ============================================================================

export class MockOpenFireAPI {
  private adapter: RESTAdapter;

  constructor(
    storage: Storage,
    domain: string = 'wargame.local',
    conferenceService: string = 'conference.wargame.local'
  ) {
    this.adapter = new RESTAdapter(storage, domain, conferenceService);
  }

  // ==========================================================================
  // Users
  // ==========================================================================

  async getUsers(params?: PaginationParams): Promise<OpenFireUser[]> {
    let users = await this.adapter.getAllUsers();

    // Apply search filter
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      users = users.filter((u) => u.username.toLowerCase().includes(searchLower));
    }

    // Apply pagination
    const startIndex = params?.startIndex || 0;
    const count = params?.count || users.length;
    return users.slice(startIndex, startIndex + count);
  }

  async getUser(username: string): Promise<OpenFireUser | null> {
    return await this.adapter.getUser(username);
  }

  async createUser(user: OpenFireUser): Promise<OpenFireUser> {
    const existing = await this.adapter.getUser(user.username);
    if (existing) {
      throw new Error(`User ${user.username} already exists`);
    }

    return await this.adapter.createUser(user);
  }

  async updateUser(username: string, updates: Partial<OpenFireUser>): Promise<OpenFireUser> {
    const updated = await this.adapter.updateUser(username, updates);
    if (!updated) {
      throw new Error(`User ${username} not found`);
    }
    return updated;
  }

  async deleteUser(username: string): Promise<void> {
    // Delete is idempotent - no error if user doesn't exist
    await this.adapter.deleteUser(username);
  }

  // ==========================================================================
  // Groups (Forces)
  // ==========================================================================

  async getGroups(): Promise<OpenFireGroup[]> {
    return await this.adapter.getAllGroups();
  }

  async getGroup(name: string): Promise<OpenFireGroup | null> {
    return await this.adapter.getGroup(name);
  }

  async createGroup(group: OpenFireGroup): Promise<OpenFireGroup> {
    const existing = await this.adapter.getGroup(group.name);
    if (existing) {
      throw new Error(`Group ${group.name} already exists`);
    }

    return await this.adapter.createGroup(group);
  }

  async updateGroup(name: string, updates: Partial<OpenFireGroup>): Promise<OpenFireGroup> {
    const updated = await this.adapter.updateGroup(name, updates);
    if (!updated) {
      throw new Error(`Group ${name} not found`);
    }
    return updated;
  }

  async deleteGroup(name: string): Promise<void> {
    const existing = await this.adapter.getGroup(name);
    if (!existing) {
      throw new Error(`Group ${name} not found`);
    }
    await this.adapter.deleteGroup(name);
  }

  async addGroupMember(groupName: string, username: string): Promise<void> {
    const group = await this.adapter.getGroup(groupName);
    if (!group) {
      throw new Error(`Group ${groupName} not found`);
    }
    await this.adapter.addGroupMember(groupName, username);
  }

  async removeGroupMember(groupName: string, username: string): Promise<void> {
    const group = await this.adapter.getGroup(groupName);
    if (!group) {
      throw new Error(`Group ${groupName} not found`);
    }
    await this.adapter.removeGroupMember(groupName, username);
  }

  // ==========================================================================
  // Rooms (MUC)
  // ==========================================================================

  async getRooms(): Promise<OpenFireRoom[]> {
    return await this.adapter.getAllRooms();
  }

  async getRoom(roomName: string): Promise<OpenFireRoom | null> {
    return await this.adapter.getRoom(roomName);
  }

  async createRoom(room: OpenFireRoom): Promise<OpenFireRoom> {
    const existing = await this.adapter.getRoom(room.roomName);
    if (existing) {
      throw new Error(`Room ${room.roomName} already exists`);
    }

    return await this.adapter.createRoom(room);
  }

  async updateRoom(roomName: string, updates: Partial<OpenFireRoom>): Promise<OpenFireRoom> {
    const updated = await this.adapter.updateRoom(roomName, updates);
    if (!updated) {
      throw new Error(`Room ${roomName} not found`);
    }
    return updated;
  }

  async deleteRoom(roomName: string): Promise<void> {
    const existing = await this.adapter.getRoom(roomName);
    if (!existing) {
      throw new Error(`Room ${roomName} not found`);
    }
    await this.adapter.deleteRoom(roomName);
  }

  async addRoomMember(roomName: string, jid: string, _role: 'owner' | 'admin' | 'member' | 'outcast'): Promise<void> {
    const room = await this.adapter.getRoom(roomName);
    if (!room) {
      throw new Error(`Room ${roomName} not found`);
    }

    // Extract username from JID and add to members
    const username = jid.split('@')[0];
    if (!username) return;

    const members = room.members || [];
    if (!members.includes(jid)) {
      members.push(jid);
      await this.adapter.updateRoom(roomName, { members });
    }
  }

  async removeRoomMember(roomName: string, jid: string, _role: 'owner' | 'admin' | 'member' | 'outcast'): Promise<void> {
    const room = await this.adapter.getRoom(roomName);
    if (!room) {
      throw new Error(`Room ${roomName} not found`);
    }

    const members = (room.members || []).filter(m => m !== jid);
    await this.adapter.updateRoom(roomName, { members });
  }
}
