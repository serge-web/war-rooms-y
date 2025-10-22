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
  UnifiedUser,
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
import { XMPPAdapter } from './adapters/xmpp-adapter';

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
  private adapter: XMPPAdapter;

  constructor(config: XMPPConfig) {
    this.config = config;
    this.latency = config.mockLatency ?? 100;

    this.storage = createStorage({
      backend: config.mockPersistence || 'localStorage',
      debug: config.mockDebug ?? false,
      namespace: config.mockNamespace || 'war-rooms', // Use unified namespace
    });

    // Initialize XMPP adapter
    this.adapter = new XMPPAdapter(this.storage, config.domain);
  }

  // ===== Connection Management =====

  async connect(username: string, _password: string): Promise<string> {
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
    await delay(this.latency);

    // Use adapter to get all users
    return await this.adapter.getAllUsers();
  }

  async addRosterItem(jid: string, name?: string, groups?: string[]): Promise<void> {
    await delay(this.latency);

    const bareJid = getBareJid(jid);
    const username = bareJid.split('@')[0];
    if (!username) {
      throw new Error('Invalid JID format');
    }

    // Create UnifiedUser in unified storage
    const unifiedUser = {
      username,
      jid: bareJid,
      name: name || username,
      groups: groups || [],
      createdAt: new Date().toISOString(),
    };

    await this.storage.setItem(`entities/users/${username}`, unifiedUser);

    // Update user index
    const userIndex = (await this.storage.getItem<string[]>('entities/users/_index')) || [];
    if (!userIndex.includes(username)) {
      userIndex.push(username);
      await this.storage.setItem('entities/users/_index', userIndex);
    }

    // Trigger roster update (adapter will project from unified storage)
    this.handlers.onRosterUpdate?.(await this.getRoster());
  }

  async removeRosterItem(jid: string): Promise<void> {
    await delay(this.latency);

    const bareJid = getBareJid(jid);
    const username = bareJid.split('@')[0];
    if (!username) {
      throw new Error('Invalid JID format');
    }

    // Remove from unified storage
    await this.storage.removeItem(`entities/users/${username}`);

    // Update user index
    const userIndex = (await this.storage.getItem<string[]>('entities/users/_index')) || [];
    const newIndex = userIndex.filter((u) => u !== username);
    await this.storage.setItem('entities/users/_index', newIndex);

    // Trigger roster update
    this.handlers.onRosterUpdate?.(await this.getRoster());
  }

  async updateRosterItem(jid: string, name?: string, groups?: string[]): Promise<void> {
    await delay(this.latency);

    const bareJid = getBareJid(jid);
    const username = bareJid.split('@')[0];
    if (!username) {
      throw new Error('Invalid JID format');
    }

    // Get existing from unified storage
    const existing = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);

    if (!existing) {
      throw new Error(`Roster item not found: ${jid}`);
    }

    // Update in unified storage
    const updated = {
      ...existing,
      groups: groups ?? existing.groups,
      name: name !== undefined ? name : existing.name,
    };

    await this.storage.setItem(`entities/users/${username}`, updated);

    // Trigger roster update (adapter will project from unified storage)
    this.handlers.onRosterUpdate?.(await this.getRoster());
  }

  // ===== Presence Operations =====

  async sendPresence(
    show?: 'away' | 'chat' | 'dnd' | 'xa',
    status?: string,
    priority?: number
  ): Promise<void> {
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
    if (!this.currentJid) {
      return;
    }

    await delay(this.latency);
    await this.storage.removeItem('presence/self');
  }

  async subscribePresence(jid: string): Promise<void> {
    await delay(this.latency);

    // In mock, presence subscriptions are automatically approved
    // Unified storage doesn't track subscription state separately
    // (all roster items are considered 'both' subscription)
    const bareJid = getBareJid(jid);
    const username = bareJid.split('@')[0];

    // Verify user exists in unified storage
    const user = await this.storage.getItem(`entities/users/${username}`);
    if (!user) {
      throw new Error(`User not found: ${jid}`);
    }

    // In unified storage, subscription state is implicit (all users have 'both')
    // No update needed
  }

  // ===== Direct Messaging =====

  async sendMessage(to: string, body: string, thread?: string): Promise<string> {
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
    await delay(this.latency);

    // Extract room name from JID (e.g., "red-command@conference.local" -> "red-command")
    const roomName = roomJid.split('@')[0];
    if (!roomName) {
      throw new Error(`Invalid room JID: ${roomJid}`);
    }

    // Use adapter to get room
    const room = await this.adapter.getRoom(roomName);

    if (!room) {
      throw new Error(`Room not found: ${roomJid}`);
    }

    // Add occupants (runtime state)
    const occupants = await this.getRoomOccupants(roomJid);

    return {
      ...room,
      occupants,
    };
  }

  async getRoomOccupants(roomJid: string): Promise<XMPPOccupant[]> {
    await delay(this.latency);

    const occupants = await this.storage.getAll<XMPPOccupant>(`rooms/${roomJid}/occupants/`);
    return Object.values(occupants);
  }

  async getMyRooms(): Promise<XMPPRoom[]> {
    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    await delay(this.latency);

    // Use adapter to get rooms for current user
    const rooms = await this.adapter.getUserRooms(this.currentJid);

    // Add occupants to each room (runtime state, not in unified model)
    const roomsWithOccupants = await Promise.all(
      rooms.map(async (room) => ({
        ...room,
        occupants: await this.getRoomOccupants(room.jid),
      }))
    );

    return roomsWithOccupants;
  }

  async setRoomSubject(roomJid: string, subject: string): Promise<void> {
    await delay(this.latency);

    // Store subject
    await this.storage.setItem(`rooms/${roomJid}/subject`, subject);
  }

  async getRoomConfig(roomJid: string): Promise<Record<string, unknown>> {
    await delay(this.latency);

    const config = await this.storage.getItem<Record<string, unknown>>(`rooms/${roomJid}/config`);
    return config || {};
  }

  async setRoomConfig(roomJid: string, config: Record<string, unknown>): Promise<void> {
    await delay(this.latency);

    await this.storage.setItem(`rooms/${roomJid}/config`, config);
  }

  async setAffiliation(
    roomJid: string,
    jid: string,
    affiliation: 'owner' | 'admin' | 'member' | 'none' | 'outcast',
    reason?: string
  ): Promise<void> {
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
    _reason?: string
  ): Promise<void> {
    await delay(this.latency);

    // Update occupant role
    const occupant = await this.storage.getItem<XMPPOccupant>(
      `rooms/${roomJid}/occupants/${nickname}`
    );

    if (occupant) {
      occupant.role = role;
      await this.storage.setItem(`rooms/${roomJid}/occupants/${nickname}`, occupant);
    }
  }

  // ===== Message Archive Management =====

  async queryArchive(roomJid: string, query: MAMQuery): Promise<MAMResult> {
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
    await delay(this.latency);

    await this.storage.setItem(`pubsub/subscriptions/${node}`, {
      subscribedAt: getISOTimestamp(),
    });
  }

  async unsubscribePubSub(node: string): Promise<void> {
    await delay(this.latency);

    await this.storage.removeItem(`pubsub/subscriptions/${node}`);
  }

  async publishPubSub(node: string, payload: unknown, itemId?: string): Promise<string> {
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

  async retrievePubSub(
    node: string,
    maxItems?: number
  ): Promise<Array<{ id: string; payload: unknown }>> {
    await delay(this.latency);

    const items = await this.storage.getAll<{ id: string; payload: unknown }>(
      `pubsub/nodes/${node}/items/`
    );
    let result = Object.values(items);

    if (maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }

  async deletePubSubItem(node: string, itemId: string): Promise<void> {
    await delay(this.latency);

    await this.storage.removeItem(`pubsub/nodes/${node}/items/${itemId}`);
  }

  async createPubSubNode(node: string, config?: Record<string, unknown>): Promise<void> {
    await delay(this.latency);

    await this.storage.setItem(`pubsub/nodes/${node}/config`, config || {});
  }

  async deletePubSubNode(node: string): Promise<void> {
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
    _to: string,
    _state: 'active' | 'composing' | 'paused' | 'inactive' | 'gone',
    _isGroupchat = false
  ): Promise<void> {
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
