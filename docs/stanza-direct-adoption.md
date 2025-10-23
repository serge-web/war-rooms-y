# Stanza.js Type Adoption - Refactoring Plan

## Executive Summary

This document provides a comprehensive refactoring plan to directly adopt Stanza.js TypeScript types throughout the War Rooms Y codebase, replacing our custom XMPP type definitions.

## Current vs Stanza Type Mappings

### Message Types

| Current Type (types.ts)                                            | Stanza Type           | Refactoring Notes    |
| ------------------------------------------------------------------ | --------------------- | -------------------- |
| `XMPPMessage`                                                      | `Message`             | Import from 'stanza' |
| `id: string`                                                       | `id?: string`         | Make optional        |
| `from: string`                                                     | `from?: string`       | Make optional        |
| `to: string`                                                       | `to?: string`         | Make optional        |
| `type: 'groupchat' \| 'chat' \| 'error' \| 'headline' \| 'normal'` | `type?: MessageType`  | Use Stanza's enum    |
| `body?: string`                                                    | `body?: string`       | Same                 |
| `subject?: string`                                                 | `subject?: string`    | Same                 |
| `delay?: { stamp: string; from?: string }`                         | `delay?: Delay`       | Different structure  |
| `thread?: string`                                                  | `thread?: string`     | Same                 |
| `chatstate?: 'active' \| 'composing'...`                           | `chatState?: string`  | Field name change    |
| `mam?: { id: string; queryid?: string }`                           | `archive?: MAMResult` | Different structure  |

### Presence Types

| Current Type                 | Stanza Type           | Refactoring Notes       |
| ---------------------------- | --------------------- | ----------------------- |
| `XMPPPresence`               | `Presence`            | Import from 'stanza'    |
| `from: string`               | `from?: string`       | Make optional           |
| `type?: 'unavailable'...`    | `type?: PresenceType` | Use Stanza's enum       |
| `show?: 'away' \| 'chat'...` | `show?: PresenceShow` | Use Stanza's enum       |
| `status?: string`            | `status?: string`     | Same                    |
| `priority?: number`          | `priority?: number`   | Same                    |
| `caps?: { node, ver, hash }` | `caps?: LegacyCaps`   | Different structure     |
| `idle?: { since: string }`   | `idleSince?: Date`    | Date type, field rename |

### Roster Types

**⚠️ ROSTERS ARE NOT USED - REMOVE ENTIRELY**

Rosters were being misused to store group membership in the `groups` field. This is incorrect:

- **XMPP Rosters** = personal contact lists (like a friend list)
- **Roster Groups** = client-side organization labels ("Work", "Friends")

**Correct Approach**: Use OpenFire Groups directly:

- Admin UI already manages users/groups via REST API ✓
- Chat UI should query user's groups via:
  - Service discovery on user JID
  - Session info at login
  - PubSub node with user metadata

**Actions**:

- Remove all roster methods from `XMPPBackend` interface
- Remove `getRoster()`, `addRosterItem()`, `removeRosterItem()`, `updateRosterItem()`
- Remove `XMPPUser` type (was only used for roster)
- Replace with `getUserGroups(jid: string): Promise<string[]>`

### MUC Types

| Current Type              | Stanza Type                    | Refactoring Notes    |
| ------------------------- | ------------------------------ | -------------------- |
| `XMPPRoom`                | `DiscoInfo` + `MUCInfo`        | Combine types        |
| `XMPPOccupant`            | `MUCUserItem`                  | Import from 'stanza' |
| `nick: string`            | `nick?: string`                | Make optional        |
| `jid?: string`            | `jid?: JID`                    | Use JID type         |
| `affiliation: 'owner'...` | `affiliation?: MUCAffiliation` | Use enum, optional   |
| `role: 'moderator'...`    | `role?: MUCRole`               | Use enum, optional   |
| Room join                 | `MUCJoin`                      | New interface        |
| Room presence             | `MUCPresence`                  | Extends Presence     |

### PubSub Types

| Current Concept | Stanza Type          | Usage                     |
| --------------- | -------------------- | ------------------------- |
| PubSub item     | `PubsubItem<T>`      | Generic with content type |
| Subscription    | `PubsubSubscription` | State management          |
| Publishing      | `PubsubPublish`      | Publish operations        |
| Events          | `PubsubEvent`        | Event notifications       |
| Node config     | `PubsubConfigure`    | With DataForm             |

## Refactoring Steps by Package

### 1. Backend Interface (`packages/backend-interface`)

#### File: `src/types.ts`

