# Data Model: War-Rooms-Y Multi-Room Wargaming Chat Application

**Created**: 2025-10-17
**Phase**: Design (Phase 1)
**Purpose**: Define XMPP-native entities with PubSub extensions following XMPP specifications

## Architecture Principle

The client remains thin by leveraging XMPP protocol features directly. Data comes from two sources:
1. **XMPP Protocol**: Core entities (users, rooms, messages) use native XMPP structures
2. **PubSub Nodes**: Extended metadata stored as JSON in PubSub

Composite entities combine both sources only when needed for the UI.

## XMPP Native Entities

These types directly mirror XMPP protocol specifications.

### XMPPUser (from XMPP Roster & vCard)
```typescript
// Core XMPP user representation - RFC 6121
interface XMPPUser {
  jid: string;                    // user@domain/resource
  bare_jid: string;               // user@domain (no resource)

  // From roster (XEP-0054)
  name?: string;                  // Roster nickname
  subscription: 'both' | 'from' | 'to' | 'none';
  groups: string[];               // Roster groups

  // From vCard (XEP-0054)
  vcard?: {
    fn?: string;                 // Full name
    nickname?: string;
    email?: string;
    photo?: string;              // Base64 or URL
    org?: string;
    title?: string;
  };
}

// Presence stanza - RFC 6121
interface XMPPPresence {
  from: string;                   // Full JID
  type?: 'unavailable' | 'subscribe' | 'subscribed' | 'unsubscribe' | 'unsubscribed' | 'error';
  show?: 'away' | 'chat' | 'dnd' | 'xa';  // Extended away, do not disturb, etc.
  status?: string;                // Status message
  priority?: number;              // Resource priority (-128 to 127)

  // Capabilities (XEP-0115)
  caps?: {
    node: string;
    ver: string;
    hash: string;
  };

  // Last activity (XEP-0012)
  idle?: {
    since: string;               // ISO 8601
  };
}
```

### XMPPRoom (MUC - XEP-0045)
```typescript
// Multi-User Chat room - XEP-0045
interface XMPPRoom {
  jid: string;                    // room@conference.domain

  // Room info from disco#info
  info: {
    identity: {
      category: 'conference';
      type: 'text';
      name: string;              // Natural room name
    };
    features: string[];          // MUC features supported

    // Form fields from room info
    x?: {
      description?: string;
      subject?: string;
      occupants?: number;

      // Configuration form fields
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

  // Current occupants
  occupants?: XMPPOccupant[];
}

// MUC Occupant - XEP-0045
interface XMPPOccupant {
  nick: string;                   // Room nickname
  jid?: string;                   // Real JID (if visible)
  affiliation: 'owner' | 'admin' | 'member' | 'none' | 'outcast';
  role: 'moderator' | 'participant' | 'visitor' | 'none';

  // Presence in room
  presence: {
    show?: 'away' | 'chat' | 'dnd' | 'xa';
    status?: string;
  };
}

// MUC Message - XEP-0045
interface XMPPMessage {
  id: string;                     // Stanza ID
  from: string;                   // room@conference.domain/nickname
  to: string;                     // recipient JID
  type: 'groupchat' | 'chat' | 'error' | 'headline' | 'normal';
  body?: string;                  // Message text
  subject?: string;               // Room subject change

  // Timestamps (XEP-0203)
  delay?: {
    stamp: string;               // ISO 8601
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
    received?: string;           // ID of received message
  };

  // Custom extensions
  x?: any;                       // Data forms or custom namespaces
}
```

## PubSub Extension Entities

These types represent metadata stored in PubSub nodes as JSON (XEP-0335).

### PubSubUserExtension
```typescript
// User metadata from PubSub node /war-rooms/users/{jid}
interface PubSubUserExtension {
  jid: string;                    // Matches XMPP user
  role: 'admin' | 'participant' | 'observer';
  forceId?: string;               // Force affiliation
  customFields?: Record<string, any>;
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

// Groups are roster groups in XMPP, but we extend with metadata
interface PubSubGroupExtension {
  name: string;                   // Matches XMPP roster group name
  type: 'force' | 'role' | 'custom';
  description?: string;
  permissions?: Permission[];     // Additional permissions beyond room access
  createdAt: string;
  updatedAt: string;
  createdBy: string;              // JID of creator
}

interface Permission {
  resource: 'room' | 'user' | 'group' | 'form' | 'metadata';
  action: 'create' | 'read' | 'update' | 'delete';
  scope?: string;
}
```

