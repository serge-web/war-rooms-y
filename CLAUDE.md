# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

War Rooms Y is a multi-room wargaming chat application with XMPP protocol support, built as a TypeScript monorepo. It features real-time messaging, force-based room access control, and schema-driven message forms.

## Development Commands

### Quick Start

```bash
npm install                          # Install all dependencies
npm run dev                          # Start dev server (localhost:5173)
# Access chat at http://localhost:5173/ (login: commander.red / any)
# Access admin at http://localhost:5173/admin (login: gamemaster / admin123)
```

### Build & Test Commands

```bash
# Build (sequential due to dependencies)
npm run build                        # Builds in order: backend-interface → backend-mock → state → chat-ui

# Testing
npm test                             # Run Jest unit tests
npm run test:watch                   # Jest watch mode
npm run test:coverage                # Generate coverage report
npm run test:e2e                     # Run Playwright E2E tests
npm run test:e2e -- --ui             # Playwright UI mode (debugging)
npm run test:e2e -- --headed         # Show browser during tests

# Code Quality
npm run lint                         # ESLint
npm run lint:fix                     # Fix linting issues
npm run format                       # Format with Prettier
npm run format:check                 # Check formatting
npm run typecheck                    # TypeScript type checking

# Storybook
npm run storybook                    # Start Storybook (port 6006)
npm run build-storybook              # Build static Storybook
```

### Working with Specific Packages

```bash
npm run dev --workspace=packages/chat-ui    # Run specific package
npm run build --workspace=packages/state    # Build specific package
npm test packages/state                     # Test specific package
```

## Architecture

### Package Structure & Dependencies

The monorepo uses npm workspaces with a strict dependency hierarchy:

```
packages/backend-interface (Protocol Types)
    ↓
packages/backend-mock (Mock Implementation)
    ↓
packages/state (State Management)
    ↓
packages/chat-ui (React Frontend - Single App with Two UIs)
    ├── /src/          → Chat UI (route: /)
    └── /src/admin/    → Admin UI (route: /admin)
```

**Key Packages:**

- **backend-interface**: XMPP protocol type definitions (XMPPUser, XMPPRoom, XMPPMessage)
- **backend-mock**: Mock XMPP backend using localStorage, pre-seeded with fixtures
- **state**: Jotai atoms for messages, Zustand store for rooms/presence
- **chat-ui**: Single React app running on port 5173 with two routes:
  - `/` - Chat UI with Material UI and flexlayout-react for resizable panes
  - `/admin` - Admin UI using React-Admin for managing users, forces, rooms, and templates

### Mock Backend System

The application uses a sophisticated mock backend (`packages/backend-mock`) that:

- Simulates XMPP protocol operations in-browser
- Uses localStorage for persistence (MemoryStorage fallback)
- Pre-seeded with realistic wargaming data (users, forces, rooms, messages)
- Configured via environment variables (VITE_BACKEND_MODE, VITE_MOCK_DOMAIN, etc.)
- **Unified Data Layer**: Chat UI (XMPP, route `/`) and Admin UI (REST, route `/admin`) run in the same app and share the same storage namespace

Key files:

- `packages/backend-mock/src/fixtures.ts` - Mock data (users, rooms, forces, messages)
- `packages/backend-mock/src/mock-xmpp.ts` - XMPP protocol simulation
- `packages/backend-mock/src/storage.ts` - Storage abstraction with unified namespace
- `packages/backend-mock/src/adapters/*` - Protocol adapters (XMPP, REST, PubSub) that project unified data
- `packages/backend-mock/src/seed.ts` - Unified seeding using new adapter-based architecture

#### Unified Data Layer Architecture (NEW - Adapter Pattern)

**Single Source of Truth**: Unified entities stored under `entities/*` keys:

**Unified Keys**:
- `entities/users/{username}` → UnifiedUser records
- `entities/users/_index` → Array of usernames (index)
- `entities/forces/{forceId}` → UnifiedForce records
- `entities/forces/_index` → Array of force IDs (index)
- `entities/rooms/{roomId}` → UnifiedRoom records
- `entities/rooms/_index` → Array of room IDs (index)
- `entities/templates/{templateId}` → UnifiedFormTemplate records
- `entities/templates/_index` → Array of template IDs (index)

**Protocol Adapters** (project unified data to protocol-specific formats):
- **XMPPAdapter** - Chat UI reads via XMPP-formatted views
- **RESTAdapter** - Admin UI reads via OpenFire REST-formatted views
- **PubSubAdapter** - Both UIs access metadata via PubSub

**Transient Data** (not projected, session-specific):
- `rooms/{roomJid}/occupants/*` → Real-time room occupants
- `archive/rooms/{roomJid}/*` → Message history
- `presence/self` → Current user presence
- `session` → Current XMPP session info

This enables:
- ✅ Admin creates user at `/admin` → Chat UI at `/` sees user instantly
- ✅ Admin creates room → Chat UI can join room
- ✅ Chat sends message → Admin UI sees count update
- ✅ Both UIs in same Vite app, single deployment, shared storage

### Room Access Control