```typescript
// DELETE all custom type definitions
// REPLACE with Stanza type re-exports

export type {
  // Core types
  Message,
  Presence,
  IQ,

  // MUC
  MUCJoin,
  MUCPresence,
  MUCUserItem,
  MUCAffiliation,
  MUCRole,
  MUCHistory,
  MUCInfo,

  // PubSub
  PubsubItem,
  PubsubItemContent,
  PubsubSubscription,
  PubsubPublish,
  PubsubEvent,
  PubsubEventItems,

  // MAM
  MAMQuery,
  MAMResult,

  // Service Discovery
  DiscoInfo,
  DiscoItem,

  // Other
  DataForm,
  StreamError,
  StanzaError,
  JID,
  Delay,
} from 'stanza';

// App-specific extensions
export interface GameMetadata extends PubsubItemContent {
  itemType: 'game-metadata';
  forceId?: string;
  turnNumber?: number;
  gameTime?: string;
}

// User info (no longer using roster)
export interface UserInfo {
  jid: string;
  displayName?: string;
  groups: string[]; // OpenFire groups from service discovery
}
```

#### File: `src/xmpp.ts`

```typescript
// DELETE XMPPBackend interface
// REPLACE with Stanza Agent

import { Agent, AgentConfig } from 'stanza';

export type XMPPBackend = Agent;
export type XMPPConfig = AgentConfig;

// Remove all method definitions - use Agent's methods directly
```

### 2. Backend Mock (`packages/backend-mock`)

#### File: `src/mock-xmpp.ts`

```typescript
// Implement Stanza's Agent interface
import { Agent, Message, Presence, IQ } from 'stanza';

export class MockAgent extends EventEmitter implements Agent {
  // Required Agent properties
  jid: string;
  config: AgentConfig;

  // Stanza method implementations
  sendMessage(msg: Message): string {
    // Store using Stanza structure
    const stored: Message = {
      id: msg.id || generateId(),
      from: this.jid,
      to: msg.to,
      type: msg.type || 'chat',
      body: msg.body,
      // ... other Stanza fields
    };

    localStorage.setItem(`message:${stored.id}`, JSON.stringify(stored));
    return stored.id!;
  }

  // ... implement other Agent methods
}
```

#### File: `src/fixtures.ts`

```typescript
import { Message, MUCUserItem } from 'stanza';
import type { UserInfo } from '@war-rooms-y/backend-interface/types';

// Update all fixtures to use Stanza types
export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    from: 'commander.red@wargame.local',
    to: 'situation-room@conference.wargame.local',
    type: 'groupchat',
    body: 'Blue forces detected moving north',
    delay: {
      timestamp: '2024-01-20T10:30:00Z',
      from: 'situation-room@conference.wargame.local',
    },
  },
  // ...
];

// User info with OpenFire groups (not roster)
export const MOCK_USERS: UserInfo[] = [
  {
    jid: 'commander.blue@wargame.local',
    displayName: 'Blue Commander',
    groups: ['force-blue', 'command'], // OpenFire groups
  },
  {
    jid: 'commander.red@wargame.local',
    displayName: 'Red Commander',
    groups: ['force-red', 'command'],
  },
  // ...
];
```

### 3. State Management (`packages/state`)

#### File: `src/messages.ts`

```typescript
import { Message } from 'stanza';
import { atom, useAtom } from 'jotai';

// Room messages using Stanza Message type
const messagesAtomFamily = atomFamily((roomJid: string) => atom<Message[]>([]));

export const useRoomMessages = (roomJid: string) => {
  const [messages] = useAtom(messagesAtomFamily(roomJid));

  // Access Stanza fields directly
  const sortedMessages = messages.sort((a, b) => {
    const aTime = a.delay?.timestamp || a.id || '';
    const bTime = b.delay?.timestamp || b.id || '';
    return aTime.localeCompare(bTime);
  });

  return sortedMessages;
};
```

#### File: `src/rooms.ts`

```typescript
import { DiscoInfo, MUCUserItem, MUCPresence } from 'stanza';
import { create } from 'zustand';

interface RoomsStore {
  // Room info from service discovery
  rooms: Map<string, DiscoInfo>;

  // Room occupants
  occupants: Map<string, MUCUserItem[]>;

  // User's presence in each room
  myPresence: Map<string, MUCPresence>;

  // Actions
  setRoomInfo: (jid: string, info: DiscoInfo) => void;
  updateOccupant: (roomJid: string, occupant: MUCUserItem) => void;
}
```

### 4. Chat UI Components (`packages/chat-ui`)

#### File: `src/components/MessageItem.tsx`

```typescript
import { Message } from 'stanza';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  // Access Stanza fields
  const sender = message.from?.split('/')[1] || 'Unknown';
  const time = message.delay?.timestamp
    ? new Date(message.delay.timestamp).toLocaleTimeString()
    : 'Now';

  return (
    <div className={isOwnMessage ? 'own-message' : 'other-message'}>
      <span className="sender">{sender}</span>
      <span className="body">{message.body}</span>
      <span className="time">{time}</span>
      {message.chatState === 'composing' && <span>typing...</span>}
    </div>
  );
}
```

