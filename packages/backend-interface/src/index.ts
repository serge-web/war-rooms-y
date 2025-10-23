/**
 * Backend Interface Package
 * XMPP protocol types and backend operation interfaces
 */

// Export Stanza.js types
export type {
  // Core Stanza types
  Message,
  Presence,
  IQ,
  StreamError,
  StanzaError,
  JID,
  Delay,

  // MUC types
  MUCJoin,
  MUCPresence,
  MUCUserItem,
  MUCHistory,
  MUCInfo,
  MUCAffiliation,
  MUCRole,

  // PubSub types
  Pubsub,
  PubsubItem,
  PubsubItemContent,
  PubsubSubscription,
  PubsubPublish,
  PubsubEvent,
  PubsubEventItems,

  // MAM types
  MAMQuery,
  MAMResult,
  MAMFin,

  // Roster types
  RosterResult,
  RosterItem,
  Roster,

  // Received stanzas
  ReceivedMessage,
  ReceivedPresence,
  ReceivedMUCPresence,
  ReceivedIQ,

  // Service Discovery
  DiscoInfo,
  DiscoItem,
  DiscoInfoIdentity,
  DiscoFeature,

  // Data Forms
  DataForm,
  DataFormField,

  // Type aliases
  MessageType,
  PresenceType,
  PresenceShow,

  // App-specific types
  UserInfo,

  // Backward compatibility (deprecated)
  XMPPUser,
  XMPPPresence,
  XMPPRoom,
  XMPPOccupant,
  XMPPMessage,
  XMPPError,
  StanzaType,
  Stanza,
} from './types';

// Export XMPP backend interface
export type {
  ConnectionState,
  ConnectionInfo,
  XMPPEventHandlers,
  XMPPConfig,
  XMPPBackend,
} from './xmpp';

// Export PubSub metadata types and operations
export type {
  GameMetadata,
  GameTheme,
  ForceMetadata,
  RoomExtension,
  FormSchema,
  PubSubUpdate,
  PubSubMetadata,
} from './pubsub';

export { PUBSUB_NODES } from './pubsub';

// Export OpenFire REST API types
export type { OpenFireUser, OpenFireGroup, OpenFireRoom, PaginationParams } from './rest';

// Export Unified Data Model types
export type { UnifiedRoom, UnifiedForce, UnifiedUser, UnifiedFormTemplate } from './unified';

export { UNIFIED_KEYS } from './unified';
