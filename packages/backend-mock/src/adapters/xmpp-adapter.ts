/**
 * XMPP Protocol Adapter
 * Projects unified data model to XMPP protocol structures
 */

import type {
  UnifiedRoom,
  UnifiedUser,
  XMPPRoom,
  XMPPUser,
} from '@war-rooms/backend-interface';

import type { Storage } from '../storage';

export class XMPPAdapter {
  constructor(
    private storage: Storage,
    private domain: string
  ) {}

  // ============================================================================
  // Room Operations
  // ============================================================================

  /**
   * Get room in XMPP format
   */
  async getRoom(roomId: string): Promise<XMPPRoom | null> {
    const unified = await this.storage.getItem<UnifiedRoom>(
      `entities/rooms/${roomId}`
    );
    if (!unified) return null;
    return this.projectRoomToXMPP(unified);
  }

  /**
   * Get all rooms accessible to a user
   */
  async getUserRooms(userJid: string): Promise<XMPPRoom[]> {
    // Extract username from JID
    const username = userJid.split('@')[0];
    if (!username) return [];

    // Get user to check force memberships
    const user = await this.storage.getItem<UnifiedUser>(
      `entities/users/${username}`
    );
    if (!user) return [];

    // Get all room IDs
    const roomIds = await this.storage.getItem<string[]>('entities/rooms/_index') || [];
    const accessibleRooms: XMPPRoom[] = [];

    for (const roomId of roomIds) {
      const room = await this.storage.getItem<UnifiedRoom>(
        `entities/rooms/${roomId}`
      );
      if (!room) continue;

      // Check access
      let hasAccess = false;

      // 1. Public room
      if (room.xmpp.publicRoom) {
        hasAccess = true;
      }

      // 2. Individual member
      if (!hasAccess && room.wargaming.individualMembers?.includes(username)) {
        hasAccess = true;
      }

      // 3. Group member
      if (!hasAccess && room.wargaming.groupMembers) {
        const userGroups = user.groups;
        hasAccess = room.wargaming.groupMembers.some(group =>
          userGroups.includes(group)
        );
      }

      if (hasAccess) {
        accessibleRooms.push(this.projectRoomToXMPP(room));
      }
    }

    return accessibleRooms;
  }

  /**
   * Get all rooms (for admin operations)
   */
  async getAllRooms(): Promise<XMPPRoom[]> {
    const roomIds = await this.storage.getItem<string[]>('entities/rooms/_index') || [];
    const rooms: XMPPRoom[] = [];

    for (const roomId of roomIds) {
      const room = await this.storage.getItem<UnifiedRoom>(
        `entities/rooms/${roomId}`
      );
      if (room) {
        rooms.push(this.projectRoomToXMPP(room));
      }
    }

    return rooms;
  }

  /**
   * Update room members list (from admin UI)
   */
  async updateRoomMembers(roomId: string, members: string[]): Promise<void> {
    const room = await this.storage.getItem<UnifiedRoom>(
      `entities/rooms/${roomId}`
    );
    if (!room) return;

    // Update individual members
    room.wargaming.individualMembers = members;
    room.modifiedAt = new Date().toISOString();

    await this.storage.setItem(`entities/rooms/${roomId}`, room);
  }

  // ============================================================================
  // User Operations
  // ============================================================================

  /**
   * Get user in XMPP format
   */
  async getUser(username: string): Promise<XMPPUser | null> {
    const unified = await this.storage.getItem<UnifiedUser>(
      `entities/users/${username}`
    );
    if (!unified) return null;
    return this.projectUserToXMPP(unified);
  }

  /**
   * Get all users (roster)
   */
  async getAllUsers(): Promise<XMPPUser[]> {
    const usernames = await this.storage.getItem<string[]>('entities/users/_index') || [];
    const users: XMPPUser[] = [];

    for (const username of usernames) {
      const user = await this.storage.getItem<UnifiedUser>(
        `entities/users/${username}`
      );
      if (user) {
        users.push(this.projectUserToXMPP(user));
      }
    }

    return users;
  }

  // ============================================================================
  // Projection Functions
  // ============================================================================

  /**
   * Project UnifiedRoom to XMPPRoom
   */
  private projectRoomToXMPP(room: UnifiedRoom): XMPPRoom {
    // Convert individual members to JIDs
    const memberJids = room.wargaming.individualMembers?.map(
      username => `${username}@${this.domain}`
    ) || [];

    return {
      jid: room.jid,
      info: {
        identity: {
          category: 'conference',
          type: 'text',
          name: room.name,
        },
        features: this.getRoomFeatures(room),
        x: {
          ...(room.description ? { description: room.description } : {}),
          ...(room.xmpp.subject ? { subject: room.xmpp.subject } : {}),
          'muc#roomconfig_roomname': room.name,
          ...(room.description ? { 'muc#roomconfig_roomdesc': room.description } : {}),
          'muc#roomconfig_persistentroom': room.xmpp.persistent,
          'muc#roomconfig_publicroom': room.xmpp.publicRoom,
          'muc#roomconfig_membersonly': room.xmpp.membersOnly,
          'muc#roomconfig_moderatedroom': room.xmpp.moderated,
          ...(room.xmpp.maxUsers ? { 'muc#roomconfig_maxusers': room.xmpp.maxUsers } : {}),
          'muc#roomconfig_members': memberJids,
          ...(room.xmpp.changeSubject !== undefined ? { 'muc#roomconfig_changesubject': room.xmpp.changeSubject } : {}),
          ...(room.xmpp.password ? {
            'muc#roomconfig_passwordprotectedroom': true,
            'muc#roomconfig_roomsecret': room.xmpp.password,
          } : {}),
        },
      },
      // Occupants are handled separately (runtime state)
      occupants: [],
    };
  }

  /**
   * Project UnifiedUser to XMPPUser
   */
  private projectUserToXMPP(user: UnifiedUser): XMPPUser {
    const bareJid = `${user.username}@${this.domain}`;

    return {
      jid: user.jid || bareJid,
      bare_jid: bareJid,
      name: user.name || user.username,
      subscription: 'both', // In mock, everyone is subscribed
      groups: user.groups,
      vcard: user.vcard || {
        ...(user.name ? { fn: user.name } : {}),
        ...(user.email ? { email: user.email } : {}),
      },
    };
  }

  /**
   * Determine room features based on configuration
   */
  private getRoomFeatures(room: UnifiedRoom): string[] {
    const features = ['http://jabber.org/protocol/muc'];

    if (room.xmpp.persistent) features.push('muc_persistent');
    if (room.xmpp.publicRoom) features.push('muc_public');
    if (room.xmpp.membersOnly) features.push('muc_membersonly');
    if (room.xmpp.moderated) features.push('muc_moderated');
    if (room.xmpp.password) features.push('muc_passwordprotected');
    if (!room.xmpp.changeSubject) features.push('muc_nonanonymous');

    return features;
  }
}