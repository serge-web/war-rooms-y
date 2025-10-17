# Mock-First Development Guide

**Created**: 2025-10-17
**Purpose**: Quick setup for UI development using mock XMPP backend (no OpenFire required)

## Overview

Start developing immediately with the mock backend that simulates XMPP protocol in the browser. Perfect for:
- UI development without server dependencies
- Quick prototyping and testing
- Demo/training scenarios
- Development when OpenFire is unavailable

## Quick Start (5 minutes)

### 1. Project Setup

```bash
# Clone and install
git clone <repo>
cd war-rooms-y
npm install

# Install workspace dependencies
npm run bootstrap
```

### 2. Configure for Mock Backend

Create `.env.local`:
```env
VITE_BACKEND_MODE=mock
VITE_MOCK_PERSISTENCE=localStorage
VITE_MOCK_DEBUG=true
VITE_MOCK_LATENCY=100  # Simulate network delay (ms)
```

### 3. Initialize Mock Data

Create `src/mock-data/initial-data.ts`:
```typescript
import { MockData } from '@war-rooms/backend-mock';

export const initialMockData: MockData = {
  // Initial roster (users)
  roster: [
    {
      jid: 'admin@wargame.local',
      bare_jid: 'admin@wargame.local',
      name: 'Game Admin',
      subscription: 'both',
      groups: ['admins'],
      vcard: {
        fn: 'Game Administrator',
        email: 'admin@wargame.local',
        title: 'System Admin'
      }
    },
    {
      jid: 'blue-commander@wargame.local',
      bare_jid: 'blue-commander@wargame.local',
      name: 'Blue Force Commander',
      subscription: 'both',
      groups: ['blue-force', 'commanders'],
      vcard: {
        fn: 'Colonel Smith',
        title: 'Blue Force Commander'
      }
    },
    {
      jid: 'red-commander@wargame.local',
      bare_jid: 'red-commander@wargame.local',
      name: 'Red Force Commander',
      subscription: 'both',
      groups: ['red-force', 'commanders'],
      vcard: {
        fn: 'Colonel Jones',
        title: 'Red Force Commander'
      }
    }
  ],

  // Initial rooms (MUCs)
  rooms: [
    {
      jid: 'all-hands@conference.wargame.local',
      info: {
        identity: {
          category: 'conference',
          type: 'text',
          name: 'All Hands'
        },
        features: ['muc_persistent', 'muc_open', 'muc_unmoderated'],
        x: {
          'muc#roomconfig_roomname': 'All Hands',
          'muc#roomconfig_roomdesc': 'Server-wide announcements',
          'muc#roomconfig_persistentroom': true,
          'muc#roomconfig_publicroom': true,
          'muc#roomconfig_maxusers': 200,
          'muc#roomconfig_membersonly': false
        }
      },
      occupants: []
    },
    {
      jid: 'blue-command@conference.wargame.local',
      info: {
        identity: {
          category: 'conference',
          type: 'text',
          name: 'Blue Command'
        },
        features: ['muc_persistent', 'muc_membersonly', 'muc_moderated'],
        x: {
          'muc#roomconfig_roomname': 'Blue Command',
          'muc#roomconfig_roomdesc': 'Blue force command channel',
          'muc#roomconfig_persistentroom': true,
          'muc#roomconfig_publicroom': false,
          'muc#roomconfig_maxusers': 50,
          'muc#roomconfig_membersonly': true,
          'muc#roomconfig_members': ['blue-commander@wargame.local']
        }
      },
      occupants: []
    },
    {
      jid: 'red-command@conference.wargame.local',
      info: {
        identity: {
          category: 'conference',
          type: 'text',
          name: 'Red Command'
        },
        features: ['muc_persistent', 'muc_membersonly', 'muc_moderated'],
        x: {
          'muc#roomconfig_roomname': 'Red Command',
          'muc#roomconfig_roomdesc': 'Red force command channel',
          'muc#roomconfig_persistentroom': true,
          'muc#roomconfig_publicroom': false,
          'muc#roomconfig_maxusers': 50,
          'muc#roomconfig_membersonly': true,
          'muc#roomconfig_members': ['red-commander@wargame.local']
        }
      },
      occupants: []
    }
  ],

  // Initial messages (MAM history)
  messages: [
    {
      id: 'msg-001',
      from: 'all-hands@conference.wargame.local/Admin',
      to: 'all-hands@conference.wargame.local',
      type: 'groupchat',
      body: 'Welcome to the wargame. Please join your designated rooms.',
      delay: {
        stamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    }
  ],

  // PubSub nodes with initial data
  pubsubNodes: new Map([
    ['/war-rooms/game/metadata', {
      title: 'Operation Thunder Strike',
      description: 'Joint forces training exercise',
      scenario: 'Multi-domain operations in contested environment',
      logoUrl: '/assets/logo.png'
    }],
    ['/war-rooms/game/state', {
      status: 'setup',
      currentTurn: 0,
      currentPhase: 'initialization',
      lastUpdate: {
        timestamp: new Date().toISOString(),
        changedBy: 'admin@wargame.local',
        description: 'Game initialized'
      }
    }],
    ['/war-rooms/game/theme', {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Roboto, sans-serif'
    }],
    ['/war-rooms/forces/blue', {
      id: 'blue',
      name: 'Blue Force',
      color: '#1976d2',
      commander: 'blue-commander@wargame.local',
      memberCount: 0,
      status: 'active'
    }],
    ['/war-rooms/forces/red', {
      id: 'red',
      name: 'Red Force',
      color: '#dc004e',
      commander: 'red-commander@wargame.local',
      memberCount: 0,
      status: 'active'
    }]
  ])
};
```

