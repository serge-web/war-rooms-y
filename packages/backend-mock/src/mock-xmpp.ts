/**
 * Mock XMPP Backend
 * Simulates XMPP protocol using browser storage (localForage or localStorage)
 */

import type {
  XMPPBackend,
  XMPPConfig,
  ConnectionInfo,
  ConnectionState,
  XMPPEventHandlers,
  XMPPUser,
  XMPPMessage,
  XMPPRoom,
  XMPPOccupant,
  MAMQuery,
  MAMResult,
} from '@war-rooms/backend-interface';

import { Storage, createStorage } from './storage';
import {
  getBareJid,
  buildJid,
  generateMessageId,
  getISOTimestamp,
  createPresenceStanza,
  createMessageStanza,
  delay,
} from './helpers';

// ============================================================================
// Mock XMPP Backend Implementation
// ============================================================================

export class MockXMPPBackend implements XMPPBackend {
  private storage: Storage;
  private config: XMPPConfig;
  private handlers: XMPPEventHandlers = {};
  private connectionState: ConnectionState = 'disconnected';
  private currentJid?: string;
  private latency: number;
  private debug: boolean;

  constructor(config: XMPPConfig) {
    this.config = config;
    this.latency = config.mockLatency ?? 100;
    this.debug = config.mockDebug ?? false;

    this.storage = createStorage({
      backend: config.mockPersistence || 'localStorage',
      debug: this.debug,
      namespace: 'war-rooms-mock',
    });

    if (this.debug) {
      console.debug('[MockXMPP] Initialized', { config });
    }
  }

  // ===== Connection Management =====

  async connect(username: string, _password: string): Promise<string> {
    if (this.debug) {
      console.debug('[MockXMPP] connect', { username });
    }

    this.updateConnectionState('connecting');
    await delay(this.latency);

    // Simulate authentication
    this.updateConnectionState('authenticating');
    await delay(this.latency);

    // Build full JID with resource
    const resource = this.config.resource || 'web';
    const fullJid = buildJid(username, this.config.domain, resource);
    const bareJid = getBareJid(fullJid);

    this.currentJid = fullJid;

    // Store session
    await this.storage.setItem('session', {
      jid: fullJid,
      bareJid,
      username,
      connectedAt: getISOTimestamp(),
    });

    this.updateConnectionState('authenticated');

    // Send initial presence
    await this.sendPresence();

    return fullJid;
  }

