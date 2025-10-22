/**
 * XMPP Backend Operations Interface
 *
 * This file defines the contract for XMPP backend implementations.
 * We extend Stanza.js Agent with app-specific methods.
 */

import type { Agent, AgentConfig } from 'stanza';
import type {
  Message,
  Presence,
  MUCUserItem,
  MAMQuery,
  MAMResult,
  StanzaError,
  DiscoInfo,
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
  error?: StanzaError;
}

// ============================================================================
// Event Handlers
// ============================================================================

export interface XMPPEventHandlers {
  onConnectionStateChange?: (info: ConnectionInfo) => void;
  onMessage?: (message: Message) => void;
  onPresence?: (presence: Presence) => void;
  onRoomOccupantUpdate?: (roomJid: string, occupants: MUCUserItem[]) => void;
  onPubSubNotification?: (node: string, payload: unknown) => void;
  onError?: (error: StanzaError) => void;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Extended XMPP configuration
 * Builds on Stanza's AgentConfig with app-specific options
 */
export interface XMPPConfig extends Partial<AgentConfig> {
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
  mockNamespace?: string; // Storage namespace (default: 'war-rooms')
}

// ============================================================================
// Main XMPP Backend Interface
// ============================================================================

/**
 * XMPP Backend Interface
 *
 * Extends Stanza.js Agent with app-specific methods.
 * All backend implementations (mock, OpenFire) must implement this contract.
 */
export interface XMPPBackend extends Agent {
  // ===== Connection Management =====

  /**
   * Get current connection state
   */
  getConnectionInfo(): ConnectionInfo;

  /**
   * Register event handlers
   * NOTE: Named setEventHandlers to avoid conflict with Agent's on() method from EventEmitter
   */
  setEventHandlers(handlers: XMPPEventHandlers): void;

  // ===== Multi-User Chat Operations (XEP-0045) =====

  /**
   * Get room information (disco#info)
   */
  getRoomInfo(roomJid: string): Promise<DiscoInfo>;

  /**
   * Get room occupants
   */
  getRoomOccupants(roomJid: string): Promise<MUCUserItem[]>;

  /**
   * Get all rooms the current user is a member of
   * Returns rooms where:
   * - Room is public (all-hands), OR
   * - User JID is in room member list, OR
   * - User's groups overlap with room's assigned groups
   */
  getMyRooms(): Promise<DiscoInfo[]>;

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
}
