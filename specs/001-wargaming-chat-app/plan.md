# Implementation Plan: Unified Mock Data Layer

**Branch**: `001-wargaming-chat-app` | **Date**: 2025-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: "Please consider how we just use one set of mock data in the chat and admin UIs. This will enable a user to design a wargame, and then view it, When we eventually connect to OpenFire the separate XMPP and REST APIs will be referring to the same underlaying data."

## Summary

The current architecture has **two separate mock data systems** that are out of sync:
- **XMPP Mock** (fixtures.ts): Used by chat-ui with XMPP protocol simulation
- **REST Mock** (seed-rest.ts): Used by admin-ui with OpenFire REST API simulation

This creates data inconsistency - changes in admin-ui don't reflect in chat-ui and vice versa. The plan unifies these into a **single shared storage layer** that both UIs read/write through their respective protocol adapters, mirroring the production architecture where OpenFire exposes both XMPP and REST interfaces to the same database.

## Technical Context

**Language/Version**: TypeScript 5.3.0 (strict mode)
**Primary Dependencies**: React 18.3, Jotai 2.15, Zustand 5.0, React-Admin 5.x, Material-UI 6.x, Vite 5.x
**Storage**: localStorage via Storage abstraction (backend-mock/src/storage.ts), shared namespace across UIs
**Testing**: Jest 29.7 (unit), Playwright 1.40 (E2E), Storybook 8.6 (component)
**Target Platform**: Modern browsers (ES2020+), standalone static HTML deployment
**Project Type**: Monorepo web application (npm workspaces) - 2 separate UIs sharing mock backend
**Performance Goals**: <2s message delivery (p95), <200ms UI interactions, support 100 concurrent users
**Constraints**: Offline-capable, air-gapped deployments, zero external dependencies in demo mode
**Scale/Scope**: 5 packages, ~15k LOC, 50 participants per wargame, permanent message retention

**Current Issue**: Two separate mock data layers create data silos:
- **packages/backend-mock/src/fixtures.ts**: XMPP entities (XMPPUser, XMPPRoom, XMPPMessage) seeded via seed.ts
- **packages/backend-mock/src/rest/seed-rest.ts**: OpenFire REST entities (OpenFireUser, OpenFireGroup, OpenFireRoom) seeded separately
- **admin-ui** uses namespace `war-rooms-admin`, **chat-ui** uses default namespace → isolated storage

**Required Unification**:
- Single canonical storage namespace shared by both UIs
- Single fixture set that seeds both XMPP and REST representations
- Bidirectional sync: admin changes → visible in chat, chat activity → visible in admin
- Maintain protocol separation: MockXMPP vs MockOpenFireAPI adapters over shared Storage

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **I. Code Quality First** | ✅ PASS | Refactoring existing mock backend, no new complexity. DRY principle directly addressed by eliminating duplicate fixture data. |
| **II. Test-Driven Development** | ✅ PASS | TDD required for storage namespace migration and fixture consolidation. Existing E2E tests will verify cross-UI data sync. |
| **III. UX Consistency** | ✅ PASS | Unification improves UX - admin changes immediately visible in chat UI. No UI interaction patterns changed. |
| **IV. Performance by Design** | ✅ PASS | Single storage namespace reduces memory footprint. Shared fixtures eliminate duplicate data loading. Performance budgets unchanged. |
| **V. Security in Depth** | ✅ PASS | No security boundary changes. Both UIs already use same Storage abstraction with same validation. |
| **VI. Observability** | ✅ PASS | Storage operations already logged. New unified seeding will have clear logging for both XMPP and REST entity creation. |

**Quality Gates**:
- All existing unit and E2E tests must pass
- New tests for cross-UI data synchronization required
- No decrease in code coverage (currently ~10%, targeting 80% for new code)
- Type safety maintained across XMPP ↔ REST entity mappings

