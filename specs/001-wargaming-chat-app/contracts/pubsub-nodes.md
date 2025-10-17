# PubSub Node Structure: Metadata Management

**Created**: 2025-10-17
**Phase**: Design (Phase 1)
**Purpose**: Define XMPP PubSub node hierarchy for real-time metadata distribution

## Overview

PubSub nodes store and distribute game metadata using XEP-0060 (PubSub) and XEP-0335 (JSON Containers). All payloads are JSON formatted.

## Node Hierarchy

```
/war-rooms
├── /game
│   ├── /metadata          # Core game configuration
│   ├── /state             # Current game state and turn
│   ├── /theme             # Global theme settings
│   └── /public            # Public info for login screen
├── /forces
│   ├── /{forceId}
│   │   ├── /info          # Force details
│   │   ├── /objectives    # Current objectives
│   │   └── /resources     # Resource status
├── /rooms
│   ├── /{roomId}
│   │   ├── /config        # Room configuration
│   │   ├── /theme         # Room-specific theme
│   │   └── /forms         # Available form schemas
├── /forms
│   ├── /schemas           # All form definitions
│   └── /categories        # Form categorization
└── /system
    ├── /announcements     # System-wide messages
    └── /status            # System health/status
```

## Node Configurations

### Access Models

```typescript
enum AccessModel {
  OPEN = 'open',               // Anyone can subscribe
  PRESENCE = 'presence',       // Must be online to subscribe
  ROSTER = 'roster',           // Must be in roster
  AUTHORIZE = 'authorize',     // Requires approval
  WHITELIST = 'whitelist'      // Explicit whitelist
}
```

### Node Options

```typescript
interface NodeConfig {
  title: string;
  description?: string;
  access_model: AccessModel;
  publish_model: 'publishers' | 'subscribers' | 'open';
  max_items?: number;          // 0 for infinite
  persist_items: boolean;
  notify_retract: boolean;
  deliver_payloads: boolean;
  dataform_xslt?: string;      // XSLT for data transformation
}
```

## Node Definitions

### Game Metadata Node
**Path**: `/war-rooms/game/metadata`
**Access**: All authenticated users can subscribe, admins can publish

```typescript
interface GameMetadataPayload {
  id: string;
  title: string;
  description?: string;
  scenario?: string;
  logoUrl?: string;
  realTimeStart?: string;      // ISO 8601
  realTimeEnd?: string;        // ISO 8601
  version: number;
  updatedAt: string;           // ISO 8601
  updatedBy: string;           // User ID
}
```

**Events**:
- `update`: Metadata changed
- `reset`: Game reset to initial state

### Game State Node
**Path**: `/war-rooms/game/state`
**Access**: All authenticated users can subscribe, game masters can publish

```typescript
interface GameStatePayload {
  status: 'setup' | 'running' | 'paused' | 'completed';
  currentTurn: number;
  currentPhase?: string;
  gameTime?: {
    current: string;           // Current game world time
    ratio: number;             // Game time to real time
  };
  lastUpdate: {
    timestamp: string;         // ISO 8601
    changedBy: string;         // User ID
    description?: string;
  };
}
```

**Events**:
- `turn.advance`: Turn number increased
- `phase.change`: Phase within turn changed
- `status.change`: Game status changed
- `time.update`: Game time advanced

### Global Theme Node
**Path**: `/war-rooms/game/theme`
**Access**: All users (including anonymous) can subscribe

```typescript
interface GlobalThemePayload {
  primaryColor: string;        // Hex color
  secondaryColor: string;      // Hex color
  backgroundColor: string;     // Hex color
  fontFamily?: string;
  logoUrl?: string;
  logoPosition?: 'left' | 'center' | 'right';
  customCss?: string;
  updatedAt: string;          // ISO 8601
}
```

### Public Game Info Node
**Path**: `/war-rooms/game/public`
**Access**: Open (no authentication required)

```typescript
interface PublicInfoPayload {
  title: string;
  description?: string;
  logoUrl?: string;
  status?: string;
  startTime?: string;
  theme?: Partial<GlobalThemePayload>;
}
```

### Force Information Nodes
**Path**: `/war-rooms/forces/{forceId}/info`
**Access**: Force members and admins

```typescript
interface ForceInfoPayload {
  id: string;
  name: string;
  color: string;               // Hex color
  commander?: string;          // User ID
  description?: string;
  memberCount: number;
  status: 'active' | 'eliminated' | 'victorious';
  updatedAt: string;
}
```

### Force Objectives Node
**Path**: `/war-rooms/forces/{forceId}/objectives`
**Access**: Force members and admins

```typescript
interface ObjectivesPayload {
  primary: Array<{
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
  secondary: Array<{
    id: string;
    description: string;
    status: string;
  }>;
  updatedAt: string;
}
```

### Room Configuration Node
**Path**: `/war-rooms/rooms/{roomId}/config`
**Access**: Room members can subscribe

```typescript
interface RoomConfigPayload {
  id: string;
  name: string;
  description?: string;
  type: 'standard' | 'all-hands' | 'private' | 'command';
  maxUsers: number;
  accessType: 'public' | 'members-only' | 'invite-only';
  features: {
    persistent: boolean;
    moderated: boolean;
    allowForms: boolean;
  };
  moderators: string[];        // User IDs
  updatedAt: string;
}
```

### Room Theme Node
**Path**: `/war-rooms/rooms/{roomId}/theme`
**Access**: Room members can subscribe

