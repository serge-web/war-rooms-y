# Quickstart: Unified Mock Data Layer Integration

**Feature**: War-Rooms-Y Wargaming Chat Application
**Date**: 2025-10-20
**Audience**: Developers integrating unified mock data

## Overview

This guide shows how the unified mock data layer enables seamless data sharing between the chat UI (route `/`) and admin UI (route `/admin`). Both UIs run in the same app on port 5173. **Changes in admin UI immediately appear in chat UI** and vice versa.

---

## Before: Separate Data Silos

```typescript
// ❌ OLD: Multiple packages with separate namespaces

// packages/chat-ui/src/main.tsx
const chatStorage = createStorage({
  backend: 'localStorage',
  namespace: 'war-rooms', // Default namespace
});

// packages/admin-ui/src/providers/dataProvider.ts (OLD - DELETED)
const adminStorage = createStorage({
  backend: 'localStorage',
  namespace: 'war-rooms-admin', // Different namespace!
});

// Result: admin creates user → chat UI doesn't see it
```

---

## After: Unified Data Layer

```typescript
// ✅ NEW: Single app with both UIs sharing same namespace

// packages/chat-ui/src/main.tsx (single entry point)
const storage = createStorage({
  backend: 'localStorage',
  namespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
});

// packages/chat-ui/src/App.tsx (routes both UIs)
<BrowserRouter>
  <Routes>
    <Route path="/" element={<ChatApp />} />        {/* Chat UI */}
    <Route path="/admin/*" element={<AdminApp />} /> {/* Admin UI */}
  </Routes>
</BrowserRouter>

// Result: Both UIs in same app, same namespace → instant sync
```

---

## Integration Scenarios

### Scenario 1: Admin Creates User

**Admin UI Flow** (route: `/admin`):

```typescript
// packages/chat-ui/src/admin/resources/forces/index.tsx
import { Create, SimpleForm, TextInput } from 'react-admin';

export const ForceCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="description" />
      <ArrayInput source="members">
        <SimpleFormIterator>
          <TextInput source="" label="Username" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Create>
);

// When admin submits form at /admin:
// 1. dataProvider.create('forces', { name: 'Red Force', ... })
// 2. RESTAdapter writes to entities/forces/Red Force
// 3. XMPPAdapter reads unified data for chat UI at /
// 4. Single source of truth in shared storage
```

**Chat UI Result**:

```typescript
// packages/chat-ui/src/components/RosterPanel.tsx
import { useRoster } from '../hooks/useRoster';

export const RosterPanel = () => {
  const roster = useRoster();  // Reads from roster/* keys

  // ✅ New user appears immediately in roster list
  return (
    <List>
      {roster.map(user => (
        <ListItem key={user.bare_jid}>
          {user.name}  {/* Shows "New User" */}
        </ListItem>
      ))}
    </List>
  );
};
```

---

### Scenario 2: Admin Creates Room

**Admin UI Flow** (route: `/admin`):

```typescript
// packages/chat-ui/src/admin/resources/rooms/index.tsx
import { Create, SimpleForm, TextInput, SelectInput } from 'react-admin';

export const RoomCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="roomName" />
      <TextInput source="naturalName" />
      <SelectInput source="forceRestrictions" choices={[
        { id: 'Red Force', name: 'Red Force' },
        { id: 'Blue Force', name: 'Blue Force' },
      ]} />
    </SimpleForm>
  </Create>
);

// When admin creates room at /admin:
// 1. dataProvider.create('rooms', { roomName: 'ops-center', ... })
// 2. RESTAdapter writes to entities/rooms/ops-center
// 3. XMPPAdapter projects to XMPP format for chat UI at /
// 4. Room appears in both routes instantly
```

**Chat UI Result**:

```typescript
// packages/chat-ui/src/components/RoomList.tsx
import { useRoomsStore } from '@war-rooms/state';

export const RoomList = () => {
  const rooms = useRoomsStore(state => state.rooms);

  // ✅ New room appears in available rooms list
  return (
    <List>
      {rooms.map(room => (
        <ListItem key={room.jid} onClick={() => joinRoom(room.jid)}>
          {room.info.identity.name}  {/* Shows "Operations Center" */}
        </ListItem>
      ))}
    </List>
  );
};
```