### PubSubRoomExtension
```typescript
// Room metadata from PubSub node /war-rooms/rooms/{roomJid}
interface PubSubRoomExtension {
  roomJid: string;                // room@conference.domain
  type: 'standard' | 'all-hands' | 'private' | 'command';

  // Visual theming
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    logoUrl?: string;
    bannerUrl?: string;
    customCss?: string;
  };

  // Form associations
  formSchemaIds?: string[];       // Available forms for this room

  // Additional metadata
  forceRestrictions?: string[];   // Force IDs allowed
  createdAt: string;
  createdBy: string;              // JID of creator
  archivedAt?: string;
}
```

### PubSubMessageExtension
```typescript
// Extended message data from PubSub node /war-rooms/messages/{messageId}
interface PubSubMessageExtension {
  messageId: string;              // Stanza ID from XMPP
  formData?: {
    schemaId: string;
    data: Record<string, any>;   // Form submission data
    validation?: {
      valid: boolean;
      errors?: string[];
    };
  };

  // Delivery tracking beyond XMPP receipts
  analytics?: {
    deliveredTo: string[];        // JIDs
    readBy: string[];             // JIDs with timestamps
    reactions?: Record<string, string[]>; // emoji -> JIDs
  };

  // Edit history
  edits?: Array<{
    timestamp: string;
    previousBody: string;
    editedBy: string;             // JID
  }>;
}
```

### PubSubFormSchema
```typescript
// Form schema from PubSub node /war-rooms/forms/schemas
interface PubSubFormSchema {
  id: string;
  name: string;
  version: string;
  category: 'report' | 'request' | 'update' | 'custom';

  // RJSF schema
  jsonSchema: JSONSchema7;
  uiSchema?: object;

  // Access control
  requiredRole?: string;
  allowedRooms?: string[];       // Room JIDs
  allowedForces?: string[];

  // Metadata
  createdAt: string;
  createdBy: string;              // JID
  updatedAt: string;
  deprecated?: boolean;
}
```

### PubSubGameMetadata
```typescript
// Game metadata from PubSub nodes under /war-rooms/game/
interface PubSubGameMetadata {
  // From /war-rooms/game/metadata
  title: string;
  description?: string;
  scenario?: string;
  logoUrl?: string;

  // From /war-rooms/game/theme
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily?: string;
    logoPosition?: 'left' | 'center' | 'right';
  };

  // From /war-rooms/game/state
  state: {
    status: 'setup' | 'running' | 'paused' | 'completed';
    currentTurn: number;
    currentPhase?: string;
    gameTime?: {
      current: string;
      ratio: number;
    };
    lastUpdate: {
      timestamp: string;
      changedBy: string;          // JID
      description?: string;
    };
  };

  // From /war-rooms/game/public
  publicInfo?: {
    title: string;
    description?: string;
    logoUrl?: string;
    status?: string;
  };
}

// Force data from /war-rooms/forces/{forceId}
interface PubSubForce {
  id: string;
  name: string;
  color: string;
  commander?: string;             // JID
  description?: string;

  // From /info node
  memberCount: number;
  status: 'active' | 'eliminated' | 'victorious';

  // From /objectives node
  objectives?: {
    primary: Objective[];
    secondary: Objective[];
  };

  // From /resources node
  resources?: Record<string, any>;
}

interface Objective {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority?: 'critical' | 'high' | 'medium' | 'low';
}
```

## Composite Entities (UI Layer)

These combine XMPP and PubSub data for the UI.

### User (Composite)
```typescript
// Combines XMPP user with PubSub extensions
interface User {
  // From XMPP
  jid: string;
  username: string;               // Local part of JID
  displayName: string;            // From vCard or roster
  presence?: XMPPPresence;
  groups: string[];               // Roster groups

  // From PubSub extension
  role: 'admin' | 'participant' | 'observer';
  forceId?: string;
  email?: string;                 // From vCard or extension
  avatar?: string;                // From vCard or extension

  // Computed
  isOnline: boolean;
  currentRooms: string[];         // From MUC presence
}

// Helper to compose user
function composeUser(xmpp: XMPPUser, pubsub?: PubSubUserExtension): User {
  return {
    jid: xmpp.jid,
    username: xmpp.bare_jid.split('@')[0],
    displayName: xmpp.vcard?.fn || xmpp.name || xmpp.bare_jid,
    groups: xmpp.groups,

    // Merge extension data
    role: pubsub?.role || 'participant',
    forceId: pubsub?.forceId,
    email: xmpp.vcard?.email,
    avatar: xmpp.vcard?.photo,

    // Runtime state
    isOnline: false,  // Set from presence
    currentRooms: []  // Set from MUC occupancy
  };
}
```

