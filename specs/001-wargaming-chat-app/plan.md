# Implementation Plan: War-Rooms-Y Multi-Room Wargaming Chat Application

**Branch**: `001-wargaming-chat-app` | **Date**: 2025-10-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-wargaming-chat-app/spec.md`

## Summary

XMPP-first multi-room wargaming chat application leveraging native XMPP protocol for all core functionality. The ultra-thin React/TypeScript client uses OpenFire's XMPP features directly for messaging, presence, and room management, with PubSub nodes for extended metadata. A protocol-compliant mock backend simulates exact XMPP behavior using localForage, enabling standalone demo/training mode. This architecture keeps the client minimal while OpenFire handles all heavy lifting for authentication, authorization, and real-time communication.

**Development Approach**: Mock-first development recommended (see [mock-development-guide.md](mock-development-guide.md)) to enable immediate UI development without server dependencies. The mock backend's faithful XMPP simulation ensures seamless transition to real OpenFire.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js ≥20
**Primary Dependencies**: React 18, Material UI v5, OpenFire XMPP server (production), localForage (demo mode), flexlayout-react, React-Admin, RJSF
**Storage**: OpenFire internal database (production) or browser storage via localForage (demo/training mode)
**Testing**: Jest (unit), Playwright (e2e), Storybook v9 + Chromatic (visual)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge); Static HTML for demo mode
**Project Type**: Web application with separate admin interface, compilable to static HTML
**Performance Goals**: < 2s message delivery, 100-200 concurrent users per room, < 200ms UI response
**Constraints**: Air-gapped capable, no external runtime dependencies, TypeScript-only, must support serverless demo mode
**Scale/Scope**: 100-1000 concurrent users (production), ~20-50 rooms, permanent message retention; Demo mode supports smaller scale for training

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ I. Code Quality First

- TypeScript enforces type safety and self-documenting interfaces
- ESLint + Prettier for consistent formatting
- Modular architecture with shared libraries (xmpp, state, openfire-rest)
- Maximum complexity managed through functional components and pure state containers

### ✅ II. Test-Driven Development (NON-NEGOTIABLE)

- Jest for unit tests of helpers and reducers
- Playwright for e2e multi-client flows
- Storybook for component isolation and testing
- MSW for mocking in tests
- Target: 80% code coverage

### ✅ III. User Experience Consistency

- flexlayout-react for consistent room layout
- React-Admin for uniform admin interface
- RJSF for standardized form rendering
- < 200ms UI response time requirement
- Loading states and error feedback for all actions

### ✅ IV. Performance by Design

- Message delivery < 2 seconds (p95)
- UI interactions < 200ms (p95)
- Support for 100-200 users per room
- Efficient XMPP connection management
- PubSub for metadata updates (reduces polling)

### ✅ V. Security in Depth

- OpenFire handles authentication and authorization
- Input validation via RJSF schemas
- Secure WebSocket connections (WSS)
- Role-based access control via XMPP MUC
- Admin operations via authenticated REST API

### ✅ VI. Observability and Debugging

- Structured logging in all components
- XMPP stanza logging for debugging
- React DevTools integration
- Storybook for component inspection
- Health checks via OpenFire monitoring

## Project Structure

### Documentation (this feature)

```
specs/001-wargaming-chat-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
packages/
├── backend-interface/   # XMPP protocol interface
│   ├── src/
│   │   ├── types.ts    # XMPP stanza types (XEP-compliant)
│   │   ├── xmpp.ts     # Core XMPP operations interface
│   │   ├── pubsub.ts   # PubSub operations interface
│   │   └── index.ts
│   └── tests/
│
├── backend-openfire/    # Real XMPP via Stanza.js
│   ├── src/
│   │   ├── client.ts   # Stanza.js wrapper
│   │   ├── muc.ts      # MUC protocol implementation
│   │   ├── pubsub.ts   # PubSub implementation
│   │   └── index.ts    # XMPPBackend implementation
│   └── tests/
│
├── backend-mock/        # XMPP protocol simulator
│   ├── src/
│   │   ├── storage.ts  # localForage for XMPP data
│   │   ├── stanzas.ts  # XMPP stanza generation
│   │   ├── muc.ts      # MUC protocol simulation
│   │   ├── pubsub.ts   # PubSub simulation
│   │   └── index.ts    # XMPPBackend implementation
│   └── tests/
│
├── state/               # Pure TypeScript state containers
│   ├── src/
│   │   ├── rooms.ts
│   │   ├── messages.ts
│   │   ├── presence.ts
│   │   └── types.ts
│   └── tests/
│
├── chat-ui/             # Main chat application
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   └── pages/
│   ├── tests/
│   ├── e2e/
│   └── static/         # Static HTML build output
│
└── admin-ui/            # React-Admin interface
    ├── src/
    │   ├── resources/
    │   │   ├── overview/  # Game summary (single record)
    │   │   ├── forces/    # OpenFire Groups + PubSub metadata
    │   │   ├── rooms/     # MUC rooms + PubSub metadata
    │   │   └── templates/ # Form templates (placeholder)
    │   ├── providers/
    │   │   ├── dataProvider.ts    # REST API + PubSub integration
    │   │   └── authProvider.ts    # OpenFire auth
    │   └── forms/      # RJSF form builder
    ├── tests/
    └── static/         # Static HTML build output