---

### Scenario 3: Chat User Sends Message

**Chat UI Flow**:

```typescript
// packages/chat-ui/src/components/MessageInput.tsx
import { sendMessage } from '../services/xmpp';

const handleSend = async (body: string) => {
  const message = {
    id: generateMessageId(),
    from: 'commander.red@wargame.local',
    to: 'all-hands@conference.wargame.local',
    body,
    timestamp: new Date().toISOString(),
  };

  // Writes to messages/all-hands@conference/msg-123
  await sendMessage(message);
};
```

**Admin UI Result** (route: `/admin`):

```typescript
// packages/chat-ui/src/admin/resources/rooms/index.tsx
import { Show, SimpleShowLayout, TextField, FunctionField } from 'react-admin';

export const RoomShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="roomName" />
      <FunctionField
        label="Message Count"
        render={(record) => {
          // Reads archive/rooms/${roomJid}/* from shared storage
          const count = getMessageCount(record.roomName);
          return count;  // ✅ Shows updated count from chat UI at /
        }}
      />
    </SimpleShowLayout>
  </Show>
);
```

---

### Scenario 4: Admin Updates Force Metadata

**Admin UI Flow** (route: `/admin`):

```typescript
// packages/chat-ui/src/admin/resources/forces/index.tsx
import { Edit, SimpleForm, TextInput } from 'react-admin';

export const ForceEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="description" />
      <TextInput source="metadata.color" type="color" />
      <TextInput source="metadata.icon" />
    </SimpleForm>
  </Edit>
);

// When admin updates force at /admin:
// 1. dataProvider.update('forces', { metadata: { color: '#FF0000' }, ... })
// 2. RESTAdapter writes to entities/forces/Red Force
// 3. PubSubAdapter projects metadata for both UIs
// 4. Chat UI at / sees color update instantly
```

**Chat UI Result**:

```typescript
// packages/chat-ui/src/components/ForceIndicator.tsx
import { useForceMetadata } from '../hooks/useForceMetadata';

export const ForceIndicator = ({ forceId }) => {
  const force = useForceMetadata(forceId);  // Reads from PubSub

  // ✅ Color updates immediately
  return (
    <Chip
      label={force.name}
      style={{ backgroundColor: force.color }}  // New color
      icon={<Avatar src={force.icon} />}        // New icon
    />
  );
};
```

---

## Configuration

### Environment Variables

Both UIs need same namespace configuration:

```bash
# .env (project root)
VITE_STORAGE_NAMESPACE=war-rooms

# .env.test (for isolated tests)
VITE_STORAGE_NAMESPACE=test-war-rooms-${DATE_NOW}
```

### Single App Setup (Both UIs)

```typescript
// packages/chat-ui/src/main.tsx (single entry point for both UIs)
import { createStorage, seedTestWargame } from '@war-rooms/backend-mock';

const storage = createStorage({
  backend: 'localStorage',
  namespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
});

// Seed unified fixtures on first load (using adapter pattern)
const keys = await storage.keys();
if (keys.length === 0) {
  await seedTestWargame(storage);
}

// App renders both Chat UI (/) and Admin UI (/admin) via react-router
// Both UIs share same storage instance, same namespace
```

---

## Data Flow Diagrams

### User Creation Flow

```
┌─────────────┐
│  Admin UI   │
│  (React-    │
│   Admin)    │
└──────┬──────┘
       │ create({ username: 'newuser', name: 'New User' })
       ▼
┌─────────────────┐
│ MockOpenFireAPI │
└──────┬──────────┘
       │ createUser()
       ▼
┌──────────────────────┐
│  REST → XMPP         │
│  Transformer         │
└──────┬───────────────┘
       │
       ├─→ rest:user:newuser (OpenFireUser)
       │
       └─→ roster/newuser@wargame.local (XMPPUser)

       Both written to shared localStorage namespace

┌─────────────┐
│  Chat UI    │
│  (XMPP)     │
└──────┬──────┘
       │ useRoster() reads roster/* keys
       ▼
   ✅ New user appears in roster
```

### Room Creation Flow