### Room (Composite)
```typescript
// Combines XMPP MUC with PubSub extensions
interface Room {
  // From XMPP
  jid: string;
  name: string;                   // Natural name
  description?: string;
  occupants: XMPPOccupant[];
  maxUsers: number;
  isMembersOnly: boolean;
  isPersistent: boolean;
  isModerated: boolean;

  // From PubSub extension
  type: 'standard' | 'all-hands' | 'private' | 'command';
  theme?: RoomTheme;
  formSchemaIds?: string[];
  forceRestrictions?: string[];

  // Computed
  occupantCount: number;
  hasUnread: boolean;             // Client-side state
}

// Helper to compose room
function composeRoom(xmpp: XMPPRoom, pubsub?: PubSubRoomExtension): Room {
  const config = xmpp.info.x || {};

  return {
    jid: xmpp.jid,
    name: config['muc#roomconfig_roomname'] || xmpp.info.identity.name,
    description: config['muc#roomconfig_roomdesc'],
    occupants: xmpp.occupants || [],
    maxUsers: config['muc#roomconfig_maxusers'] || 50,
    isMembersOnly: config['muc#roomconfig_membersonly'] || false,
    isPersistent: config['muc#roomconfig_persistentroom'] || true,
    isModerated: config['muc#roomconfig_moderatedroom'] || false,

    // Extension data
    type: pubsub?.type || 'standard',
    theme: pubsub?.theme,
    formSchemaIds: pubsub?.formSchemaIds,
    forceRestrictions: pubsub?.forceRestrictions,

    // Computed
    occupantCount: xmpp.occupants?.length || 0,
    hasUnread: false  // Client tracks this
  };
}
```

### Message (Composite)
```typescript
// Combines XMPP message with PubSub extensions
interface Message {
  // From XMPP
  id: string;
  from: string;                   // Full JID or room/nick
  body: string;
  timestamp: string;
  thread?: string;

  // Parsed from 'from'
  roomJid?: string;
  senderNick?: string;
  senderJid?: string;

  // From PubSub extension
  formData?: {
    schemaId: string;
    data: Record<string, any>;
  };
  isEdited?: boolean;
  reactions?: Record<string, string[]>;

  // Computed
  isSystemMessage: boolean;
  isOwnMessage: boolean;          // Client determines
}

// Helper to compose message
function composeMessage(
  xmpp: XMPPMessage,
  pubsub?: PubSubMessageExtension,
  currentUserJid?: string
): Message {
  const [roomJid, senderNick] = xmpp.from.split('/');

  return {
    id: xmpp.id,
    from: xmpp.from,
    body: xmpp.body || '',
    timestamp: xmpp.delay?.stamp || new Date().toISOString(),
    thread: xmpp.thread,

    roomJid: xmpp.type === 'groupchat' ? roomJid : undefined,
    senderNick: senderNick,
    senderJid: xmpp.type === 'chat' ? xmpp.from : undefined,

    formData: pubsub?.formData,
    isEdited: (pubsub?.edits?.length || 0) > 0,
    reactions: pubsub?.analytics?.reactions,

    isSystemMessage: !xmpp.body && !!xmpp.subject,
    isOwnMessage: xmpp.from.startsWith(currentUserJid || '')
  };
}
```

## Client Data Flow

The thin client architecture follows this pattern:

```typescript
// 1. Connect to XMPP (native or mock)
const client = await backend.connect({
  jid: 'user@domain',
  password: 'pass'
});

// 2. Get roster (XMPP native)
const roster = await client.getRoster();

// 3. Subscribe to PubSub for extensions
await client.subscribe('war-rooms/users/user@domain');

// 4. Compose data for UI
const users = roster.items.map(xmppUser => {
  const pubsubExt = await getPubSubExtension(xmppUser.jid);
  return composeUser(xmppUser, pubsubExt);
});

// 5. Join room (XMPP native)
await client.joinRoom('room@conference.domain', 'nickname');

// 6. Listen for real-time updates
client.on('message', (xmppMsg) => {
  const pubsubExt = await getPubSubExtension(xmppMsg.id);
  const message = composeMessage(xmppMsg, pubsubExt);
  displayMessage(message);
});
```

## Backend Configuration

```typescript
interface BackendConfig {
  type: 'openfire' | 'mock';

  // OpenFire configuration
  openfire?: {
    websocketUrl: string;         // WSS endpoint
    domain: string;               // XMPP domain
    conference: string;           // MUC service (usually 'conference')
    pubsub: string;              // PubSub service (usually 'pubsub')
  };

  // Mock configuration
  mock?: {
    persistence: 'localStorage' | 'indexedDB' | 'memory';
    debugMode?: boolean;
    initialData?: MockData;
  };
}

// Mock data mimics XMPP structures
interface MockData {
  roster: XMPPUser[];            // Initial roster
  rooms: XMPPRoom[];             // Available MUCs
  messages: XMPPMessage[];       // Historical messages
  pubsubNodes: Map<string, any>; // PubSub node data
}
```