```typescript
interface RoomThemePayload {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  bannerUrl?: string;
  logoUrl?: string;
  customCss?: string;
  updatedAt: string;
}
```

### Room Forms Node
**Path**: `/war-rooms/rooms/{roomId}/forms`
**Access**: Room members can subscribe

```typescript
interface RoomFormsPayload {
  availableForms: Array<{
    id: string;
    name: string;
    category: string;
    requiredRole?: string;
  }>;
  defaultFormId?: string;
  updatedAt: string;
}
```

### Form Schemas Node
**Path**: `/war-rooms/forms/schemas`
**Access**: All authenticated users

```typescript
interface FormSchemaPayload {
  id: string;
  name: string;
  version: string;
  category: 'report' | 'request' | 'update' | 'custom';
  jsonSchema: JSONSchema7;
  uiSchema?: object;
  requiredRole?: string;
  allowedRooms?: string[];
  createdAt: string;
  createdBy: string;
  deprecated?: boolean;
}
```

### System Announcements Node
**Path**: `/war-rooms/system/announcements`
**Access**: All authenticated users

```typescript
interface AnnouncementPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  sticky?: boolean;            // Requires dismissal
  expiresAt?: string;          // ISO 8601
  targetGroups?: string[];     // Specific groups, or all if empty
  createdAt: string;
  createdBy: string;
}
```

## Subscription Management

### Subscribe to Node
```xml
<iq type='set' to='pubsub.domain' id='sub1'>
  <pubsub xmlns='http://jabber.org/protocol/pubsub'>
    <subscribe node='/war-rooms/game/state' jid='user@domain'/>
  </pubsub>
</iq>
```

### Retrieve Latest Item
```xml
<iq type='get' to='pubsub.domain' id='get1'>
  <pubsub xmlns='http://jabber.org/protocol/pubsub'>
    <items node='/war-rooms/game/state' max_items='1'/>
  </pubsub>
</iq>
```

### Publish to Node
```xml
<iq type='set' to='pubsub.domain' id='pub1'>
  <pubsub xmlns='http://jabber.org/protocol/pubsub'>
    <publish node='/war-rooms/game/state'>
      <item id='current'>
        <json xmlns='urn:xmpp:json:0'>
          {
            "status": "running",
            "currentTurn": 5,
            "currentPhase": "movement"
          }
        </json>
      </item>
    </publish>
  </pubsub>
</iq>
```

## Event Notifications

When subscribed to a node, receive notifications:

```xml
<message from='pubsub.domain' to='user@domain'>
  <event xmlns='http://jabber.org/protocol/pubsub#event'>
    <items node='/war-rooms/game/state'>
      <item id='current'>
        <json xmlns='urn:xmpp:json:0'>
          {
            "status": "running",
            "currentTurn": 5
          }
        </json>
      </item>
    </items>
  </event>
</message>
```

## Mock Backend Implementation

The mock backend simulates PubSub using:

```typescript
class MockPubSub {
  private nodes: Map<string, NodeData> = new Map();
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  private storage: LocalForageInstance;

  async publish(node: string, payload: any): Promise<void> {
    // Store in localForage
    await this.storage.setItem(`pubsub:${node}`, {
      payload,
      timestamp: new Date().toISOString(),
      id: generateId()
    });

    // Notify local subscribers
    this.notifySubscribers(node, payload);

    // Broadcast to other tabs
    this.broadcast.postMessage({
      type: 'pubsub.publish',
      node,
      payload
    });
  }

  subscribe(node: string, callback: SubscriptionCallback): () => void {
    if (!this.subscriptions.has(node)) {
      this.subscriptions.set(node, new Set());
    }
    this.subscriptions.get(node)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(node)?.delete(callback);
    };
  }

  async getLatest(node: string): Promise<any> {
    const data = await this.storage.getItem(`pubsub:${node}`);
    return data?.payload;
  }

  private notifySubscribers(node: string, payload: any): void {
    this.subscriptions.get(node)?.forEach(callback => {
      callback({ node, payload, timestamp: new Date().toISOString() });
    });
  }
}
```

## Caching Strategy

### Client-Side Caching
- Cache latest item from each subscribed node
- Invalidate on notification receipt
- Persist cache in sessionStorage
- TTL: 5 minutes for metadata, 30 seconds for state

### Server-Side Caching (OpenFire)
- Use OpenFire's built-in PubSub caching
- Configure max_items per node based on data type
- Enable last-published-item for quick reconnection

## Security Considerations

### Access Control
- Node access enforced by OpenFire affiliations
- Mock backend simulates with role checks
- Sensitive data nodes require explicit whitelist

### Data Validation
- JSON schema validation before publish
- Size limits per payload (default 64KB)
- Rate limiting on publish operations

### Encryption
- TLS for all XMPP connections
- Consider OMEMO for sensitive payloads (future)

## Performance Optimization

### Batching
- Group related updates in single publish
- Debounce rapid state changes (500ms window)
- Aggregate theme updates across nodes

### Selective Subscriptions
- Subscribe only to relevant force nodes
- Unsubscribe from inactive rooms
- Use filtered subscriptions where supported

### Payload Optimization
- Send deltas for large payloads when possible
- Compress large JSON payloads
- Reference external resources vs embedding

## Monitoring

Track for each node:
- Subscription count
- Publish frequency
- Payload size distribution
- Notification delivery latency
- Failed publish attempts

## Migration Support

When schema changes:
1. Publish with new version field
2. Clients handle both old and new formats
3. Deprecation notice in old format
4. Remove old format support after grace period