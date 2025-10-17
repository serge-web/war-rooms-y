# Implementation Plan: War-Rooms-Y Multi-Room Wargaming Chat Application

**Branch**: `001-wargaming-chat-app` | **Date**: 2025-10-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-wargaming-chat-app/spec.md`

## Summary

Multi-room wargaming chat application with real-time XMPP-based messaging, administrative controls via REST API, structured form submissions, and game metadata management. The system uses OpenFire as the sole backend with React/TypeScript frontends for both chat and administration interfaces.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js ≥20
**Primary Dependencies**: React 18, OpenFire XMPP server, flexlayout-react, React-Admin, RJSF
**Storage**: OpenFire internal database (persistent message history via MAM)
**Testing**: Jest (unit), Playwright (e2e), Storybook v9 + Chromatic (visual)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application with separate admin interface
**Performance Goals**: < 2s message delivery, 100-200 concurrent users per room, < 200ms UI response
**Constraints**: Air-gapped capable, no external runtime dependencies, TypeScript-only
**Scale/Scope**: 100-1000 concurrent users, ~20-50 rooms, permanent message retention

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

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
├── xmpp/                # XMPP connection and protocol library
│   ├── src/
│   │   ├── connection.ts
│   │   ├── muc.ts       # Multi-User Chat helpers
│   │   ├── pubsub.ts    # PubSub node management
│   │   └── types.ts
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
├── openfire-rest/       # Typed REST client for OpenFire
│   ├── src/
│   │   ├── client.ts
│   │   ├── users.ts
│   │   ├── groups.ts
│   │   ├── rooms.ts
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
│   └── e2e/
│
└── admin-ui/            # React-Admin interface
    ├── src/
    │   ├── resources/
    │   ├── providers/
    │   └── forms/      # RJSF form builder
    └── tests/

.storybook/              # Storybook configuration
.github/workflows/       # CI/CD pipelines
playwright.config.ts     # E2E test configuration
```

**Structure Decision**: Monorepo with shared packages to ensure type safety across frontend/admin UIs and promote code reuse. The three shared libraries (xmpp, state, openfire-rest) are consumed by both UIs.

## Complexity Tracking

*No violations - architecture aligns with all constitution principles.*