### 4. Start Development

```bash
# Start the dev server
npm run dev

# In another terminal, run Storybook for component development
npm run storybook
```

### 5. Login to Mock Backend

```typescript
// In your app initialization
import { MockXMPPBackend } from '@war-rooms/backend-mock';
import { initialMockData } from './mock-data/initial-data';

const backend = new MockXMPPBackend({
  persistence: 'localStorage',
  debugMode: true,
  initialData: initialMockData
});

// Connect with any credentials (mock accepts all)
await backend.connect('testuser@wargame.local', 'anypassword');

// You're now "connected" to the mock XMPP server!
```

## Development Workflow

### 1. UI Component Development

Develop components in isolation with Storybook:

```typescript
// Button.stories.tsx
export default {
  title: 'Chat/MessageInput',
  component: MessageInput,
};

export const Default = {
  args: {
    onSend: (message) => console.log('Sent:', message),
    disabled: false,
  },
};

export const Composing = {
  args: {
    ...Default.args,
    showComposing: true,
    composingUsers: ['Alice', 'Bob'],
  },
};
```

### 2. Testing XMPP Operations

```typescript
// Mock backend generates real XMPP events
backend.on('message', (stanza) => {
  console.log('Received XMPP message:', stanza);
  // Stanza structure identical to real OpenFire
});

// Send a message
backend.sendMessage({
  id: 'msg-123',
  to: 'blue-command@conference.wargame.local',
  type: 'groupchat',
  body: 'Test message from mock backend'
});

// Join a room
await backend.joinRoom('blue-command@conference.wargame.local', 'TestUser');

// Subscribe to PubSub
await backend.subscribe('/war-rooms/game/state');
backend.on('pubsub:event', (node, data) => {
  console.log('PubSub update:', node, data);
});
```

### 3. Simulating Real-Time Events

```typescript
// Simulate another user joining
backend.simulatePresence({
  from: 'alice@wargame.local',
  show: 'chat',
  status: 'Ready for ops'
});

// Simulate incoming message
backend.simulateMessage({
  from: 'blue-command@conference.wargame.local/Alice',
  type: 'groupchat',
  body: 'Blue team ready for mission'
});

// Simulate PubSub update
backend.simulatePubSubEvent('/war-rooms/game/state', {
  status: 'running',
  currentTurn: 1
});
```

### 4. Multi-Tab Testing

Mock backend syncs across browser tabs:

```typescript
// Tab 1: Send message
backend.sendMessage({...});

// Tab 2: Automatically receives via BroadcastChannel
backend.on('message', (stanza) => {
  // Same message appears here!
});
```

### 5. State Inspection

Use browser DevTools:

```javascript
// In console, inspect mock XMPP state
const state = await backend.debug.getState();
console.table(state.roster);
console.table(state.rooms);
console.table(state.messages);

// Clear all data
await backend.debug.reset();

// Load specific scenario
await backend.debug.loadScenario('battle-in-progress');
```

## Testing Scenarios

### Scenario 1: Basic Chat

```typescript
// test/scenarios/basic-chat.ts
export async function setupBasicChat(backend: MockXMPPBackend) {
  // Create users
  const users = ['alice', 'bob', 'charlie'].map(name => ({
    jid: `${name}@wargame.local`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    groups: ['participants']
  }));

  // Add to roster
  for (const user of users) {
    await backend.addToRoster(user);
  }

  // Simulate conversation
  await backend.simulateMessage({
    from: 'alice@wargame.local',
    to: 'all-hands@conference.wargame.local',
    type: 'groupchat',
    body: 'Anyone ready for the mission briefing?'
  });

  await new Promise(r => setTimeout(r, 1000));

  await backend.simulateMessage({
    from: 'bob@wargame.local',
    to: 'all-hands@conference.wargame.local',
    type: 'groupchat',
    body: 'Standing by for briefing'
  });
}
```

