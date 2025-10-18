/**
 * XMPP Protocol Types
 * Following RFC 6121 and relevant XEPs
 */

// ============================================================================
// Core XMPP User Types (RFC 6121, XEP-0054)
// ============================================================================

export interface XMPPUser {
  jid: string; // user@domain/resource
  bare_jid: string; // user@domain (no resource)

  // From roster
  name?: string; // Roster nickname
  subscription: 'both' | 'from' | 'to' | 'none';
  groups: string[]; // Roster groups

  // From vCard (XEP-0054)
  vcard?: {
    fn?: string; // Full name
    nickname?: string;
    email?: string;
    photo?: string; // Base64 or URL
    org?: string;
    title?: string;
  };
}

// ============================================================================
// Presence Types (RFC 6121, XEP-0012, XEP-0115)
// ============================================================================

export interface XMPPPresence {
  from: string; // Full JID
  type?: 'unavailable' | 'subscribe' | 'subscribed' | 'unsubscribe' | 'unsubscribed' | 'error';
  show?: 'away' | 'chat' | 'dnd' | 'xa'; // Extended away, do not disturb, etc.
  status?: string; // Status message
  priority?: number; // Resource priority (-128 to 127)

  // Capabilities (XEP-0115)
  caps?: {
    node: string;
    ver: string;
    hash: string;
  };

  // Last activity (XEP-0012)
  idle?: {
    since: string; // ISO 8601
  };
}

// ============================================================================
// Multi-User Chat (MUC) Types (XEP-0045)
// ============================================================================

export interface XMPPRoom {
  jid: string; // room@conference.domain

  info: {
    identity: {
      category: 'conference';
      type: 'text';
      name: string; // Natural room name
    };
    features: string[]; // MUC features supported

    // MUC configuration form fields
    x?: {
      description?: string;
      subject?: string;
      occupants?: number;

      'muc#roomconfig_roomname'?: string;
      'muc#roomconfig_roomdesc'?: string;
      'muc#roomconfig_persistentroom'?: boolean;
      'muc#roomconfig_publicroom'?: boolean;
      'muc#roomconfig_passwordprotectedroom'?: boolean;
      'muc#roomconfig_roomsecret'?: string;
      'muc#roomconfig_maxusers'?: number;
      'muc#roomconfig_membersonly'?: boolean;
      'muc#roomconfig_moderatedroom'?: boolean;
      'muc#roomconfig_members'?: string[];
      'muc#roomconfig_admins'?: string[];
      'muc#roomconfig_changesubject'?: boolean;
      'muc#roomconfig_enablelogging'?: boolean;
    };
  };

  occupants?: XMPPOccupant[];
}

export interface XMPPOccupant {
  nick: string; // Room nickname
  jid?: string; // Real JID (if visible)
  affiliation: 'owner' | 'admin' | 'member' | 'none' | 'outcast';
  role: 'moderator' | 'participant' | 'visitor' | 'none';

  presence: {
    show?: 'away' | 'chat' | 'dnd' | 'xa';
    status?: string;
  };
}

// ============================================================================
// Message Types (RFC 6121, XEP-0203, XEP-0085, XEP-0313, XEP-0184)
// ============================================================================

export interface XMPPMessage {
  id: string; // Stanza ID
  from: string; // room@conference.domain/nickname
  to: string; // recipient JID
  type: 'groupchat' | 'chat' | 'error' | 'headline' | 'normal';
  body?: string; // Message text
  subject?: string; // Room subject change

  // Timestamps (XEP-0203)
  delay?: {
    stamp: string; // ISO 8601
    from?: string;
  };

  // Thread (RFC 6121)
  thread?: string;

  // Chat states (XEP-0085)
  chatstate?: 'active' | 'composing' | 'paused' | 'inactive' | 'gone';

  // Message Archive ID (XEP-0313)
  mam?: {
    id: string;
    queryid?: string;
  };

  // Receipts (XEP-0184)
  receipt?: {
    request?: boolean;
    received?: string; // ID of received message
  };

  // Custom extensions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  x?: any; // Data forms or custom namespaces
}

// ============================================================================
// Message Archive Management (MAM) Types (XEP-0313)
// ============================================================================

export interface MAMQuery {
  before?: string; // Message ID or timestamp
  after?: string; // Message ID or timestamp
  start?: string; // ISO 8601 timestamp
  end?: string; // ISO 8601 timestamp
  with?: string; // JID filter
  limit?: number; // Max results
}

export interface MAMResult {
  messages: XMPPMessage[];
  complete: boolean;
  first?: string; // First message ID in result
  last?: string; // Last message ID in result
  count?: number; // Total count if available
}

// ============================================================================
// Error Types
// ============================================================================

export interface XMPPError {
  type: 'auth' | 'cancel' | 'continue' | 'modify' | 'wait';
  condition: string;
  text?: string;
  application?: unknown;
}

// ============================================================================
// Stanza Base Types
// ============================================================================

export type StanzaType = 'iq' | 'message' | 'presence';

export interface Stanza {
  type: StanzaType;
  id?: string;
  from?: string;
  to?: string;
  lang?: string;
}
