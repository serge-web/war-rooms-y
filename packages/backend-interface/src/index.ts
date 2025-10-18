/**
 * Backend Interface Package
 * XMPP protocol types and backend operation interfaces
 */

// Export XMPP stanza types
export type {
  XMPPUser,
  XMPPPresence,
  XMPPRoom,
  XMPPOccupant,
  XMPPMessage,
  MAMQuery,
  MAMResult,
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