Rooms have force-based restrictions defined in `RoomExtension.forceRestrictions`:

- Users belong to forces (e.g., 'force-red', 'force-blue')
- Rooms can restrict access to specific forces
- Room types: 'all-hands' (public), 'command', 'standard', 'private'

### State Management Pattern

**Jotai (Atoms)** for message state:

- `messagesAtomFamily` - Per-room message storage
- `messageBackendAtom` - Backend reference
- Async actions for loading archived messages

**Zustand** for room/presence state:

- `RoomsStore` - Rooms, occupants, join/leave operations
- Selectors for derived state

## Critical Workflow Rules

### **IMPORTANT: Local Validation Before Declaring Work Complete**

**YOU MUST run the full CI test suite locally BEFORE declaring any task complete or committing code.**

Required commands to run locally (in order):

1. `npm run build` - Build all packages
2. `npm run lint` - Run ESLint
3. `npm run format:check` - Check Prettier formatting
4. `npm run typecheck` - Type check all packages
5. `npm run test` - Run unit tests
6. `npm run test:e2e` - Run E2E tests (if applicable)

**If formatting issues found, run `npm run format` to fix them before committing.**

**Never discover errors in CI that you should have caught locally.** If CI fails, you failed to validate properly.

## Speckit Workflow

This is a **Speckit** repository - a specification-driven development workflow. All workflow commands are namespaced under `/speckit.`:

### Core Commands

- `/speckit.specify <feature-description>` - Create feature spec from natural language
- `/speckit.plan` - Generate implementation plan with tech stack
- `/speckit.tasks` - Generate dependency-ordered task list
- `/speckit.implement` - Execute all tasks from tasks.md
- `/speckit.clarify` - Identify underspecified areas
- `/speckit.analyze` - Cross-artifact consistency analysis
- `/speckit.checklist` - Generate custom checklist
- `/speckit.constitution` - Create or update project constitution

### Speckit Files

```
specs/<feature-id>/
├── spec.md         # User requirements (technology-agnostic)
├── plan.md         # Implementation approach
├── tasks.md        # Actionable tasks with dependencies
├── research.md     # Technical decisions
├── data-model.md   # Entities and relationships
├── quickstart.md   # Integration scenarios
└── contracts/      # API specifications
```

## Testing Strategy

### Unit Tests (Jest)

- Focus: Business logic, state management, utilities
- Location: `packages/**/src/__tests__/*.test.ts`
- Run single: `npm test -- path/to/test.ts`

### E2E Tests (Playwright)

- Focus: User workflows, critical paths
- Location: `e2e/*.spec.ts`
- Fixtures: Uses mock backend with pre-seeded data
- Debug: Use `--ui` flag for interactive debugging

### Component Stories (Storybook)

- Focus: Visual documentation, component variations
- Location: `packages/**/*.stories.tsx`
- Purpose: Component development and future Chromatic integration

## Environment Configuration

The chat-ui uses Vite environment variables to configure the backend:

```bash
VITE_BACKEND_MODE=mock              # 'mock' or 'openfire'
VITE_MOCK_DOMAIN=wargame.local
VITE_MOCK_CONFERENCE=conference.wargame.local
VITE_MOCK_PUBSUB=pubsub.wargame.local
VITE_MOCK_PERSISTENCE=localStorage  # or 'memory'
VITE_MOCK_LATENCY=100               # Simulated network delay
```

## Current Implementation Status

**Completed:**

- Mock XMPP backend with localStorage persistence
- Multi-room chat UI with flexlayout-react (route `/`)
- Admin UI with React-Admin (route `/admin`) - manages users, forces, rooms, templates
- Unified data layer with adapter pattern (entities/* keys)
- Force-based room access control
- Jotai/Zustand state management
- CI/CD pipeline with GitHub Actions
- PR preview deployments to GitHub Pages

**Not Yet Implemented:**

- Real Openfire backend integration (`packages/backend-openfire`)
- Form submissions with RJSF in chat UI
- PubSub metadata publishing from chat UI
- Full test coverage (currently ~10%)

## Common Tasks

### Adding a New Room

Edit `packages/backend-mock/src/fixtures.ts`:

```typescript
{
  jid: buildJid('room-name', MOCK_CONFERENCE),
  info: { identity: { name: 'Display Name' }, ... },
  extension: {
    type: 'standard', // or 'all-hands', 'command', 'private'
    forceRestrictions: ['force-red'], // optional
    ...
  }
}
```

### Modifying Mock Users

Edit `packages/backend-mock/src/fixtures.ts` MOCK_USERS and MOCK_FORCES arrays.

### Debugging State Issues

1. Check Redux DevTools for Zustand store
2. Use React DevTools to inspect Jotai atoms
3. Check localStorage: `localStorage.getItem('war-rooms:messages:room-jid')`

## Deployment

### PR Previews

Automated deployment to GitHub Pages on PR creation/update:

- URL: `https://{owner}.github.io/{repo}/pr-{number}/`
- Uses mock backend with pre-configured data
- Bot comments on PR with preview URL

### Production

Not yet configured. Will require Openfire server setup.