.storybook/              # Storybook configuration
.github/workflows/       # CI/CD pipelines
playwright.config.ts     # E2E test configuration
```

**Structure Decision**: Monorepo with XMPP-protocol-focused packages. The `backend-interface` defines standard XMPP operations that both `backend-openfire` (using Stanza.js) and `backend-mock` (simulating XMPP) must implement exactly. The mock backend must generate identical XMPP stanzas and events to ensure the thin client never knows the difference. State management simply reflects XMPP protocol state (roster, MUC occupancy, MAM history) with PubSub extensions composed only at the UI layer.

## Deployment Architecture

### Separate Application Strategy

Chat UI and Admin UI are deployed as **independent applications** with separate entry points:

**Chat UI (`/`)**:
- Entry point: `packages/chat-ui/src/main.tsx`
- Accessible to all authenticated users
- Authentication: XMPP login via OpenFire
- Static build output: `packages/chat-ui/static/`
- Bundle optimized for chat functionality only

**Admin UI (`/admin`)**:
- Entry point: `packages/admin-ui/src/main.tsx`
- Accessible only to users in 'admins' OpenFire group
- Authentication: XMPP login + 'admins' group membership verification
- Static build output: `packages/admin-ui/static/`
- Bundle includes React-Admin and admin-specific resources

### Authentication Flows

**Chat UI Login**:
1. User provides credentials at `/` login page
2. XMPP authentication via backend (OpenFire or mock)
3. On success, user accesses chat interface
4. Admin users see "Admin Panel" navigation button

**Admin UI Login**:
1. User provides credentials at `/admin` login page
2. XMPP authentication via backend
3. Backend verifies user is member of 'admins' group
4. Non-admin users: Error message + redirect to `/`
5. Admin users: Access granted to React-Admin interface
6. "Chat Interface" navigation button available

### Cross-Navigation

Admin users can seamlessly switch interfaces:
- Chat UI → Admin UI: Click "Admin Panel" button
- Admin UI → Chat UI: Click "Chat Interface" button
- Both interfaces maintain separate authentication state
- Opens in new tab to preserve both contexts

### Build & Deployment

**Development Mode**:
```bash
npm run dev --workspace=packages/chat-ui    # Start chat UI at :5173
npm run dev --workspace=packages/admin-ui   # Start admin UI at :5174
```

**Production Builds**:
```bash
npm run build --workspace=packages/chat-ui    # → packages/chat-ui/static/
npm run build --workspace=packages/admin-ui   # → packages/admin-ui/static/
```

**Static Deployment** (air-gapped):
- Deploy `chat-ui/static/` to web server root
- Deploy `admin-ui/static/` to `/admin` path
- Both bundles include mock backend for demo mode
- No server required - runs entirely in browser

**Production Deployment** (with OpenFire):
- Same static file deployment
- Configure both apps to connect to OpenFire server
- Backend selection via environment/config
- Shared OpenFire instance for both applications

### Security Benefits

- **Code Separation**: Regular users never download admin UI code
- **Smaller Bundles**: Each app optimized for its specific purpose
- **Attack Surface**: Admin functionality not exposed in chat bundle
- **Clear Authorization**: Explicit admin group check at login
- **Audit Trail**: Separate entry points simplify access logging

## Complexity Tracking

_No violations - architecture aligns with all constitution principles._