```
┌─────────────┐
│  Admin UI   │
└──────┬──────┘
       │ create({ roomName: 'ops', naturalName: 'Ops Center' })
       ▼
┌─────────────────┐
│ MockOpenFireAPI │
└──────┬──────────┘
       │ createRoom()
       ▼
┌──────────────────────┐
│  REST → XMPP         │
│  Transformer         │
└──────┬───────────────┘
       │
       ├─→ rest:room:ops (OpenFireRoom)
       │
       └─→ rooms/ops@conference.wargame.local (XMPPRoom)

┌─────────────┐
│  Chat UI    │
└──────┬──────┘
       │ useRoomsStore() reads rooms/* keys
       ▼
   ✅ New room appears in available rooms
```

---

## Testing Integration

### Unit Test: Transformer Round-Trip

```typescript
// packages/backend-mock/src/rest/__tests__/transformers.test.ts
import { xmppUserToRest, restUserToXmpp } from '../transformers';
import { MOCK_USERS, MOCK_DOMAIN } from '../../fixtures';

test('user round-trip preserves data', () => {
  const original = MOCK_USERS[0];
  const rest = xmppUserToRest(original);
  const roundTrip = restUserToXmpp(rest, MOCK_DOMAIN);

  expect(roundTrip.bare_jid).toBe(original.bare_jid);
  expect(roundTrip.name).toBe(original.name);
  expect(roundTrip.groups).toEqual(original.groups);
});
```

### Integration Test: Cross-UI Data Flow

```typescript
// packages/backend-mock/src/__tests__/unified-seeding.test.ts
import { createStorage } from '../storage';
import { seedAll } from '../seed';
import { MockOpenFireAPI } from '../rest/openfire-api';

test('admin creates user → appears in XMPP', async () => {
  const storage = createStorage({ backend: 'memory', namespace: 'test' });
  await seedAll(storage);

  const api = new MockOpenFireAPI(storage);

  // Admin creates user via REST API
  await api.createUser({
    username: 'testuser',
    name: 'Test User',
    properties: { sharedGroups: ['TestGroup'] },
  });

  // Verify XMPP representation exists
  const xmppUser = await storage.getItem('roster/testuser@wargame.local');
  expect(xmppUser).toBeDefined();
  expect(xmppUser.name).toBe('Test User');
  expect(xmppUser.groups).toContain('TestGroup');
});
```

### E2E Test: Admin → Chat Data Sync

```typescript
// e2e/cross-ui-sync.spec.ts
import { test, expect } from '@playwright/test';

test('admin creates user → chat sees user in roster', async ({ page, context }) => {
  // Open admin UI in first tab
  const adminPage = await context.newPage();
  await adminPage.goto('/admin');
  await adminPage.fill('[name="username"]', 'admin');
  await adminPage.fill('[name="password"]', 'admin');
  await adminPage.click('button[type="submit"]');

  // Create new user
  await adminPage.click('a[href="#/users"]');
  await adminPage.click('a[href="#/users/create"]');
  await adminPage.fill('[name="username"]', 'e2euser');
  await adminPage.fill('[name="name"]', 'E2E Test User');
  await adminPage.click('button[type="submit"]');

  // Open chat UI in second tab (shares same localStorage)
  await page.goto('/');
  await page.fill('[name="username"]', 'commander.red');
  await page.fill('[name="password"]', 'any');
  await page.click('button[type="submit"]');

  // Verify new user appears in roster
  await expect(page.locator('text=E2E Test User')).toBeVisible();
});
```

---

## Migration Guide

### Step 1: Update Dependencies

```bash
# Ensure all packages use latest backend-mock
npm install
npm run build
```

### Step 2: Update Environment Configuration

```bash
# Add to .env
echo "VITE_STORAGE_NAMESPACE=war-rooms" >> .env

# Add to .env.test
echo "VITE_STORAGE_NAMESPACE=test-war-rooms" >> .env.test
```

### Step 3: Update Chat UI

```typescript
// packages/chat-ui/src/main.tsx

import { createStorage, seedAll, DEFAULT_SEED_OPTIONS } from '@war-rooms/backend-mock';

const storage = createStorage({
  backend: 'localStorage',
  namespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
});

// Seed unified fixtures
if ((await storage.keys()).length === 0) {
  await seedAll(storage, DEFAULT_SEED_OPTIONS);
}
```

### Step 4: Update Admin UI

