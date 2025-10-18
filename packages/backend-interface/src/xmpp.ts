/**
 * XMPP Backend Operations Interface
 * All backend implementations (mock, OpenFire) must implement this contract
 */

import type {
  XMPPUser,
  XMPPPresence,
  XMPPRoom,
  XMPPOccupant,
  XMPPMessage,
  MAMQuery,
  MAMResult,
  XMPPError,
} from './types';

// ============================================================================
// Connection State
// ============================================================================

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'authenticating'
  | 'authenticated'
  | 'disconnecting'
  | 'error';

export interface ConnectionInfo {
  state: ConnectionState;
  jid?: string; // Full JID with resource
  bareJid?: string; // Bare JID (user@domain)
  error?: XMPPError;
}

// ============================================================================
// Event Handlers
// ============================================================================

export interface XMPPEventHandlers {
  onConnectionStateChange?: (info: ConnectionInfo) => void;
  onMessage?: (message: XMPPMessage) => void;
  onPresence?: (presence: XMPPPresence) => void;
  onRosterUpdate?: (roster: XMPPUser[]) => void;
  onRoomOccupantUpdate?: (roomJid: string, occupants: XMPPOccupant[]) => void;
  onPubSubNotification?: (node: string, payload: unknown) => void;
  onError?: (error: XMPPError) => void;
}

// ============================================================================
// Configuration
// ============================================================================

export interface XMPPConfig {
  // Connection
  websocketUrl?: string; // For OpenFire backend
  domain: string; // XMPP domain (e.g., 'wargame.local')

  // Services
  conferenceService?: string; // MUC service (e.g., 'conference.wargame.local')
  pubsubService?: string; // PubSub service (e.g., 'pubsub.wargame.local')

  // Credentials
  username?: string;
  password?: string;
  resource?: string; // Connection resource

  // Mock-specific
  mockPersistence?: 'localStorage' | 'indexedDB' | 'memory';
  mockLatency?: number; // Simulate network delay (ms)
  mockDebug?: boolean;
}

// ============================================================================
// Main XMPP Backend Interface
// ============================================================================

export interface XMPPBackend {
  // ===== Connection Management =====

  /**
   * Connect and authenticate to XMPP server
   * @returns Promise resolving to authenticated JID
   */
  connect(username: string, password: string): Promise<string>;

  /**
   * Disconnect from XMPP server
   */
  disconnect(): Promise<void>;

  /**
   * Get current connection state
   */
  getConnectionInfo(): ConnectionInfo;

  /**
   * Register event handlers
   */
  on(handlers: XMPPEventHandlers): void;

  // ===== Roster Operations (RFC 6121) =====

  /**
   * Get user roster (contact list)
   */
  getRoster(): Promise<XMPPUser[]>;

  /**
   * Add contact to roster
   */
  addRosterItem(jid: string, name?: string, groups?: string[]): Promise<void>;

  /**
   * Remove contact from roster
   */
  removeRosterItem(jid: string): Promise<void>;

  /**
   * Update roster item
   */
  updateRosterItem(jid: string, name?: string, groups?: string[]): Promise<void>;

  // ===== Presence Operations (RFC 6121) =====

  /**
   * Send presence broadcast
   */
  sendPresence(show?: 'away' | 'chat' | 'dnd' | 'xa', status?: string, priority?: number): Promise<void>;

  /**
   * Send unavailable presence (go offline)
   */
  sendUnavailable(): Promise<void>;

  /**
   * Subscribe to user's presence
   */
  subscribePresence(jid: string): Promise<void>;

  // ===== Direct Messaging (RFC 6121) =====

  /**
   * Send 1:1 chat message
   */
  sendMessage(to: string, body: string, thread?: string): Promise<string>;

  // ===== Multi-User Chat Operations (XEP-0045) =====

  /**
   * Join a MUC room
   */
  joinRoom(roomJid: string, nickname: string, password?: string): Promise<void>;

  /**
   * Leave a MUC room
   */
  leaveRoom(roomJid: string): Promise<void>;

  /**
   * Send groupchat message to room
   */
  sendGroupchatMessage(roomJid: string, body: string): Promise<string>;

  /**
   * Get room information (disco#info)
   */
  getRoomInfo(roomJid: string): Promise<XMPPRoom>;

  /**
   * Get room occupants
   */
  getRoomOccupants(roomJid: string): Promise<XMPPOccupant[]>;

  /**
   * Get all rooms the current user is a member of
   * Returns rooms where:
   * - Room is public (all-hands), OR
   * - User JID is in room member list, OR
   * - User's roster groups overlap with room's assigned groups
   */
  getMyRooms(): Promise<XMPPRoom[]>;

  /**
   * Change room subject
   */
  setRoomSubject(roomJid: string, subject: string): Promise<void>;

  /**
   * Get room configuration form
   */
  getRoomConfig(roomJid: string): Promise<Record<string, unknown>>;

  /**
   * Update room configuration
   */
  setRoomConfig(roomJid: string, config: Record<string, unknown>): Promise<void>;

  /**
   * Grant/revoke room affiliation
   */
  setAffiliation(
    roomJid: string,
    jid: string,
    affiliation: 'owner' | 'admin' | 'member' | 'none' | 'outcast',
    reason?: string
  ): Promise<void>;

  /**
   * Grant/revoke room role
   */
  setRole(
    roomJid: string,
    nickname: string,
    role: 'moderator' | 'participant' | 'visitor' | 'none',
    reason?: string
  ): Promise<void>;

  // ===== Message Archive Management (XEP-0313) =====

  /**
   * Query message archive
   */
  queryArchive(roomJid: string, query: MAMQuery): Promise<MAMResult>;

  // ===== PubSub Operations (XEP-0060) =====

  /**
   * Subscribe to PubSub node
   */
  subscribePubSub(node: string): Promise<void>;

  /**
   * Unsubscribe from PubSub node
   */
  unsubscribePubSub(node: string): Promise<void>;

  /**
   * Publish item to PubSub node
   */
  publishPubSub(node: string, payload: unknown, itemId?: string): Promise<string>;

  /**
   * Retrieve items from PubSub node
   */
  retrievePubSub(node: string, maxItems?: number): Promise<Array<{ id: string; payload: unknown }>>;

  /**
   * Delete item from PubSub node
   */
  deletePubSubItem(node: string, itemId: string): Promise<void>;

  /**
   * Create PubSub node
   */
  createPubSubNode(node: string, config?: Record<string, unknown>): Promise<void>;

  /**
   * Delete PubSub node
   */
  deletePubSubNode(node: string): Promise<void>;

  // ===== Chat States (XEP-0085) =====

  /**
   * Send chat state notification
   */
  sendChatState(
    to: string,
    state: 'active' | 'composing' | 'paused' | 'inactive' | 'gone',
    isGroupchat?: boolean
  ): Promise<void>;
}
