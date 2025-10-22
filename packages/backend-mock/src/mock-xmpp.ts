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
  UserInfo,
  Message,
  DiscoInfo,
  MUCUserItem,
  MAMQuery,
  MAMResult,
  UnifiedUser,
  Presence,
  PresenceShow,
  RosterResult,
  RosterItem,
  ReceivedMUCPresence,
  ReceivedPresence,
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

  connect(opts?: AgentConfig): void {
    // Extract credentials from opts or config
    const username = opts?.jid?.split('@')[0] || this.config.username;
    const password = opts?.password || this.config.password;

    if (!username) {
      throw new Error('Username required for connection');
    }

    this.updateConnectionState('connecting');

    // Async connection in background
    delay(this.latency).then(async () => {
      this.updateConnectionState('authenticating');
      await delay(this.latency);

      // Build full JID with resource
      const resource = opts?.resource || this.config.resource || 'web';
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
      this.sendPresence();

      // Emit session:started event (Stanza convention)
      this.handlers.onConnectionStateChange?.(this.getConnectionInfo());
    });
  }

  disconnect(): void {
    this.updateConnectionState('disconnecting');

    delay(this.latency).then(async () => {
      // Send unavailable presence
      await this.sendUnavailable();

      // Clear session
      await this.storage.removeItem('session');
      delete this.currentJid;

      this.updateConnectionState('disconnected');
    });
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

  setEventHandlers(handlers: XMPPEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // ===== Roster Operations =====

  async getRoster(): Promise<RosterResult> {
    await delay(this.latency);

    // Use adapter to get all users
    const users = await this.adapter.getAllUsers();

    // Convert UserInfo[] to RosterResult format
    const items: RosterItem[] = users.map((user) => ({
      jid: user.jid,
      name: user.displayName,
      subscription: 'both' as const, // Mock: all users have mutual subscription
      groups: user.groups,
    }));

    return { items };
  }

  async updateRosterItem(item: RosterItem): Promise<void> {
    await delay(this.latency);

    const bareJid = getBareJid(item.jid);
    const username = bareJid.split('@')[0];
    if (!username) {
      throw new Error('Invalid JID format');
    }

    // Get existing from unified storage
    const existing = await this.storage.getItem<UnifiedUser>(`entities/users/${username}`);

    if (!existing) {
      // Create new if doesn't exist
      const unifiedUser: UnifiedUser = {
        username,
        jid: bareJid,
        name: item.name || username,
        groups: item.groups || [],
        createdAt: new Date().toISOString(),
      };

      await this.storage.setItem(`entities/users/${username}`, unifiedUser);

      // Update user index
      const userIndex = (await this.storage.getItem<string[]>('entities/users/_index')) || [];
      if (!userIndex.includes(username)) {
        userIndex.push(username);
        await this.storage.setItem('entities/users/_index', userIndex);
      }
    } else {
      // Update existing
      const updated = {
        ...existing,
        groups: item.groups ?? existing.groups,
        name: item.name !== undefined ? item.name : existing.name,
      };

      await this.storage.setItem(`entities/users/${username}`, updated);
    }
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
  }

  // ===== Presence Operations =====

  sendPresence(pres?: Presence): string {
    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    const presence: Presence = pres || {
      from: this.currentJid,
    };

    // Generate ID if not provided
    if (!presence.id) {
      presence.id = generateMessageId();
    }

    // Set from if not provided
    if (!presence.from) {
      presence.from = this.currentJid;
    }

    // Async operations in background
    delay(this.latency).then(() => {
      // Store own presence
      this.storage.setItem('presence/self', presence);
    });

    // Broadcast to contacts (simulated)
    // In real XMPP, server broadcasts to subscribed contacts

    return presence.id;
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

  sendMessage(msg: Message): string {
    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    const message: Message = {
      ...msg,
      id: msg.id || generateMessageId(),
      from: msg.from || this.currentJid,
      type: msg.type || 'chat',
    };

    // Async operations in background
    delay(this.latency).then(() => {
      // Store in archive based on type
      if (message.type === 'groupchat') {
        const roomJid = getBareJid(message.to || '');
        this.storage.setItem(`archive/rooms/${roomJid}/${message.id}`, message);
      } else {
        this.storage.setItem(`archive/direct/${message.id}`, message);
      }

      // Trigger message handler
      this.handlers.onMessage?.(message);
    });

    return message.id;
  }

  // ===== Multi-User Chat Operations =====

  async joinRoom(jid: string, nick: string, opts?: Presence): Promise<ReceivedMUCPresence> {
    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    await delay(this.latency);

    // Store room membership
    await this.storage.setItem(`rooms/${jid}/joined`, {
      nickname: nick,
      joinedAt: getISOTimestamp(),
    });

    // Add self as occupant
    const occupant: MUCUserItem = {
      nick,
      jid: this.currentJid,
      affiliation: 'member',
      role: 'participant',
    };

    await this.storage.setItem(`rooms/${jid}/occupants/${nick}`, occupant);

    // Return MUC presence (self-presence confirming join)
    const mucPresence: ReceivedMUCPresence = {
      from: `${jid}/${nick}`,
      to: this.currentJid,
      type: undefined, // available presence
      muc: {
        statusCodes: [110], // self-presence code
        affiliation: 'member',
        role: 'participant',
        jid: this.currentJid,
      },
    };

    return mucPresence;
  }

  async leaveRoom(jid: string, nick?: string, opts?: Presence): Promise<ReceivedPresence> {
    await delay(this.latency);

    // Get nickname - use provided or lookup stored
    let nickname = nick;
    if (!nickname) {
      const membership = await this.storage.getItem<{ nickname: string }>(`rooms/${jid}/joined`);
      nickname = membership?.nickname;
    }

    if (nickname) {
      // Remove self as occupant
      await this.storage.removeItem(`rooms/${jid}/occupants/${nickname}`);
    }

    // Remove room membership
    await this.storage.removeItem(`rooms/${jid}/joined`);

    // Return unavailable presence
    const presence: ReceivedPresence = {
      from: `${jid}/${nickname}`,
      to: this.currentJid,
      type: 'unavailable',
    };

    return presence;
  }

  async sendGroupchatMessage(roomJid: string, body: string): Promise<string> {
    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    // Get nickname
    const membership = await this.storage.getItem<{ nickname: string }>(`rooms/${roomJid}/joined`);

    if (!membership) {
      throw new Error(`Not joined to room: ${roomJid}`);
    }

    const from = `${roomJid}/${membership.nickname}`;

    const message: Message = {
      id: generateMessageId(),
      from,
      to: roomJid,
      type: 'groupchat',
      body,
    };

    // Use sendMessage for consistency
    return this.sendMessage(message);
  }

  async getRoomInfo(roomJid: string): Promise<DiscoInfo> {
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

    return room;
  }

  async getRoomOccupants(roomJid: string): Promise<MUCUserItem[]> {
    await delay(this.latency);

    const occupants = await this.storage.getAll<MUCUserItem>(`rooms/${roomJid}/occupants/`);
    return Object.values(occupants);
  }

  async getMyRooms(): Promise<DiscoInfo[]> {
    if (!this.currentJid) {
      throw new Error('Not connected');
    }

    await delay(this.latency);

    // Use adapter to get rooms for current user
    const rooms = await this.adapter.getUserRooms(this.currentJid);

    return rooms;
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
    const occupant = await this.storage.getItem<MUCUserItem>(
      `rooms/${roomJid}/occupants/${nickname}`
    );

    if (occupant) {
      occupant.role = role;
      await this.storage.setItem(`rooms/${roomJid}/occupants/${nickname}`, occupant);
    }
  }

  // ===== Message Archive Management =====

  async queryArchive(roomJid: string, query: Partial<MAMQuery>): Promise<MAMResult> {
    await delay(this.latency);

    // Get all messages for room
    const allMessages = await this.storage.getAll<Message>(`archive/rooms/${roomJid}/`);
    let messages = Object.values(allMessages);

    // Filter by timestamp
    if (query.start || query.end) {
      messages = messages.filter((msg) => {
        const timestamp = msg.delay?.timestamp || getISOTimestamp();
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
