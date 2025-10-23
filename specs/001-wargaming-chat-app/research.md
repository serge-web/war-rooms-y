# Research: War-Rooms-Y Technical Decisions

**Date**: 2025-10-17
**Feature**: Multi-Room Wargaming Chat Application

## Core Architecture Decision

### XMPP-First Thin Client

**Decision**: Leverage XMPP protocol directly as the primary data layer
**Rationale**:

- XMPP handles all core messaging, presence, and room management
- No need for custom protocols or heavy abstraction layers
- OpenFire does the heavy lifting for authentication, authorization, and routing
- Client remains extremely lightweight
- PubSub provides extensibility for metadata without modifying core protocol

**Architecture principles**:

- Use native XMPP features wherever possible
- Store extended metadata in PubSub nodes
- Compose XMPP + PubSub data only at the UI layer
- Mock backend must faithfully simulate XMPP protocol

## Technology Decisions

### 1. XMPP Client Library

**Decision**: Stanza.js (https://github.com/legastero/stanza)
**Rationale**:

- JSON-native API aligns with XMPP-first approach
- TypeScript-first with excellent type definitions
- Modern async/await patterns
- Built-in support for all required XEPs (MAM, MUC, PubSub, Stream Management)
- Thin wrapper around XMPP protocol, not heavy abstraction
- Active maintenance by XMPP standards author

**Alternatives considered**:

- @xmpp/client: More traditional but requires XML handling
- Strophe.js: Legacy patterns, late TypeScript adoption

### 2. Connection Management Pattern

**Decision**: Singleton connection manager with React Context + Zustand
**Rationale**:

- Single XMPP connection shared across all components
- Zustand for global connection state (status, roster, presence)
- React Context for dependency injection
- Automatic reconnection with exponential backoff

**Implementation**:

```typescript
// Using Stanza.js
import { createClient } from 'stanza';

const client = createClient({
  jid: 'user@domain',
  password: 'pass',
  transports: {
    websocket: 'wss://openfire-server:7443/ws',
  },
});

// Enable Stream Management
client.use(client.plugins['stream-management']);
```

### 3. State Management

**Decision**: Zustand (global) + Jotai (per-room messages)
**Rationale**:

- Zustand for connection state, roster, presence (app-wide)
- Jotai atoms for per-room message streams (fine-grained reactivity)
- Minimal re-renders, excellent TypeScript support
- No boilerplate compared to Redux

**Alternatives considered**:

- Redux Toolkit: Too much boilerplate for real-time updates
- Valtio: Less mature ecosystem
- MobX: Class-based patterns don't align with functional React

### 4. Message History (MAM)

**Decision**: XEP-0313 MAM with pagination
**Rationale**:

- Permanent message retention per requirements
- Server-side pagination reduces client memory usage
- Query by date range or message ID
- OpenFire has excellent MAM support

**Implementation pattern**:

- Initial load: Last 50 messages per room
- Infinite scroll: Load 20 messages at a time
- Use RSM (Result Set Management) for pagination

### 5. Metadata Storage

**Decision**: XMPP PubSub with XEP-0335 (JSON Containers)
**Rationale**:

- Native JSON storage in XMPP
- Real-time updates via PubSub subscriptions
- No additional database required
- Perfect for game metadata, themes, form schemas

**Node structure**:

```
/game/metadata - Global game settings
/game/state - Game time and turn number
/forms/schemas - RJSF form definitions
/rooms/{jid}/theme - Per-room theming
/forces/{id}/metadata - Force-specific data
```

### 6. Form Framework

**Decision**: React JSON Schema Form (RJSF) with rjsf-builder
**Rationale**:

- Industry standard for dynamic forms
- TypeScript support via generics
- Admin can design forms visually with rjsf-builder
- Validation built-in with AJV
- Forms stored as JSON in PubSub

### 7. Layout Management

**Decision**: flexlayout-react
**Rationale**:

- Production-ready draggable/resizable panes
- TypeScript definitions included
- State serialization for persistence
- Supports popout windows
- Better than react-mosaic or rc-dock for this use case

### 8. Testing Strategy

**Decision**: Jest + Playwright + Storybook + MSW
**Rationale**:

- Jest: Unit tests for pure functions and state logic
- Playwright: E2E tests simulating multiple clients
- Storybook: Component isolation and visual testing
- MSW: Mock XMPP and REST in tests/stories

### 9. Build & CI/CD

**Decision**: Vite + GitHub Actions
**Rationale**:

- Vite: Fast builds, native TypeScript support
- GitHub Actions: Integrated with repo, good for air-gapped export
- Branch protection with required checks

### 10. Monorepo Structure

**Decision**: npm workspaces (native)
**Rationale**:

- Native npm feature (no additional tools)
- TypeScript project references for type safety
- Shared dependencies hoisted automatically
- Simpler than Lerna/Nx/Rush for this scale

**Alternatives considered**:

- pnpm workspaces: Better performance but less standard
- Yarn workspaces: No significant advantage
- Lerna: Overkill for this project

## Performance Optimizations

### MUC Room Scaling (50-200 users)

**Decision**: Selective presence broadcasts
**Rationale**:

- Disable presence for rooms >100 users
- Use explicit roster queries instead
- Reduces network traffic by 90%

**Configuration**:

```javascript
// Room configuration for large rooms
{
  'muc#roomconfig_presencebroadcast': [], // No presence broadcasts
  'muc#roomconfig_maxusers': 200,
  'muc#maxhistoryfetch': 0, // Use MAM instead
}
```

### Message Batching

**Decision**: Debounced UI updates
**Rationale**:

- Batch presence updates every 500ms
- Batch message renders in 100ms windows
- Reduces React re-renders significantly

### Offline Support

**Decision**: LocalStorage queue with IndexedDB fallback
**Rationale**:

- LocalStorage for small queue (<1MB)
- IndexedDB for larger offline periods
- Messages include queued timestamp
- Auto-retry with exponential backoff

## Security Considerations

### Authentication

**Decision**: OpenFire username/password via WSS
**Rationale**:

- Simple for air-gapped environments
- No external dependencies
- TLS encryption for credentials
- Session management via Stream Management

### Admin API

**Decision**: Proxy OpenFire REST through backend
**Rationale**:

- Never expose OpenFire secret key to browser
- Additional access control layer
- Request logging and rate limiting

### Content Security

**Decision**: RJSF validation + DOMPurify for display
**Rationale**:

- Schema validation prevents malformed data
- DOMPurify sanitizes any rendered HTML
- CSP headers restrict script execution

## Deployment Architecture

### Development

```
npm run dev (Vite dev server)
OpenFire in Docker
MSW for mocked services
```

### Production (Air-Gapped)

```
1. Build artifacts locally
2. Export as tarball with dependencies
3. Deploy to isolated network
4. OpenFire on same network (no internet)
```

## Backend Abstraction Strategy (Added 2025-10-17)

### Decision: Interface-based backend with swappable implementations

**Rationale**:

- Enables standalone demo/training mode without server
- Supports development without OpenFire setup
- Allows testing without network dependencies
- Single codebase serves both production and demo

### Mock Backend Architecture

**Decision**: XMPP-compliant simulation with localForage + EventEmitter
**Rationale**:

- Must faithfully simulate XMPP protocol behavior
- localForage stores XMPP-structured data (roster, MUC, MAM)
- EventEmitter simulates stanza routing
- Maintains protocol compliance for seamless switching

**Implementation approach**:

```typescript
// Mock must simulate XMPP protocol exactly
interface XMPPBackend {
  // Core XMPP operations
  connect(jid: string, password: string): Promise<void>;
  getRoster(): Promise<XMPPUser[]>;
  sendMessage(msg: XMPPMessage): void;
  joinRoom(roomJid: string, nick: string): void;

  // PubSub operations
  subscribe(node: string): Promise<void>;
  publish(node: string, item: any): Promise<void>;
  getItems(node: string): Promise<any[]>;
}

// Both backends implement same XMPP interface
const backend: XMPPBackend = isDemoMode
  ? new MockXMPPBackend(localForage) // Simulates XMPP
  : new StanzaBackend(config); // Real XMPP
```

**Key requirement**: Mock backend MUST generate identical XMPP stanzas and events as real OpenFire, ensuring the client code never knows the difference.

### Static Build Strategy

**Decision**: Vite static build with runtime config
**Rationale**:

- Single HTML file with embedded JS/CSS
- Runtime backend selection via URL param or localStorage
- No server required for demo mode
- Can be hosted on CDN or opened locally

**Build outputs**:

- `dist/index.html` - Production build (OpenFire)
- `dist/demo.html` - Demo build (localForage default)
- Both use same compiled JS with runtime switch

## Deferred Decisions

1. **Offline message sync**: Full offline-first architecture deferred to Phase 2
2. **End-to-end encryption**: Not required for air-gapped trusted network
3. **Mobile apps**: Web-first, React Native can reuse libraries later
4. **Federation**: Single OpenFire instance sufficient for initial deployment

## Risk Mitigations

| Risk                   | Mitigation                                                        |
| ---------------------- | ----------------------------------------------------------------- |
| OpenFire downtime      | Stream Management for resumption, client-side queue               |
| Network latency        | Optimistic UI updates, local message echo                         |
| Large room performance | Disable presence, paginated MAM                                   |
| Browser compatibility  | Target modern browsers only (Chrome 90+, Firefox 88+, Safari 14+) |
| TypeScript complexity  | Strict mode, comprehensive types for all APIs                     |

## Next Steps

1. Create data model from specification entities
2. Design REST API contracts for admin operations
3. Define PubSub node structure for metadata
4. Create quickstart guide for OpenFire setup

---

# Research: Unifying Mock Data Layers (2025-10-20)

## Executive Summary

This section analyzes technical decisions for consolidating two separate mock data systems (XMPP for chat-ui and REST for admin-ui) into a unified fixture layer while maintaining protocol-specific representations.

## Background

**Current Architecture:**

- **chat-ui**: Uses XMPP protocol types (`XMPPUser`, `XMPPRoom`, `XMPPMessage`) from `backend-interface`
  - Storage namespace: `war-rooms-mock`
  - Fixture source: `packages/backend-mock/src/fixtures.ts`
  - Seeder: `packages/backend-mock/src/seed.ts`
  - Storage keys: `roster/{jid}`, `rooms/{jid}/info`, `archive/rooms/{jid}/{msgId}`

- **admin-ui**: Uses OpenFire REST API types (`OpenFireUser`, `OpenFireGroup`, `OpenFireRoom`)
  - Storage namespace: `war-rooms-admin`
  - REST API: `packages/backend-mock/src/rest/openfire-api.ts`
  - Seeder: `packages/backend-mock/src/rest/seed-rest.ts`
  - Storage keys: `rest:user:{username}`, `rest:group:{name}`, `rest:room:{name}`

**Challenge**: Need single source of truth for mock data that both UIs consume while maintaining protocol fidelity.

---

## Research Topic 1: Entity Mapping Strategy

### Decision: **Canonical XMPP Format with Bidirectional Transformers**

XMPP types serve as canonical internal representation with explicit conversion functions to/from REST.

### Rationale

1. **Protocol Authority**: XMPP is the production protocol. OpenFire REST API exists only for admin operations and maps internally to XMPP entities.

2. **Type Safety**: TypeScript transformers enforce complete mapping:

   ```typescript
   // Unidirectional transformation
   function xmppUserToRest(xmppUser: XMPPUser): OpenFireUser {
     const { local } = parseJid(xmppUser.bare_jid);
     return {
       username: local,
       name: xmppUser.vcard?.fn || xmppUser.name,
       email: xmppUser.vcard?.email,
       properties: {
         sharedGroups: xmppUser.groups,
       },
     };
   }

   function restUserToXmpp(restUser: OpenFireUser, domain: string): XMPPUser {
     const jid = buildJid(restUser.username, domain);
     return {
       jid,
       bare_jid: jid,
       name: restUser.name,
       subscription: 'both', // Default for roster members
       groups: restUser.properties?.sharedGroups || [],
       vcard: {
         fn: restUser.name,
         email: restUser.email,
       },
     };
   }
   ```

3. **Field Mapping Clarity**:
   - **User**: `XMPPUser.bare_jid` → `OpenFireUser.username` (extract local part)
   - **Groups**: `XMPPUser.groups` ↔ `OpenFireUser.properties.sharedGroups`
   - **Room**: `XMPPRoom.jid` → `OpenFireRoom.roomName` (extract local part)
   - **Force Metadata**: Lives in PubSub nodes, referenced by `ForceMetadata.id` = `OpenFireGroup.name`

4. **Asymmetry Handling**: Some fields exist only in one protocol:
   - XMPP-only: `subscription`, `vcard.photo`, `presence.caps`
   - REST-only: `OpenFireRoom.creationDate`, `OpenFireRoom.modificationDate`
   - **Solution**: Use sensible defaults when converting (e.g., `subscription: 'both'` for admin-created users)

### Alternatives Considered

**Option A: Separate Fixture Arrays** (`MOCK_USERS_XMPP`, `MOCK_USERS_REST`)

- ❌ Rejected: Duplication leads to drift. No guarantee fixtures stay in sync.

**Option B: Peer Formats with Conversion** (XMPP and REST as equals)

- ❌ Rejected: Adds conceptual overhead. XMPP is production protocol; REST is administrative interface.

**Option C: Neutral Canonical Format** (internal representation → XMPP/REST)

- ❌ Rejected: Unnecessary abstraction layer. Would still need to map from neutral to XMPP, then XMPP already serves as canonical.

### Implementation Notes

**File Structure:**

```
packages/backend-mock/src/
├── fixtures.ts              # CANONICAL: XMPP fixtures (MOCK_USERS, MOCK_ROOMS, etc.)
├── rest/
│   ├── transformers.ts      # NEW: Bidirectional XMPP ↔ REST conversion
│   ├── openfire-api.ts      # Unchanged: REST API implementation
│   └── seed-rest.ts         # MODIFIED: Use transformers to seed from XMPP fixtures
```

**Transformer Module** (`rest/transformers.ts`):

```typescript
import type { XMPPUser, XMPPRoom } from '@war-rooms/backend-interface';
import type { OpenFireUser, OpenFireGroup, OpenFireRoom } from './openfire-api';
import { parseJid, buildJid } from '../helpers';

// User transformations
export function xmppUserToRest(xmppUser: XMPPUser): OpenFireUser;
export function restUserToXmpp(restUser: OpenFireUser, domain: string): XMPPUser;

// Room transformations
export function xmppRoomToRest(xmppRoom: XMPPRoom): OpenFireRoom;
export function restRoomToXmpp(restRoom: OpenFireRoom, conferenceDomain: string): XMPPRoom;

// Group transformations (roster groups → OpenFire groups)
export function rosterGroupsToRestGroups(users: XMPPUser[]): OpenFireGroup[];
```

---

## Research Topic 2: Storage Namespace Sharing

### Decision: **Shared Namespace with Environment Variable Override**

Both UIs use same default namespace (`war-rooms`) but allow override via `VITE_STORAGE_NAMESPACE`.

### Rationale

1. **Unified Mock State**: Admin changes (create user via REST) must be immediately visible in chat UI (user appears in roster). Shared namespace ensures single source of truth in localStorage.

2. **Development Flexibility**: Environment variable override allows:
   - Test isolation: `namespace: 'test-${uuid}'` in unit tests
   - Multi-tenant development: Run separate game instances side-by-side
   - CI parallelization: Each test suite uses unique namespace

3. **Collision Avoidance**: Storage keys already prefixed by protocol:
   - XMPP: `war-rooms:roster/{jid}`, `war-rooms:rooms/{jid}/info`
   - REST: `war-rooms:rest:user:{username}`, `war-rooms:rest:group:{name}`
   - PubSub: `war-rooms:pubsub:force:{id}`, `war-rooms:pubsub:room:{name}`
   - **No overlap**: Protocol prefixes prevent collisions even within shared namespace.

4. **Key Format Consistency**:

   ```
   {namespace}:{protocol}:{entity-type}:{identifier}

   Examples:
   war-rooms:roster/commander.red@wargame.local
   war-rooms:rest:user:commander.red
   war-rooms:pubsub:force:force-red
   ```

### Alternatives Considered

**Option A: Separate Namespaces** (`war-rooms-xmpp`, `war-rooms-rest`)

- ❌ Rejected: Requires cross-namespace synchronization. Admin UI changes wouldn't reflect in chat UI without complex event bus.

**Option B: Single Hardcoded Namespace**

- ❌ Rejected: Breaks test isolation. Parallel test runs would interfere.

**Option C: App-Specific Namespaces** (`war-rooms-chat`, `war-rooms-admin`)

- ❌ Rejected: Same synchronization problems as Option A. Admin UI is admin interface to same XMPP backend.

### Implementation Notes

**Environment Variable:**

```bash
# .env (default for both apps)
VITE_STORAGE_NAMESPACE=war-rooms

# Test override
VITE_STORAGE_NAMESPACE=test-${TEST_ID}
```

**Storage Creation:**

```typescript
// packages/backend-mock/src/storage.ts (already implemented)
export function createStorage(options: StorageOptions): Storage {
  const namespace = options.namespace || import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms';
  // ...
}
```

**Risk Mitigation:**

- **Namespace Prefix Validation**: Ensure all storage keys follow `{protocol}:{entity}:{id}` pattern
- **Clear Documentation**: Document shared namespace requirement in CLAUDE.md
- **Storage Clearing**: Both UIs must call `storage.clear()` during seeding to prevent orphaned keys

---

## Research Topic 3: Fixture Seeding Coordination

### Decision: **Master Seeder with Sequential Protocol Seeding**

Single `seedAll()` function seeds XMPP representation, then transforms and seeds REST representation.

### Rationale

1. **Dependency Order**: Entities have FK-like relationships:

   ```
   Users → Groups → Forces → Rooms → Messages
   ```

   - Users must exist before Groups can reference them
   - Groups must exist before Forces (PubSub) can link to them
   - Rooms require Force metadata for `forceRestrictions`
   - Messages require Rooms to exist

2. **Transform-Then-Seed Pattern**:

   ```typescript
   export async function seedAll(storage: Storage): Promise<void> {
     // 1. Seed XMPP entities (canonical)
     await seedMockData(storage, { clear: true });

     // 2. Transform XMPP → REST and seed
     await seedRestFromXmpp(storage);
   }

   async function seedRestFromXmpp(storage: Storage): Promise<void> {
     const domain = MOCK_DOMAIN;

     // Seed REST users from XMPP roster
     for (const xmppUser of MOCK_USERS) {
       const restUser = xmppUserToRest(xmppUser);
       await storage.setItem(`rest:user:${restUser.username}`, restUser);
     }

     // Update REST users list
     const usernames = MOCK_USERS.map((u) => parseJid(u.bare_jid).local);
     await storage.setItem('rest:users:list', usernames);

     // Seed REST groups from roster groups
     const restGroups = rosterGroupsToRestGroups(MOCK_USERS);
     for (const group of restGroups) {
       await storage.setItem(`rest:group:${group.name}`, group);
     }
     await storage.setItem(
       'rest:groups:list',
       restGroups.map((g) => g.name)
     );

     // Seed REST rooms from XMPP rooms
     for (const mockRoom of MOCK_ROOMS) {
       const xmppRoom: XMPPRoom = { jid: mockRoom.jid, info: mockRoom.info };
       const restRoom = xmppRoomToRest(xmppRoom);
       await storage.setItem(`rest:room:${restRoom.roomName}`, restRoom);
     }

     const roomNames = MOCK_ROOMS.map((r) => parseJid(r.jid).local);
     await storage.setItem('rest:rooms:list', roomNames);
   }
   ```

3. **Idempotency**: Seeding can be re-run safely (clear flag defaults to `true`).

4. **Single Source of Truth**: Only edit `fixtures.ts` (XMPP format). REST representation auto-generated.

### Alternatives Considered

**Option A: Parallel Seeding** (XMPP and REST simultaneously)

- ❌ Rejected: Race conditions if transformers depend on existence checks. Complex ordering logic.

**Option B: Lazy Transformation** (transform on-demand during REST API calls)

- ❌ Rejected: Performance overhead. Every REST `getUsers()` would transform XMPP roster. Storage should be pre-seeded.

**Option C: Dual Fixture Files** (manual maintenance of both)

- ❌ Rejected: Guaranteed drift between XMPP and REST fixtures.

### Implementation Notes

**Seeding Flow:**

```typescript
// packages/backend-mock/src/seed.ts (MODIFIED)
import { seedRestFromXmpp } from './rest/seed-rest';

export async function seedAll(storage: Storage): Promise<void> {
  // Step 1: Seed XMPP (canonical)
  await seedMockData(storage, DEFAULT_SEED_OPTIONS);

  // Step 2: Seed REST (transformed)
  await seedRestFromXmpp(storage);
}
```

**Error Handling:**

- If XMPP seeding fails, abort before REST seeding
- Log clear separation: `console.info('[XMPP Seed]')` vs `console.info('[REST Seed]')`
- Validation: Assert REST user count matches XMPP user count after seeding

---

## Research Topic 4: Type Safety for Cross-Protocol Entities

### Decision: **Explicit Conversion Functions with Runtime Validation**

All XMPP ↔ REST conversions go through typed transformer functions with optional runtime checks.

### Rationale

1. **Compile-Time Safety**: TypeScript ensures all required fields are mapped:

   ```typescript
   // Compile error if OpenFireUser gains new required field
   function xmppUserToRest(xmppUser: XMPPUser): OpenFireUser {
     return {
       username: parseJid(xmppUser.bare_jid).local,
       name: xmppUser.vcard?.fn || xmppUser.name,
       email: xmppUser.vcard?.email,
       // TypeScript error if 'properties' becomes required
     };
   }
   ```

2. **Runtime Validation (Optional)**: Development-mode assertions catch data quality issues:

   ```typescript
   function xmppUserToRest(xmppUser: XMPPUser): OpenFireUser {
     if (import.meta.env.DEV) {
       if (!xmppUser.bare_jid.includes('@')) {
         throw new Error(`Invalid JID: ${xmppUser.bare_jid}`);
       }
     }
     // ... transformation
   }
   ```

3. **Protocol Evolution**: When OpenFire API adds fields:
   - Add to `OpenFireUser` type
   - TypeScript highlights all transformers needing updates
   - Decide: Map from XMPP field, use default, or mark optional

4. **Reverse Transformation** (REST → XMPP for admin-created entities):

   ```typescript
   function restUserToXmpp(restUser: OpenFireUser, domain: string): XMPPUser {
     const jid = buildJid(restUser.username, domain);
     return {
       jid,
       bare_jid: jid,
       name: restUser.name,
       subscription: 'both', // ASSUMPTION: Admin-created users are roster members
       groups: restUser.properties?.sharedGroups || [],
       vcard: {
         fn: restUser.name,
         email: restUser.email,
       },
     };
   }
   ```

5. **Bidirectional Tests**: Ensure transformations are lossless where applicable:

   ```typescript
   test('round-trip transformation preserves core fields', () => {
     const xmppUser = MOCK_USERS[0];
     const restUser = xmppUserToRest(xmppUser);
     const xmppRoundTrip = restUserToXmpp(restUser, MOCK_DOMAIN);

     expect(xmppRoundTrip.bare_jid).toBe(xmppUser.bare_jid);
     expect(xmppRoundTrip.name).toBe(xmppUser.name);
     expect(xmppRoundTrip.groups).toEqual(xmppUser.groups);
   });
   ```

### Alternatives Considered

**Option A: Canonical Internal Format** (XMPP/REST map to neutral type)

- ❌ Rejected: Unnecessary indirection. XMPP already serves as canonical (see Topic 1).

**Option B: Manual Conversion in API Layer** (no dedicated transformers)

- ❌ Rejected: Scattered logic. Easy to miss fields. Hard to test.

**Option C: Zod/Yup Runtime Schemas** (validate all transformations)

- ⚠️ Partial Adoption: Too heavyweight for every call. Use selectively for admin-created entities.

### Implementation Notes

**Transformer Structure:**

```typescript
// packages/backend-mock/src/rest/transformers.ts

import { z } from 'zod';
import type { XMPPUser, XMPPRoom } from '@war-rooms/backend-interface';
import type { OpenFireUser, OpenFireGroup, OpenFireRoom } from './openfire-api';
import { parseJid, buildJid } from '../helpers';

// ============================================================================
// User Transformations
// ============================================================================

export function xmppUserToRest(xmppUser: XMPPUser): OpenFireUser {
  const { local } = parseJid(xmppUser.bare_jid);

  return {
    username: local,
    name: xmppUser.vcard?.fn || xmppUser.name,
    email: xmppUser.vcard?.email,
    properties: {
      sharedGroups: xmppUser.groups,
    },
  };
}

export function restUserToXmpp(restUser: OpenFireUser, domain: string): XMPPUser {
  const jid = buildJid(restUser.username, domain);

  return {
    jid,
    bare_jid: jid,
    name: restUser.name,
    subscription: 'both', // Default for roster entries
    groups: restUser.properties?.sharedGroups || [],
    vcard: {
      fn: restUser.name,
      email: restUser.email,
    },
  };
}

// ============================================================================
// Room Transformations
// ============================================================================

export function xmppRoomToRest(xmppRoom: XMPPRoom): OpenFireRoom {
  const { local } = parseJid(xmppRoom.jid);

  return {
    roomName: local,
    naturalName: xmppRoom.info.identity.name,
    description: xmppRoom.info.x?.description,
    subject: xmppRoom.info.x?.subject,
    persistent: xmppRoom.info.x?.['muc#roomconfig_persistentroom'],
    publicRoom: xmppRoom.info.x?.['muc#roomconfig_publicroom'],
    membersOnly: xmppRoom.info.x?.['muc#roomconfig_membersonly'],
    moderated: xmppRoom.info.x?.['muc#roomconfig_moderatedroom'],
    maxUsers: xmppRoom.info.x?.['muc#roomconfig_maxusers'],
    members: xmppRoom.info.x?.['muc#roomconfig_members'],
    admins: xmppRoom.info.x?.['muc#roomconfig_admins'],
  };
}

export function restRoomToXmpp(restRoom: OpenFireRoom, conferenceDomain: string): XMPPRoom {
  const jid = buildJid(restRoom.roomName, conferenceDomain);

  return {
    jid,
    info: {
      identity: {
        category: 'conference',
        type: 'text',
        name: restRoom.naturalName,
      },
      features: ['http://jabber.org/protocol/muc'],
      x: {
        description: restRoom.description,
        subject: restRoom.subject,
        'muc#roomconfig_roomname': restRoom.naturalName,
        'muc#roomconfig_roomdesc': restRoom.description,
        'muc#roomconfig_persistentroom': restRoom.persistent,
        'muc#roomconfig_publicroom': restRoom.publicRoom,
        'muc#roomconfig_membersonly': restRoom.membersOnly,
        'muc#roomconfig_moderatedroom': restRoom.moderated,
        'muc#roomconfig_maxusers': restRoom.maxUsers,
        'muc#roomconfig_members': restRoom.members,
        'muc#roomconfig_admins': restRoom.admins,
      },
    },
  };
}

// ============================================================================
// Group Transformations
// ============================================================================

/**
 * Extract OpenFire groups from XMPP roster groups
 * Creates groups with members based on roster group membership
 */
export function rosterGroupsToRestGroups(users: XMPPUser[]): OpenFireGroup[] {
  const groupMap = new Map<string, Set<string>>();

  // Aggregate group membership
  for (const user of users) {
    const username = parseJid(user.bare_jid).local;
    for (const group of user.groups) {
      if (!groupMap.has(group)) {
        groupMap.set(group, new Set());
      }
      groupMap.get(group)!.add(username);
    }
  }

  // Convert to OpenFireGroup[]
  return Array.from(groupMap.entries()).map(([name, memberSet]) => ({
    name,
    description: `Roster group: ${name}`,
    members: Array.from(memberSet),
    admins: [], // Roster groups don't have admins
  }));
}
```

**Test Coverage:**

```typescript
// packages/backend-mock/src/rest/__tests__/transformers.test.ts

import { describe, test, expect } from 'vitest';
import { xmppUserToRest, restUserToXmpp } from '../transformers';
import { MOCK_USERS, MOCK_DOMAIN } from '../../fixtures';

describe('User Transformers', () => {
  test('xmppUserToRest extracts username from JID', () => {
    const xmppUser = MOCK_USERS[0]; // commander.red@wargame.local
    const restUser = xmppUserToRest(xmppUser);

    expect(restUser.username).toBe('commander.red');
    expect(restUser.name).toBe(xmppUser.vcard?.fn);
    expect(restUser.properties?.sharedGroups).toEqual(xmppUser.groups);
  });

  test('restUserToXmpp builds correct JID', () => {
    const restUser = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      properties: { sharedGroups: ['TestGroup'] },
    };

    const xmppUser = restUserToXmpp(restUser, MOCK_DOMAIN);

    expect(xmppUser.bare_jid).toBe('testuser@wargame.local');
    expect(xmppUser.groups).toEqual(['TestGroup']);
    expect(xmppUser.subscription).toBe('both');
  });

  test('round-trip preserves core fields', () => {
    const original = MOCK_USERS[0];
    const rest = xmppUserToRest(original);
    const roundTrip = restUserToXmpp(rest, MOCK_DOMAIN);

    expect(roundTrip.bare_jid).toBe(original.bare_jid);
    expect(roundTrip.groups).toEqual(original.groups);
  });
});
```

---

## Summary of Decisions

| Topic                 | Decision                                   | Key Benefit                               |
| --------------------- | ------------------------------------------ | ----------------------------------------- |
| **Entity Mapping**    | Canonical XMPP + transformers              | Single source of truth, protocol fidelity |
| **Storage Namespace** | Shared with env override                   | Unified state, test isolation             |
| **Seeding**           | Master seeder, sequential protocol seeding | Dependency ordering, idempotency          |
| **Type Safety**       | Explicit typed transformers                | Compile-time checks, evolution support    |

---

## Migration Path

1. **Create Transformer Module**: `packages/backend-mock/src/rest/transformers.ts`
2. **Update `seed-rest.ts`**: Replace manual seeding with `seedRestFromXmpp()`
3. **Modify `seed.ts`**: Make `seedAll()` call both XMPP and REST seeders
4. **Add Tests**: `transformers.test.ts` for round-trip validation
5. **Update Environment**: Add `VITE_STORAGE_NAMESPACE` to `.env` files
6. **Documentation**: Update CLAUDE.md with unified fixture workflow

---

## Open Questions

1. **Performance**: Is transformation overhead acceptable? (~5 users × 6 rooms = 30 transformations)
   - **Answer**: Negligible. One-time cost during seeding. Could cache if needed.

2. **Admin-Only Entities**: What if admin creates entity via REST that has no XMPP equivalent?
   - **Answer**: Reverse transform (REST → XMPP) stores in XMPP representation. Chat UI sees it immediately.

3. **Namespace Migration**: How to handle users with data in old namespace?
   - **Answer**: Provide migration utility: `migrateNamespace(oldNs, newNs)` copies all keys.

4. **Protocol Drift**: What if OpenFire REST API diverges from XMPP significantly?
   - **Answer**: Transformers become more complex, but single canonical fixture (XMPP) prevents data duplication.

---

## References

- **Existing Types**: `packages/backend-interface/src/types.ts` (XMPP)
- **REST Types**: `packages/backend-mock/src/rest/openfire-api.ts`
- **Current Seeding**: `packages/backend-mock/src/seed.ts`
- **Storage Abstraction**: `packages/backend-mock/src/storage.ts`
- **JID Utilities**: `packages/backend-mock/src/helpers.ts`