**Decision**: ✅ Proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
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
├── backend-interface/          # Protocol type definitions
│   └── src/
│       ├── xmpp.ts            # XMPPUser, XMPPRoom, XMPPMessage
│       └── rest.ts            # OpenFireUser, OpenFireGroup, OpenFireRoom (NEW)
│
├── backend-mock/               # 🎯 PRIMARY CHANGE AREA
│   └── src/
│       ├── storage.ts          # Storage abstraction (namespace config)
│       ├── fixtures.ts         # 🔥 UNIFIED fixtures (XMPP + REST entities)
│       ├── seed.ts             # 🔥 UNIFIED seeding (both protocols)
│       ├── mock-xmpp.ts        # XMPP protocol adapter
│       ├── mock-pubsub.ts      # PubSub protocol adapter
│       ├── rest/
│       │   ├── openfire-api.ts     # REST API adapter
│       │   ├── pubsub-metadata.ts  # REST metadata API
│       │   └── seed-rest.ts        # 🗑️  DEPRECATED - merge into seed.ts
│       └── index.ts            # Export unified seeding function
│
├── chat-ui/                    # Chat interface
│   └── src/
│       ├── main.tsx            # 🔧 Use shared namespace
│       └── App.tsx
│
└── admin-ui/                   # Admin interface
    └── src/
        ├── main.tsx            # 🔧 Use shared namespace
        └── providers/
            ├── authProvider.ts
            └── dataProvider.ts

e2e/
└── cross-ui-sync.spec.ts       # 🆕 NEW - test admin→chat data flow
```

**Structure Decision**: Monorepo web application (Option 2 variant). Two separate UIs (`chat-ui`, `admin-ui`) share a unified mock backend (`backend-mock`). Changes concentrated in `backend-mock` package to consolidate fixtures and seeding, plus minor configuration updates in both UIs to use shared storage namespace.

## Complexity Tracking

_No violations detected - all constitution principles satisfied._

---

## Phase 0: Research Summary

**Completed**: research.md (952 lines)

**Key Decisions**:

1. **Entity Mapping**: Canonical XMPP format with bidirectional transformers
   - XMPP fixtures are source of truth
   - REST representations derived via `rest/transformers.ts`
   - Type-safe conversions with round-trip validation

2. **Storage Namespace**: Shared `war-rooms` namespace
   - Both UIs use `VITE_STORAGE_NAMESPACE` env var
   - Protocol prefixes prevent key collisions (`roster/`, `rest:user:`, etc.)
   - Instant cross-UI data visibility

3. **Seeding Coordination**: Master seeder with sequential protocol seeding
   - Order: Users → Groups → Forces → Rooms → Messages
   - `seedAll()` calls XMPP seeders, then transforms to REST
   - Idempotent seeding (can re-run safely)

4. **Type Safety**: Explicit typed transformers
   - `xmppUserToRest()`, `restUserToXmpp()` with full type inference
   - Round-trip tests ensure lossless transformations
   - Runtime validation optional (can add for debugging)

---

## Phase 1: Design Artifacts

### Generated Files

1. ✅ **data-model.md** (existing, 19KB) - XMPP-native entity definitions
2. ✅ **contracts/transformers.ts** - Entity transformation contracts
3. ✅ **contracts/storage-api.ts** - Unified storage interface contracts
4. ✅ **contracts/seeding-api.ts** - Seeding workflow contracts
5. ✅ **quickstart.md** - Integration scenarios and examples

### Architecture Summary

```
┌────────────────────────────────────────┐
│     Canonical XMPP Fixtures            │
│   (packages/backend-mock/fixtures.ts)  │
└───────────────┬────────────────────────┘
                │
    ┌───────────┴──────────┐
    ▼                      ▼
┌──────────┐         ┌─────────────┐
│  XMPP    │         │ Transformers│
│ Seeders  │         │   (NEW)     │
└────┬─────┘         └──────┬──────┘
     │                      │
     │    ┌─────────────────┘
     ▼    ▼