  async disconnect(): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] disconnect');
    }

    this.updateConnectionState('disconnecting');
    await delay(this.latency);

    // Send unavailable presence
    await this.sendUnavailable();

    // Clear session
    await this.storage.removeItem('session');
    delete this.currentJid;

    this.updateConnectionState('disconnected');
  }

  getConnectionInfo(): ConnectionInfo {
    const info: ConnectionInfo = {
      state: this.connectionState,
    };

    if (this.currentJid) {
      info.jid = this.currentJid;
      info.bareJid = getBareJid(this.currentJid);
    }

    return info;
  }

  on(handlers: XMPPEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // ===== Roster Operations =====

  async getRoster(): Promise<XMPPUser[]> {
    if (this.debug) {
      console.debug('[MockXMPP] getRoster');
    }

    await delay(this.latency);

    const roster = await this.storage.getAll<XMPPUser>('roster/');
    return Object.values(roster);
  }

  async addRosterItem(jid: string, name?: string, groups?: string[]): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] addRosterItem', { jid, name, groups });
    }

    await delay(this.latency);

    const bareJid = getBareJid(jid);
    const item: XMPPUser = {
      jid,
      bare_jid: bareJid,
      subscription: 'both',
      groups: groups || [],
    };

    if (name !== undefined) item.name = name;

    await this.storage.setItem(`roster/${bareJid}`, item);

    // Trigger roster update
    this.handlers.onRosterUpdate?.(await this.getRoster());
  }

  async removeRosterItem(jid: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] removeRosterItem', { jid });
    }

    await delay(this.latency);

    const bareJid = getBareJid(jid);
    await this.storage.removeItem(`roster/${bareJid}`);

    // Trigger roster update
    this.handlers.onRosterUpdate?.(await this.getRoster());
  }

  async updateRosterItem(jid: string, name?: string, groups?: string[]): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] updateRosterItem', { jid, name, groups });
    }

    await delay(this.latency);

    const bareJid = getBareJid(jid);
    const existing = await this.storage.getItem<XMPPUser>(`roster/${bareJid}`);

    if (!existing) {
      throw new Error(`Roster item not found: ${jid}`);
    }

    const updated: XMPPUser = {
      ...existing,
      groups: groups ?? existing.groups,
    };

    if (name !== undefined) {
      updated.name = name;
    }

    await this.storage.setItem(`roster/${bareJid}`, updated);

    // Trigger roster update
    this.handlers.onRosterUpdate?.(await this.getRoster());
  }

  // ===== Presence Operations =====

  async sendPresence(show?: 'away' | 'chat' | 'dnd' | 'xa', status?: string, priority?: number): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] sendPresence', { show, status, priority });
    }

    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    await delay(this.latency);

    const options: Parameters<typeof createPresenceStanza>[1] = {};
    if (show !== undefined) options.show = show;
    if (status !== undefined) options.status = status;
    if (priority !== undefined) options.priority = priority;

    const presence = createPresenceStanza(this.currentJid, options);

    // Store own presence
    await this.storage.setItem('presence/self', presence);

    // Broadcast to contacts (simulated)
    // In real XMPP, server broadcasts to subscribed contacts
  }

  async sendUnavailable(): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] sendUnavailable');
    }

    if (!this.currentJid) {
      return;
    }

    await delay(this.latency);
    await this.storage.removeItem('presence/self');
  }

  async subscribePresence(jid: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] subscribePresence', { jid });
    }

    await delay(this.latency);

    // In mock, we auto-approve subscriptions
    const bareJid = getBareJid(jid);
    const existing = await this.storage.getItem<XMPPUser>(`roster/${bareJid}`);

    if (existing) {
      existing.subscription = 'both';
      await this.storage.setItem(`roster/${bareJid}`, existing);
    }
  }

  // ===== Direct Messaging =====

  async sendMessage(to: string, body: string, thread?: string): Promise<string> {
    if (this.debug) {
      console.debug('[MockXMPP] sendMessage', { to, body, thread });
    }

    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    await delay(this.latency);

    const messageOpts: Parameters<typeof createMessageStanza>[0] = {
      from: this.currentJid,
      to,
      type: 'chat',
      body,
    };
    if (thread !== undefined) messageOpts.thread = thread;

    const message = createMessageStanza(messageOpts);

    // Store in archive
    await this.storage.setItem(`archive/direct/${message.id}`, message);

    return message.id;
  }

  // ===== Multi-User Chat Operations =====

  async joinRoom(roomJid: string, nickname: string, _password?: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] joinRoom', { roomJid, nickname });
    }

    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    await delay(this.latency);

    // Store room membership
    await this.storage.setItem(`rooms/${roomJid}/joined`, {
      nickname,
      joinedAt: getISOTimestamp(),
    });

    // Add self as occupant
    const occupant: XMPPOccupant = {
      nick: nickname,
      jid: this.currentJid,
      affiliation: 'member',
      role: 'participant',
      presence: {},
    };

    await this.storage.setItem(`rooms/${roomJid}/occupants/${nickname}`, occupant);
  }

  async leaveRoom(roomJid: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] leaveRoom', { roomJid });
    }

    await delay(this.latency);

    // Get nickname
    const membership = await this.storage.getItem<{ nickname: string }>(`rooms/${roomJid}/joined`);

    if (membership) {
      // Remove self as occupant
      await this.storage.removeItem(`rooms/${roomJid}/occupants/${membership.nickname}`);
    }

    // Remove room membership
    await this.storage.removeItem(`rooms/${roomJid}/joined`);
  }

  async sendGroupchatMessage(roomJid: string, body: string): Promise<string> {
    if (this.debug) {
      console.debug('[MockXMPP] sendGroupchatMessage', { roomJid, body });
    }

    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    await delay(this.latency);

    // Get nickname
    const membership = await this.storage.getItem<{ nickname: string }>(`rooms/${roomJid}/joined`);

    if (!membership) {
      throw new Error(`Not joined to room: ${roomJid}`);
    }

    const from = `${roomJid}/${membership.nickname}`;

    const message = createMessageStanza({
      from,
      to: roomJid,
      type: 'groupchat',
      body,
    });

    // Store in room archive
    await this.storage.setItem(`archive/rooms/${roomJid}/${message.id}`, message);

    // Trigger message handler
    this.handlers.onMessage?.(message);

    return message.id;
  }

  async getRoomInfo(roomJid: string): Promise<XMPPRoom> {
    if (this.debug) {
      console.debug('[MockXMPP] getRoomInfo', { roomJid });
    }

    await delay(this.latency);

    // Get room info from storage
    const info = await this.storage.getItem<XMPPRoom['info']>(`rooms/${roomJid}/info`);

    if (!info) {
      throw new Error(`Room not found: ${roomJid}`);
    }

    const occupants = await this.getRoomOccupants(roomJid);

    return {
      jid: roomJid,
      info,
      occupants,
    };
  }

  async getRoomOccupants(roomJid: string): Promise<XMPPOccupant[]> {
    if (this.debug) {
      console.debug('[MockXMPP] getRoomOccupants', { roomJid });
    }

    await delay(this.latency);

    const occupants = await this.storage.getAll<XMPPOccupant>(`rooms/${roomJid}/occupants/`);
    return Object.values(occupants);
  }

  async getMyRooms(): Promise<XMPPRoom[]> {
    if (this.debug) {
      console.debug('[MockXMPP] getMyRooms');
    }

    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    await delay(this.latency);

    const bareJid = getBareJid(this.currentJid);

    // Get all room info from storage
    const allRoomInfos = await this.storage.getAll<XMPPRoom['info']>('rooms/');
    const roomJids: string[] = [];

    // Extract room JIDs from keys like "rooms/room@conference.domain/info"
    for (const key of Object.keys(allRoomInfos)) {
      const match = key.match(/^rooms\/([^/]+)\/info$/);
      if (match) {
        roomJids.push(match[1]!);
      }
    }

    // Get forces and room extensions from PubSub for membership checking
    const forces = await this.storage.getAll<{ members: string[]; id: string }>('pubsub/nodes//war-rooms/forces/items/');
    const roomExtensions = await this.storage.getAll<{ roomJid: string; forceRestrictions?: string[] }>('pubsub/nodes//war-rooms/rooms/items/');

    const myRooms: XMPPRoom[] = [];

    for (const roomJid of roomJids) {
      const info = allRoomInfos[`rooms/${roomJid}/info`];
      if (!info) continue;

      let hasAccess = false;

      // Check 1: Public room
      if (info.x?.['muc#roomconfig_publicroom'] === true) {
        hasAccess = true;
      }

      // Check 2: User in member list
      if (!hasAccess) {
        const members = info.x?.['muc#roomconfig_members'] as string[] | undefined;
        if (members && members.includes(bareJid)) {
          hasAccess = true;
        }
      }

      // Check 3: User's force has access
      if (!hasAccess) {
        const extension = Object.values(roomExtensions).find((ext) => ext.payload && (ext.payload as any).roomJid === roomJid);
        if (extension?.payload && (extension.payload as any).forceRestrictions) {
          const forceRestrictions = (extension.payload as any).forceRestrictions as string[];

          // Check if user is member of any restricted force
          for (const forceId of forceRestrictions) {
            const force = Object.values(forces).find((f) => f.payload && (f.payload as any).id === forceId);
            if (force?.payload && (force.payload as any).members) {
              const forceMembers = (force.payload as any).members as string[];
              if (forceMembers.includes(bareJid)) {
                hasAccess = true;
                break;
              }
            }
          }
        }
      }

      if (hasAccess) {
        const occupants = await this.getRoomOccupants(roomJid);
        myRooms.push({
          jid: roomJid,
          info,
          occupants,
        });
      }
    }

    return myRooms;
  }

  async setRoomSubject(roomJid: string, subject: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] setRoomSubject', { roomJid, subject });
    }

    await delay(this.latency);

    // Store subject
    await this.storage.setItem(`rooms/${roomJid}/subject`, subject);
  }

  async getRoomConfig(roomJid: string): Promise<Record<string, unknown>> {
    if (this.debug) {
      console.debug('[MockXMPP] getRoomConfig', { roomJid });
    }

    await delay(this.latency);

    const config = await this.storage.getItem<Record<string, unknown>>(`rooms/${roomJid}/config`);
    return config || {};
  }

  async setRoomConfig(roomJid: string, config: Record<string, unknown>): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] setRoomConfig', { roomJid, config });
    }

    await delay(this.latency);

    await this.storage.setItem(`rooms/${roomJid}/config`, config);
  }

  async setAffiliation(
    roomJid: string,
    jid: string,
    affiliation: 'owner' | 'admin' | 'member' | 'none' | 'outcast',
    reason?: string
  ): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] setAffiliation', { roomJid, jid, affiliation, reason });
    }

    await delay(this.latency);

    // Store affiliation
    await this.storage.setItem(`rooms/${roomJid}/affiliations/${jid}`, {
      affiliation,
      reason,
      updatedAt: getISOTimestamp(),
    });
  }

  async setRole(
    roomJid: string,
    nickname: string,
    role: 'moderator' | 'participant' | 'visitor' | 'none',
    reason?: string
  ): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] setRole', { roomJid, nickname, role, reason });
    }

    await delay(this.latency);

    // Update occupant role
    const occupant = await this.storage.getItem<XMPPOccupant>(`rooms/${roomJid}/occupants/${nickname}`);

    if (occupant) {
      occupant.role = role;
      await this.storage.setItem(`rooms/${roomJid}/occupants/${nickname}`, occupant);
    }
  }

  // ===== Message Archive Management =====

  async queryArchive(roomJid: string, query: MAMQuery): Promise<MAMResult> {
    if (this.debug) {
      console.debug('[MockXMPP] queryArchive', { roomJid, query });
    }

    await delay(this.latency);

    // Get all messages for room
    const allMessages = await this.storage.getAll<XMPPMessage>(`archive/rooms/${roomJid}/`);
    let messages = Object.values(allMessages);

    // Filter by timestamp
    if (query.start || query.end) {
      messages = messages.filter((msg) => {
        const timestamp = msg.delay?.stamp || getISOTimestamp();
        if (query.start && timestamp < query.start) return false;
        if (query.end && timestamp > query.end) return false;
        return true;
      });
    }

    // Apply limit
    if (query.limit) {
      messages = messages.slice(0, query.limit);
    }

    const result: MAMResult = {
      messages,
      complete: true,
      count: messages.length,
    };

    if (messages.length > 0) {
      result.first = messages[0]!.id;
      result.last = messages[messages.length - 1]!.id;
    }

    return result;
  }

  // ===== PubSub Operations =====
  // (Basic implementation - will be expanded in T015-T016)

  async subscribePubSub(node: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] subscribePubSub', { node });
    }

    await delay(this.latency);

    await this.storage.setItem(`pubsub/subscriptions/${node}`, {
      subscribedAt: getISOTimestamp(),
    });
  }

  async unsubscribePubSub(node: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] unsubscribePubSub', { node });
    }

    await delay(this.latency);

    await this.storage.removeItem(`pubsub/subscriptions/${node}`);
  }

  async publishPubSub(node: string, payload: unknown, itemId?: string): Promise<string> {
    if (this.debug) {
      console.debug('[MockXMPP] publishPubSub', { node, payload, itemId });
    }

    await delay(this.latency);

    const id = itemId || generateMessageId();

    await this.storage.setItem(`pubsub/nodes/${node}/items/${id}`, {
      id,
      payload,
      publishedAt: getISOTimestamp(),
      publisher: this.currentJid,
    });

    // Trigger notification for subscribers
    this.handlers.onPubSubNotification?.(node, payload);

    return id;
  }

  async retrievePubSub(node: string, maxItems?: number): Promise<Array<{ id: string; payload: unknown }>> {
    if (this.debug) {
      console.debug('[MockXMPP] retrievePubSub', { node, maxItems });
    }

    await delay(this.latency);

    const items = await this.storage.getAll<{ id: string; payload: unknown }>(`pubsub/nodes/${node}/items/`);
    let result = Object.values(items);

    if (maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }

  async deletePubSubItem(node: string, itemId: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] deletePubSubItem', { node, itemId });
    }

    await delay(this.latency);

    await this.storage.removeItem(`pubsub/nodes/${node}/items/${itemId}`);
  }

  async createPubSubNode(node: string, config?: Record<string, unknown>): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] createPubSubNode', { node, config });
    }

    await delay(this.latency);

    await this.storage.setItem(`pubsub/nodes/${node}/config`, config || {});
  }

  async deletePubSubNode(node: string): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] deletePubSubNode', { node });
    }

    await delay(this.latency);

    // Delete node config and all items
    await this.storage.removeItem(`pubsub/nodes/${node}/config`);

    const items = await this.storage.keys(`pubsub/nodes/${node}/items/`);
    for (const item of items) {
      await this.storage.removeItem(item);
    }
  }

  // ===== Chat States =====

  async sendChatState(
    to: string,
    state: 'active' | 'composing' | 'paused' | 'inactive' | 'gone',
    isGroupchat = false
  ): Promise<void> {
    if (this.debug) {
      console.debug('[MockXMPP] sendChatState', { to, state, isGroupchat });
    }

    await delay(this.latency);

    // Chat states are typically not stored, just broadcast
    // In a real implementation, this would send a message stanza with chatstate
  }

  // ===== Private Helpers =====

  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.handlers.onConnectionStateChange?.(this.getConnectionInfo());
  }
}
