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
 * Extends Stanza.js Agent with app-specific helper methods.
 * Core XMPP operations use Agent's standard methods.
 *
 * NOTE: Agent provides standard methods:
 * - connect(opts?: AgentConfig): void
 * - disconnect(): void
 * - sendMessage(msg: Message): string
 * - sendPresence(pres?: Presence): string
 * - And MUC/PubSub methods via plugins
 */
export interface XMPPBackend extends Agent {
  // ===== Connection Management =====

  /**
   * Get current connection state (app-specific helper)
   */
  getConnectionInfo(): ConnectionInfo;

  /**
   * Register app event handlers
   * NOTE: Named setEventHandlers to avoid conflict with Agent's on() method from EventEmitter
   */
  setEventHandlers(handlers: XMPPEventHandlers): void;

  // ===== App-Specific Helper Methods =====

  /**
   * Get room information (helper wrapping disco)
   */
  getRoomInfo(roomJid: string): Promise<DiscoInfo>;

  /**
   * Get room occupants (helper)
   */
  getRoomOccupants(roomJid: string): Promise<MUCUserItem[]>;

  /**
   * Get all rooms the current user can access (app-specific logic)
   */
  getMyRooms(): Promise<DiscoInfo[]>;

  /**
   * Query message archive (helper wrapping MAM)
   * Returns MAMFin which contains the results array and paging info
   */
  queryArchive(roomJid: string, query: Partial<MAMQuery>): Promise<import('./types').MAMFin>;
}
