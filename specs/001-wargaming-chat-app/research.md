# Research: War-Rooms-Y Technical Decisions

**Date**: 2025-10-17
**Feature**: Multi-Room Wargaming Chat Application

## Technology Decisions

### 1. XMPP Client Library

**Decision**: Stanza.js (https://github.com/legastero/stanza)
**Rationale**:
- JSON-native API (no XML parsing required)
- TypeScript-first with excellent type definitions
- Modern async/await patterns
- Built-in support for all required XEPs (MAM, MUC, PubSub, Stream Management)
- Simpler developer experience than @xmpp/client
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

## Deferred Decisions

1. **Offline message sync**: Full offline-first architecture deferred to Phase 2
2. **End-to-end encryption**: Not required for air-gapped trusted network
3. **Mobile apps**: Web-first, React Native can reuse libraries later
4. **Federation**: Single OpenFire instance sufficient for initial deployment

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| OpenFire downtime | Stream Management for resumption, client-side queue |
| Network latency | Optimistic UI updates, local message echo |
| Large room performance | Disable presence, paginated MAM |
| Browser compatibility | Target modern browsers only (Chrome 90+, Firefox 88+, Safari 14+) |
| TypeScript complexity | Strict mode, comprehensive types for all APIs |

## Next Steps

1. Create data model from specification entities
2. Design REST API contracts for admin operations
3. Define PubSub node structure for metadata
4. Create quickstart guide for OpenFire setup