## Storage Patterns

### OpenFire Backend (Production)

All data leverages native XMPP features:

- **Users**: XMPP roster and vCards
- **Groups**: Roster groups (XMPP native)
- **Rooms**: MUC service (XEP-0045)
- **Messages**: MAM (XEP-0313)
- **Presence**: XMPP presence protocol
- **Extended Metadata**: PubSub nodes (XEP-0060 + XEP-0335)

### Mock Backend (Demo Mode)

The mock backend simulates XMPP protocol in browser:

```typescript
// Storage mimics XMPP structures
class MockXMPPStorage {
  // XMPP roster simulation
  async getRoster(jid: string): Promise<XMPPUser[]> {
    const roster = await localForage.getItem(`xmpp:roster:${jid}`);
    return roster || [];
  }

  // MUC room simulation
  async getRoomInfo(roomJid: string): Promise<XMPPRoom> {
    const room = await localForage.getItem(`xmpp:muc:${roomJid}`);
    return room;
  }

  // MAM simulation
  async getMessageArchive(roomJid: string, query: MAMQuery): Promise<XMPPMessage[]> {
    const messages = await localForage.getItem(`xmpp:mam:${roomJid}`);
    return filterByQuery(messages, query);
  }

  // PubSub simulation
  async getPubSubNode(node: string): Promise<any> {
    const data = await localForage.getItem(`xmpp:pubsub:${node}`);
    return data;
  }
}

// Storage keys follow XMPP namespace pattern
const STORAGE_KEYS = {
  ROSTER: 'xmpp:roster:',          // + JID
  MUC: 'xmpp:muc:',                // + room JID
  MAM: 'xmpp:mam:',                // + room JID
  PUBSUB: 'xmpp:pubsub:',          // + node path
  PRESENCE: 'xmpp:presence:',      // + bare JID
  VCARD: 'xmpp:vcard:',            // + bare JID
}
```

## Data Relationships

XMPP protocol defines core relationships:

```
XMPP Native:
- User (JID) *--* Roster Group (via roster subscription)
- User (JID) *--* MUC Room (via occupancy)
- MUC Room 1--* Message (via MAM)
- User (JID) 1--* Presence (multiple resources)

PubSub Extensions:
- User (JID) 1--1 UserExtension (via PubSub node)
- Room (JID) 1--1 RoomExtension (via PubSub node)
- Message (ID) 1--1 MessageExtension (via PubSub node)
- Force 1--* User (via PubSub forceId)
```

## Synchronization Strategy

### Production (OpenFire)

Native XMPP features handle all real-time sync:
- **Presence**: Automatic via XMPP protocol
- **Messages**: Real-time via MUC
- **Roster**: Push updates via roster protocol
- **Metadata**: PubSub notifications

### Demo Mode (Mock)

Browser-based simulation of XMPP:
- **EventEmitter**: Simulates XMPP stanzas locally
- **BroadcastChannel**: Cross-tab synchronization
- **LocalForage watchers**: Detect external changes
- **Mock stanza routing**: Mimics XMPP message flow

## Implementation Notes

### XMPP Protocol Adherence

The thin client leverages XMPP features directly:
- No custom protocol on top of XMPP
- Use standard XEPs where available
- PubSub for all non-core extensions
- MAM for message history (not custom storage)

### Mock Backend Fidelity

The mock must accurately simulate XMPP:
```typescript
class MockXMPPClient {
  // Simulates exact XMPP stanza structure
  sendMessage(msg: XMPPMessage) {
    this.emit('message', msg);
    this.storage.appendMAM(msg);
  }

  // Simulates MUC protocol
  joinRoom(roomJid: string, nick: string) {
    const presence: XMPPPresence = {
      from: `${roomJid}/${nick}`,
      type: undefined
    };
    this.emit('muc:joined', presence);
  }
}
```

### Performance Optimizations

Leverage XMPP efficiently:
- Use roster versioning (XEP-0237)
- Enable stream management (XEP-0198)
- Batch PubSub subscriptions
- Use MAM pagination properly
- Cache vCards locally

### Security Model

XMPP provides security foundation:
- Authentication via SASL
- TLS for transport security
- MUC affiliations for room access
- PubSub access models for metadata
- No custom auth layer needed