### Scenario 2: Form Submission

```typescript
export async function setupFormSubmission(backend: MockXMPPBackend) {
  // Publish form schema to PubSub
  await backend.publish('/war-rooms/forms/schemas', {
    id: 'sitrep-form',
    name: 'Situation Report',
    jsonSchema: {
      type: 'object',
      properties: {
        location: { type: 'string' },
        status: { enum: ['green', 'yellow', 'red'] },
        details: { type: 'string' }
      }
    }
  });

  // Simulate form message
  await backend.simulateMessage({
    from: 'blue-command@conference.wargame.local/Commander',
    type: 'groupchat',
    body: 'SITREP Submitted',
    x: {
      formData: {
        schemaId: 'sitrep-form',
        data: {
          location: 'Grid 123456',
          status: 'green',
          details: 'All units operational'
        }
      }
    }
  });
}
```

## Switching to Real OpenFire

When ready to test with real OpenFire:

1. **Update environment**:
```env
VITE_BACKEND_MODE=openfire
VITE_OPENFIRE_WS=wss://remote-openfire.com:7443/ws
VITE_OPENFIRE_DOMAIN=wargame.local
```

2. **No code changes needed** - the same UI code works with both backends!

## Common Development Tasks

### Add New User to Mock

```typescript
await backend.addToRoster({
  jid: 'newuser@wargame.local',
  name: 'New User',
  groups: ['blue-force']
});
```

### Create New Room

```typescript
await backend.createRoom({
  jid: 'planning@conference.wargame.local',
  name: 'Planning Room',
  description: 'Mission planning',
  maxUsers: 20,
  membersOnly: true
});
```

### Simulate Network Issues

```typescript
// Add latency to all operations
backend.setLatency(2000); // 2 second delay

// Simulate disconnect
backend.simulateDisconnect();

// Simulate reconnect
backend.simulateReconnect();
```

### Export/Import State

```typescript
// Export current state
const state = await backend.exportState();
localStorage.setItem('saved-scenario', JSON.stringify(state));

// Import saved state
const saved = JSON.parse(localStorage.getItem('saved-scenario'));
await backend.importState(saved);
```

## Debugging Tips

### 1. Enable Debug Logging

```typescript
backend.enableDebug(true);
// Now all XMPP operations logged to console
```

### 2. XMPP Inspector

```typescript
// Add Chrome extension: XMPP Inspector
backend.on('stanza:sent', (stanza) => {
  window.postMessage({ type: 'xmpp:out', stanza }, '*');
});

backend.on('stanza:received', (stanza) => {
  window.postMessage({ type: 'xmpp:in', stanza }, '*');
});
```

### 3. State Validation

```typescript
// Validate mock state matches XMPP spec
const validation = await backend.validateState();
if (!validation.valid) {
  console.error('Invalid state:', validation.errors);
}
```

## Best Practices

1. **Always test with mock first** - Faster iteration, no network dependencies
2. **Use TypeScript** - Mock backend has full type definitions for XMPP
3. **Test multi-user scenarios** - Open multiple browser tabs
4. **Save test scenarios** - Export states for regression testing
5. **Validate against real XMPP** - Periodically test with remote OpenFire

## Troubleshooting

### Mock data not persisting
- Check localStorage isn't full
- Verify `VITE_MOCK_PERSISTENCE=localStorage`
- Try IndexedDB: `VITE_MOCK_PERSISTENCE=indexedDB`

### Events not firing
- Ensure you're subscribed: `backend.on('message', handler)`
- Check event name matches XMPP spec
- Enable debug mode to see all events

### Cross-tab sync not working
- BroadcastChannel needs same origin
- Use HTTPS in development: `npm run dev -- --https`
- Check browser supports BroadcastChannel API

## Next Steps

1. Build UI components with Storybook
2. Implement chat rooms with mock backend
3. Add PubSub metadata features
4. Test with remote OpenFire when ready
5. Package as static HTML for demos

## Resources

- [XMPP Protocol Specs](https://xmpp.org/rfcs/)
- [Stanza.js Documentation](https://github.com/legastero/stanza)
- [LocalForage API](https://localforage.github.io/localForage/)
- Mock backend source: `packages/backend-mock/`