```typescript
// packages/admin-ui/src/main.tsx

import { createStorage, seedAll, DEFAULT_SEED_OPTIONS } from '@war-rooms/backend-mock';

const storage = createStorage({
  backend: 'localStorage',
  namespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
});

// Seed unified fixtures
if ((await storage.keys()).length === 0) {
  await seedAll(storage, DEFAULT_SEED_OPTIONS);
}
```

### Step 5: Migrate Existing Data (Optional)

```typescript
// One-time migration script
import { migrateNamespace } from '@war-rooms/backend-mock';

// Migrate old admin data to new shared namespace
await migrateNamespace('war-rooms-admin', 'war-rooms', 'localStorage');

// Verify migration
const storage = createStorage({ backend: 'localStorage', namespace: 'war-rooms' });
const keys = await storage.keys();
console.log('Migrated keys:', keys.length);
```

### Step 6: Verify Integration

```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Start the application (single app on port 5173)
npm run dev

# Access:
# - Chat UI: http://localhost:5173/
# - Admin UI: http://localhost:5173/admin

# Verify:
# 1. Create user in admin → appears in chat roster
# 2. Create room in admin → appears in chat room list
# 3. Send message in chat → count updates in admin
```

---

## Troubleshooting

### Issue: Admin Changes Not Visible in Chat

**Symptom**: Create user in admin UI, doesn't appear in chat UI roster

**Diagnosis**:

```typescript
// Check namespaces match
const chatStorage = createStorage({ backend: 'localStorage', namespace: 'war-rooms' });
const adminStorage = createStorage({ backend: 'localStorage', namespace: 'war-rooms-admin' });

console.log(await chatStorage.keys()); // Check chat keys
console.log(await adminStorage.keys()); // Check admin keys
```

**Solution**: Ensure both UIs use same `VITE_STORAGE_NAMESPACE`

---

### Issue: Transformer Errors

**Symptom**: `Error: Cannot parse JID from undefined`

**Diagnosis**:

```typescript
// Check transformer inputs
const restUser = await storage.getItem('rest:user:testuser');
console.log('REST user:', restUser);

// Verify transformer can handle it
const xmppUser = restUserToXmpp(restUser, 'wargame.local');
console.log('XMPP user:', xmppUser);
```

**Solution**: Ensure REST entities have required fields before transformation

---

### Issue: Seeding Not Happening

**Symptom**: UIs show no data after first load

**Diagnosis**:

```typescript
const storage = createStorage({ backend: 'localStorage', namespace: 'war-rooms' });
const keys = await storage.keys();

if (keys.length === 0) {
  console.log('No data found - seeding required');
  await seedAll(storage, DEFAULT_SEED_OPTIONS);
}
```

**Solution**: Ensure seeding logic runs on first load (check browser console for errors)

---

## Performance Considerations

### Transformation Overhead

- **Volume**: ~5 users, 6 rooms, 3 forces = ~15 transformations per seed
- **Cost**: <1ms per transformation
- **Impact**: Negligible (one-time on seed)

### Storage Access Patterns

- **Reads**: O(1) via key lookup (localStorage.getItem)
- **Writes**: O(1) via key set (localStorage.setItem)
- **Scans**: O(n) for indexes (used rarely)

### Memory Footprint

- **XMPP entities**: ~10KB
- **REST entities**: ~8KB
- **Messages**: ~50KB (500 messages)
- **Total**: <100KB (well within localStorage limits)

---

## Next Steps

After unified data layer is working:

1. **Add real-time sync**: Broadcast storage events across tabs
2. **Implement optimistic updates**: Update UI before backend confirms
3. **Add conflict resolution**: Handle concurrent edits
4. **Enable partial sync**: Sync only changed entities
5. **Add change history**: Track all modifications for audit

---

## References

- **Research**: [research.md](./research.md) - Technical decisions
- **Data Model**: [data-model.md](./data-model.md) - Entity schemas
- **Contracts**: [contracts/](./contracts/) - TypeScript interfaces
- **Storage API**: [contracts/storage-api.ts](./contracts/storage-api.ts)
- **Seeding API**: [contracts/seeding-api.ts](./contracts/seeding-api.ts)
- **Transformers**: [contracts/transformers.ts](./contracts/transformers.ts)