┌────────────────────────────┐
│  Shared localStorage       │
│  Namespace: "war-rooms"    │
│                            │
│  roster/* ← XMPP users     │
│  rooms/*  ← XMPP rooms     │
│  rest:user:* ← REST users  │
│  rest:room:* ← REST rooms  │
└───────┬────────────┬───────┘
        │            │
        ▼            ▼
   ┌─────────┐  ┌──────────┐
   │Chat UI  │  │ Admin UI │
   │ (XMPP)  │  │  (REST)  │
   └─────────┘  └──────────┘
```

### Key Implementation Files

**New Files**:
- `packages/backend-mock/src/rest/transformers.ts` - Entity transformations
- `packages/backend-mock/src/rest/transformers.test.ts` - Round-trip tests

**Modified Files**:
- `packages/backend-mock/src/seed.ts` - Add `seedRestFromXmpp()` call
- `packages/backend-mock/src/storage.ts` - Add namespace config documentation
- `packages/chat-ui/src/main.tsx` - Use shared namespace
- `packages/admin-ui/src/main.tsx` - Use shared namespace
- `.env` - Add `VITE_STORAGE_NAMESPACE=war-rooms`

**Deprecated Files**:
- `packages/backend-mock/src/rest/seed-rest.ts` - Functionality merged into `seed.ts`

---

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality First** | ✅ PASS | New transformers module is focused, well-documented. DRY achieved by eliminating duplicate fixtures. Complexity reduced (1 fixture source vs 2). |
| **II. Test-Driven Development** | ✅ PASS | Transformer tests required before implementation. Round-trip tests ensure correctness. E2E tests validate cross-UI sync. |
| **III. UX Consistency** | ✅ PASS | Unified data improves UX - admin changes instantly visible in chat. No UI changes required, pure backend refactoring. |
| **IV. Performance by Design** | ✅ PASS | Transformation overhead: <1ms per entity. Single namespace reduces storage footprint. No performance regressions. |
| **V. Security in Depth** | ✅ PASS | No security boundary changes. Shared storage already has same validation. Key prefixes prevent accidental cross-protocol access. |
| **VI. Observability** | ✅ PASS | Seeding logs both XMPP and REST entity creation. Validation functions detect inconsistencies. Debug utilities added for storage inspection. |

**Quality Gates Met**:
- ✅ Type safety maintained (transformers fully typed)
- ✅ Test coverage plan defined (unit, integration, E2E)
- ✅ No breaking changes to existing APIs
- ✅ Migration path documented
- ✅ Performance budget maintained

**Final Decision**: ✅ **APPROVED FOR IMPLEMENTATION**

---

## Next Phase

**Phase 2**: Generate tasks.md via `/speckit.tasks`

After Phase 2 planning completes, implementation can begin via `/speckit.implement` or manual task execution.

---

## Implementation Checklist

Before proceeding to Phase 2 (task generation):

- [x] Technical context filled with current architecture
- [x] Constitution gates evaluated (all passed)
- [x] Research completed (entity mapping, storage, seeding, type safety)
- [x] Data model documented (existing from earlier phase)
- [x] Contracts defined (transformers, storage API, seeding API)
- [x] Integration scenarios documented (quickstart.md)
- [x] Agent context updated with tech stack
- [x] Post-design constitution re-check (all passed)

**Status**: ✅ Ready for Phase 2 - Task Generation

---

## Summary

**Problem**: Two separate mock data systems (XMPP fixtures for chat, REST fixtures for admin) create data silos where changes in one UI don't appear in the other.

**Solution**: Unified data layer with:
- Single canonical XMPP fixture source
- Bidirectional transformers for REST representations
- Shared localStorage namespace (`war-rooms`)
- Protocol-specific key prefixes prevent collisions
- Master seeding function initializes both representations

**Impact**:
- Admin creates user → Chat UI sees user instantly
- Admin creates room → Chat UI can join room
- Chat sends message → Admin UI sees count update
- Simulates production architecture (OpenFire serves both XMPP and REST)

**Next**: Run `/speckit.tasks` to generate dependency-ordered implementation tasks.