#### File: `src/components/RoomOccupants.tsx`

```typescript
import { MUCUserItem } from 'stanza';

interface RoomOccupantsProps {
  occupants: MUCUserItem[];
}

export function RoomOccupants({ occupants }: RoomOccupantsProps) {
  return (
    <div className="occupant-list">
      {occupants.map(occupant => (
        <div key={occupant.nick}>
          <span className="nick">{occupant.nick}</span>
          <span className="role">{occupant.role}</span>
          <span className="affiliation">{occupant.affiliation}</span>
        </div>
      ))}
    </div>
  );
}
```

### 5. Admin UI Updates

#### File: `packages/chat-ui/src/admin/transformers.ts`

```typescript
import { MUCUserItem, PubsubItem } from 'stanza';
import type { UserInfo } from '@war-rooms-y/backend-interface/types';

// Transform UserInfo to React-Admin format
export function userInfoToAdmin(user: UserInfo): AdminUser {
  return {
    id: user.jid,
    username: user.jid.split('@')[0],
    displayName: user.displayName || '',
    groups: user.groups, // OpenFire groups
  };
}

// Transform admin form to UserInfo
export function adminToUserInfo(admin: AdminUser): UserInfo {
  return {
    jid: admin.id,
    displayName: admin.displayName,
    groups: admin.groups,
  };
}

export function forceMetadataToPubsub(force: Force): PubsubItem<ForceMetadata> {
  return {
    id: force.id,
    content: {
      itemType: 'force-metadata',
      name: force.name,
      color: force.color,
      icon: force.icon,
      objectives: force.objectives,
    },
  };
}
```

## Migration Checklist

### Phase 1: Setup

- [ ] Install Stanza: `npm install stanza`
- [ ] Install JID utilities: `npm install @xmpp/jid`
- [ ] Update TypeScript config to include Stanza types

### Phase 2: Type Updates

- [ ] Replace `packages/backend-interface/src/types.ts` with Stanza exports
- [ ] Update `packages/backend-interface/src/xmpp.ts` to use Agent
- [ ] Remove all custom XMPP type definitions

### Phase 3: Mock Backend

- [ ] Create MockAgent implementing Stanza's Agent interface
- [ ] Update fixtures to use Stanza types
- [ ] Update storage/retrieval to use Stanza structures
- [ ] Implement Stanza event patterns

### Phase 4: State Management

- [ ] Update Jotai atoms to use Stanza Message type
- [ ] Update Zustand stores to use Stanza MUC types
- [ ] Update selectors to work with Stanza fields

### Phase 5: Components

- [ ] Update all component props to Stanza types
- [ ] Update field access (e.g., `chatstate` → `chatState`)
- [ ] Update optional field handling
- [ ] Fix TypeScript errors from stricter types

### Phase 6: Testing

- [ ] Update test fixtures to Stanza format
- [ ] Create mock Stanza Agent for tests
- [ ] Update E2E tests for new field names

## Breaking Changes

1. **Field Renames**
   - `chatstate` → `chatState`
   - `idle.since` → `idleSince`
   - `mam` → `archive`

2. **Type Changes**
   - String timestamps → Date objects
   - `jid: string` → `jid: JID` in some contexts
   - Many required fields → optional

3. **Removed Concepts**
   - **XMPP Rosters** - entire concept removed
   - `getRoster()`, `addRosterItem()`, `removeRosterItem()`, `updateRosterItem()`
   - `XMPPUser` type (was only used for roster)
   - `bare_jid` field - use JID parsing utilities
   - `vcard` inline - fetch separately via IQ
   - `onRosterUpdate` event handler

4. **New Concepts**
   - `UserInfo` type with OpenFire groups (replaces roster-based groups)
   - `MUCJoin` for joining rooms
   - `PubsubItem<T>` generic for typed content
   - `DataForm` for configuration
   - Service discovery for group membership

## JID Handling

Since Stanza doesn't provide `bare_jid`, use utilities:

```typescript
import { JID } from '@xmpp/jid';

// Parse JID
const jid = JID.parse('user@domain/resource');
console.log(jid.bare); // user@domain
console.log(jid.local); // user
console.log(jid.domain); // domain
console.log(jid.resource); // resource

// Or simple string parsing
const bareJid = fullJid.split('/')[0];
```

## Benefits After Refactoring

1. **Type Safety**: Stanza's mature TypeScript types
2. **No Conversion**: Direct use of Stanza client
3. **Less Code**: ~40% reduction in type-related code
4. **Future Features**: Access to all Stanza capabilities
5. **Community**: Leverage Stanza ecosystem and updates

## Timeline

- **Week 1**: Install dependencies, update type definitions
- **Week 2**: Refactor mock backend
- **Week 3**: Update components and state
- **Week 4**: Testing and cleanup
