/**
 * XMPP Protocol Types - Using Stanza.js
 *
 * This file re-exports Stanza.js types and defines app-specific extensions.
 * Direct adoption eliminates type conversion overhead and ensures compatibility.
 */

// ============================================================================
// Core Stanza.js Type Re-exports
// ============================================================================

// Import from stanza's protocol module
import type {
  Message,
  Presence,
  IQ,
  StreamError,
  StanzaError,

  // MUC types (XEP-0045)
  MUCJoin,
  MUCPresence,
  MUCUserItem,
  MUCHistory,
  MUCInfo,

  // PubSub types (XEP-0060)
  Pubsub,
  PubsubItem,
  PubsubItemContent,
  PubsubSubscription,
  PubsubPublish,
  PubsubEvent,
  PubsubEventItems,

  // MAM types (XEP-0313)
  MAMQuery,
  MAMResult,
  MAMFin,

  // Service Discovery (XEP-0030)
  DiscoInfo,
  DiscoItem,
  DiscoInfoIdentity,

  // Roster (RFC 6121)
  RosterResult,
  RosterItem,
  Roster,

  // Received stanzas
  ReceivedMessage,
  ReceivedPresence,
  ReceivedMUCPresence,
  ReceivedIQ,

  // Delay (XEP-0203)
  Delay,
} from 'stanza/protocol';

// Re-export core types
export type {
  Message,
  Presence,
  IQ,
  StreamError,
  StanzaError,

  MUCJoin,
  MUCPresence,
  MUCUserItem,
  MUCHistory,
  MUCInfo,

  Pubsub,
  PubsubItem,
  PubsubItemContent,
  PubsubSubscription,
  PubsubPublish,
  PubsubEvent,
  PubsubEventItems,

  MAMQuery,
  MAMResult,
  MAMFin,

  DiscoInfo,
  DiscoItem,
  DiscoInfoIdentity,

  RosterResult,
  RosterItem,
  Roster,

  ReceivedMessage,
  ReceivedPresence,
  ReceivedMUCPresence,
  ReceivedIQ,

  Delay,
};

// Re-export JID type
export type { JID } from 'stanza';

// ============================================================================
// Type Aliases for Common String Unions
// ============================================================================

export type MessageType = 'chat' | 'groupchat' | 'error' | 'headline' | 'normal';
export type PresenceType = 'unavailable' | 'subscribe' | 'subscribed' | 'unsubscribe' | 'unsubscribed' | 'error';
export type PresenceShow = 'away' | 'chat' | 'dnd' | 'xa';
export type MUCAffiliation = 'owner' | 'admin' | 'member' | 'none' | 'outcast';
export type MUCRole = 'moderator' | 'participant' | 'visitor' | 'none';

// ============================================================================
// App-Specific Type Extensions
// ============================================================================

/**
 * User information with OpenFire group membership
 *
 * NOTE: We no longer use XMPP rosters for group membership.
 * Groups are fetched from OpenFire's REST API or service discovery.
 */
export interface UserInfo {
  jid: string; // Full JID
  displayName?: string;
  groups: string[]; // OpenFire groups (e.g., 'force-red', 'command')
}

/**
 * Extended room information
 * Combines service discovery info with app-specific metadata
 */
export interface RoomExtension {
  type: 'all-hands' | 'command' | 'standard' | 'private';
  forceRestrictions?: string[]; // Force group IDs that can access this room
  iconUrl?: string;
  color?: string;
}

/**
 * Game metadata for PubSub
 */
export interface GameMetadata extends PubsubItemContent {
  itemType: 'game-metadata';
  gameId?: string;
  turnNumber?: number;
  gameTime?: string;
  phase?: string;
}

/**
 * Game theme metadata
 */
export interface GameTheme {
  id: string;
  name: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  iconUrl?: string;
}

/**
 * Force metadata for PubSub
 */
export interface ForceMetadata extends PubsubItemContent {
  itemType: 'force-metadata';
  forceId: string;
  name: string;
  color: string;
  icon?: string;
  objectives?: string[];
}

/**
 * Form template metadata for PubSub
 */
export interface FormTemplateMetadata extends PubsubItemContent {
  itemType: 'form-template';
  templateId: string;
  name: string;
  description?: string;
  schema: unknown; // JSON Schema
  uiSchema?: unknown; // RJSF UI Schema
  forceRestrictions?: string[];
}

/**
 * Form schema for RJSF
 */
export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  schema: Record<string, unknown>; // JSON Schema
  uiSchema?: Record<string, unknown>; // UI Schema
  forceRestrictions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Backward Compatibility Aliases (Deprecated)
// ============================================================================

/**
 * @deprecated Use Message from 'stanza/protocol' directly
 */
export type XMPPMessage = Message;

/**
 * @deprecated Use Presence from 'stanza/protocol' directly
 */
export type XMPPPresence = Presence;

/**
 * @deprecated Use MUCUserItem from 'stanza/protocol' directly
 */
export type XMPPOccupant = MUCUserItem;

/**
 * @deprecated Use DiscoInfo from 'stanza/protocol' directly
 * Room info is now a combination of DiscoInfo + RoomExtension
 */
export type XMPPRoom = DiscoInfo;

/**
 * @deprecated XMPP Rosters are no longer used
 * Use UserInfo with OpenFire groups instead
 */
export interface XMPPUser {
  jid: string;
  bare_jid: string;
  name?: string;
  subscription: 'both' | 'from' | 'to' | 'none';
  groups: string[];
  vcard?: {
    fn?: string;
    nickname?: string;
    email?: string;
    photo?: string;
    org?: string;
    title?: string;
  };
}

/**
 * @deprecated Use StanzaError from 'stanza/protocol' directly
 */
export type XMPPError = StanzaError;

// ============================================================================
// Re-export common stanza base types
// ============================================================================

export type StanzaType = 'iq' | 'message' | 'presence';

export interface Stanza {
  type: StanzaType;
  id?: string;
  from?: string;
  to?: string;
  lang?: string;
}

// Note: Delay is already exported from stanza/protocol

/**
 * Discovery feature
 */
export interface DiscoFeature {
  var: string;
}

/**
 * Data form types (XEP-0004)
 */
export interface DataForm {
  type?: 'form' | 'submit' | 'cancel' | 'result';
  title?: string;
  instructions?: string;
  fields?: DataFormField[];
}

export interface DataFormField {
  var?: string;
  type?: 'boolean' | 'fixed' | 'hidden' | 'jid-multi' | 'jid-single' | 'list-multi' | 'list-single' | 'text-multi' | 'text-private' | 'text-single';
  label?: string;
  value?: string | string[];
  required?: boolean;
  desc?: string;
  options?: Array<{ label?: string; value: string }>;
}
