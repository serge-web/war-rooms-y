# Implementation Tasks: Unified Mock Data Layer

**Feature**: War-Rooms-Y Wargaming Chat Application
**Branch**: `001-wargaming-chat-app`
**Date**: 2025-10-20
**Context**: Unifying XMPP and REST mock data systems for cross-UI consistency

## Overview

This task list implements a **unified mock data layer** that enables chat-ui and admin-ui to share a single source of truth. Currently, the two UIs use separate mock data systems (XMPP fixtures vs REST fixtures) causing data silos.

**After Implementation**:

- ✅ Admin creates user → Chat UI sees user instantly
- ✅ Admin creates room → Chat UI can join room
- ✅ Chat sends message → Admin UI sees count update
- ✅ Simulates production architecture (OpenFire serves both XMPP and REST)

**Key Technical Approach**:

- XMPP fixtures remain canonical source (packages/backend-mock/src/fixtures.ts)
- New transformers module converts XMPP ↔ REST bidirectionally
- Both UIs share `war-rooms` localStorage namespace
- Protocol-specific key prefixes prevent collisions (`roster/`, `rest:user:`, etc.)

---

## Task Format

Every task follows this format:

```
- [ ] [TaskID] [P?] Description with file path
```

- **[P]**: Task can run in parallel with others in same phase
- **File path**: Exact location where work happens
- **No story labels**: This is foundational infrastructure, not user story work

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Transformers - TDD)
    ↓
Phase 3 (Unified Seeding)
    ↓
Phase 4 (UI Integration)
    ↓
Phase 5 (E2E Testing)
    ↓
Phase 6 (Cleanup)
```

**Parallel Opportunities**: 23 tasks marked [P] can execute concurrently within their phase

---

## Phase 1: Setup & Preparation

**Goal**: Configure project for unified data layer

- [x] T001 Add VITE_STORAGE_NAMESPACE to root .env file
- [x] T002 Add VITE_STORAGE_NAMESPACE to .env.test file for test isolation
- [x] T003 [P] Document namespace config in packages/backend-mock/src/storage.ts
- [x] T004 [P] Add REST entity types to packages/backend-interface/src/rest.ts (re-export from backend-mock)

**Validation**:

- Environment variables configured in both .env files
- Storage.ts has clear documentation on namespace usage
- REST types available for import

---

## Phase 2: Transformer Infrastructure (TDD)

**Goal**: Create type-safe bidirectional transformers for XMPP ↔ REST conversion

### Tests First (TDD per constitution)

- [ ] T005 [P] Write user transformer round-trip test in packages/backend-mock/src/rest/**tests**/transformers.test.ts
- [ ] T006 [P] Write room transformer round-trip test in packages/backend-mock/src/rest/**tests**/transformers.test.ts
- [ ] T007 [P] Write group/force transformer test in packages/backend-mock/src/rest/**tests**/transformers.test.ts
- [ ] T008 [P] Write JID parsing utility tests in packages/backend-mock/src/rest/**tests**/transformers.test.ts

### Implementation (After tests fail)

- [ ] T009 [P] Implement xmppUserToRest() in packages/backend-mock/src/rest/transformers.ts
- [ ] T010 [P] Implement restUserToXmpp() in packages/backend-mock/src/rest/transformers.ts
- [ ] T011 [P] Implement xmppRoomToRest() in packages/backend-mock/src/rest/transformers.ts
- [ ] T012 [P] Implement restRoomToXmpp() in packages/backend-mock/src/rest/transformers.ts
- [ ] T013 [P] Implement forceToRestGroup() in packages/backend-mock/src/rest/transformers.ts
- [ ] T014 [P] Implement deriveRestGroupsFromRoster() in packages/backend-mock/src/rest/transformers.ts
- [ ] T015 [P] Implement JID helper utilities (extractUsername, buildBareJid) in packages/backend-mock/src/rest/transformers.ts

**Validation**:

- ✅ All transformer tests pass (red → green)
- ✅ Round-trip transformations preserve core fields
- ✅ Type safety enforced at compile time
- ✅ No data loss in XMPP → REST → XMPP conversions

---

## Phase 3: Unified Seeding

**Goal**: Create master seeder that initializes both XMPP and REST representations

### Tests First

- [ ] T016 Write test for seedRestUsers() in packages/backend-mock/src/**tests**/seed.test.ts
- [ ] T017 Write test for seedRestGroups() in packages/backend-mock/src/**tests**/seed.test.ts
- [ ] T018 Write test for seedRestRooms() in packages/backend-mock/src/**tests**/seed.test.ts
- [ ] T019 Write integration test for seedAll() with rest: true in packages/backend-mock/src/**tests**/seed.test.ts

### Implementation

- [ ] T020 Implement seedRestUsers() function in packages/backend-mock/src/seed.ts
- [ ] T021 Implement seedRestGroups() function in packages/backend-mock/src/seed.ts
- [ ] T022 Implement seedRestRooms() function in packages/backend-mock/src/seed.ts
- [ ] T023 Implement seedRestFromXmpp() master function in packages/backend-mock/src/seed.ts
- [ ] T024 Update seedAll() to call seedRestFromXmpp() when options.rest is true in packages/backend-mock/src/seed.ts
- [ ] T025 Update DEFAULT_SEED_OPTIONS to include rest: true in packages/backend-mock/src/seed.ts
- [ ] T026 Export new seeding functions from packages/backend-mock/src/index.ts

**Validation**:

- ✅ Seeding creates both XMPP and REST representations
- ✅ Users seeded to roster/_ and rest:user:_ keys
- ✅ Rooms seeded to rooms/_ and rest:room:_ keys
- ✅ Groups/forces seeded with correct member lists
- ✅ All seed tests pass

---

## Phase 4: UI Integration

**Goal**: Update both UIs to use shared storage namespace

### Chat UI Updates

- [ ] T027 [P] Update storage creation to use VITE_STORAGE_NAMESPACE in packages/chat-ui/src/main.tsx
- [ ] T028 [P] Verify chat UI reads from roster/\* keys (validation only, no code changes)

### Admin UI Updates

- [ ] T029 [P] Update storage creation to use VITE_STORAGE_NAMESPACE in packages/admin-ui/src/main.tsx
- [ ] T030 [P] Update dataProvider to use shared storage instance in packages/admin-ui/src/providers/dataProvider.ts
- [ ] T031 [P] Verify admin UI reads from rest:user:_, rest:group:_, rest:room:\* keys (validation only)

### Seeding Integration

- [ ] T032 Add unified seeding call to chat-ui startup in packages/chat-ui/src/main.tsx
- [ ] T033 Add unified seeding call to admin-ui startup in packages/admin-ui/src/main.tsx

**Validation**:

- ✅ Both UIs use `war-rooms` namespace
- ✅ Chat UI loads XMPP entities from shared storage
- ✅ Admin UI loads REST entities from shared storage
- ✅ Seeding runs on first load
- ✅ No console errors on startup

---

## Phase 5: Testing & Validation

**Goal**: Validate cross-UI data synchronization with E2E tests

### E2E Test Scenarios

- [ ] T034 [P] Write E2E test: Admin creates user → Chat sees user in roster in e2e/cross-ui-sync.spec.ts
- [ ] T035 [P] Write E2E test: Admin creates room → Chat can join room in e2e/cross-ui-sync.spec.ts
- [ ] T036 [P] Write E2E test: Admin updates force metadata → Chat sees new colors in e2e/cross-ui-sync.spec.ts
- [ ] T037 [P] Write E2E test: Chat sends message → Admin sees message count in e2e/cross-ui-sync.spec.ts

### Data Consistency Validation

- [ ] T038 [P] Implement validateStorageConsistency() utility in packages/backend-mock/src/storage.ts
- [ ] T039 [P] Implement dumpStorage() debug utility in packages/backend-mock/src/storage.ts
- [ ] T040 Write consistency validation test in packages/backend-mock/src/**tests**/storage.test.ts

### Full Test Suite

- [ ] T041 Run npm test and ensure all unit tests pass
- [ ] T042 Run npm run test:e2e and ensure all E2E tests pass
- [ ] T043 Run npm run build and ensure all packages build successfully
- [ ] T044 Run npm run typecheck and ensure no type errors

**Validation**:

- ✅ Admin changes appear in chat UI within 1 second
- ✅ Chat changes appear in admin UI (message counts)
- ✅ Data consistency validation passes
- ✅ All tests (unit + E2E) pass
- ✅ Build succeeds with no errors

---

## Phase 6: Documentation & Cleanup

**Goal**: Remove deprecated code and update documentation

### Deprecation

- [ ] T045 Mark seedRestUsers() in packages/backend-mock/src/rest/seed-rest.ts as deprecated with TODO comment
- [ ] T046 Update CLAUDE.md with unified data layer architecture
- [ ] T047 Update package README files with namespace configuration instructions

### Code Quality

- [ ] T048 Run npm run lint:fix to fix any linting issues
- [ ] T049 Run npm run format to format all code
- [ ] T050 Update code comments in transformers.ts with examples
- [ ] T051 Add JSDoc comments to seeding functions

**Validation**:

- ✅ Linting passes
- ✅ Formatting consistent
- ✅ Documentation updated
- ✅ Deprecated code marked clearly

---

## Task Summary

**Total Tasks**: 51

**Breakdown by Phase**:

- Phase 1 (Setup): 4 tasks
- Phase 2 (Transformers): 11 tasks (4 tests + 7 implementations, many parallelizable)
- Phase 3 (Seeding): 11 tasks (4 tests + 7 implementations)
- Phase 4 (UI Integration): 7 tasks (4 parallelizable)
- Phase 5 (Testing): 11 tasks (4 E2E + 3 validation + 4 test runs)
- Phase 6 (Cleanup): 7 tasks

**Parallel Opportunities**: 23 tasks marked [P]

**Testing Approach**: TDD with 18 test tasks written before implementation

**Estimated Effort**:

- Phase 1: 1 hour
- Phase 2: 4 hours (TDD transformers)
- Phase 3: 3 hours (seeding logic)
- Phase 4: 2 hours (UI updates)
- Phase 5: 3 hours (E2E tests)
- Phase 6: 1 hour (cleanup)
- **Total**: ~14 hours

---

## Implementation Strategy

### MVP Scope (First Iteration)

**Minimum viable unified data layer**:

- ✅ Phase 1: Setup (T001-T004)
- ✅ Phase 2: User transformer only (T005, T009-T010, T015)
- ✅ Phase 3: User seeding only (T016, T020, T023-T026)
- ✅ Phase 4: Both UI updates (T027-T033)
- ✅ Phase 5: Single E2E test (T034)

**Deliverable**: Admin can create user → Chat sees user in roster

### Full Implementation (Second Iteration)

- ✅ Complete Phase 2: All transformers (rooms, groups, utilities)
- ✅ Complete Phase 3: All seeding functions
- ✅ Complete Phase 5: Full E2E test suite
- ✅ Complete Phase 6: Documentation and cleanup

**Deliverable**: Complete unified data layer with full test coverage

---

## Execution Notes

### Running Tests

```bash
# Unit tests (transformer round-trips)
npm test packages/backend-mock/src/rest/__tests__/transformers.test.ts

# Integration tests (seeding)
npm test packages/backend-mock/src/__tests__/seed.test.ts

# E2E tests (cross-UI sync)
npm run test:e2e e2e/cross-ui-sync.spec.ts

# All tests
npm test && npm run test:e2e
```

### Development Workflow

**Phase 2 (TDD)**:

```bash
# Write test first
npm test -- --watch transformers.test.ts

# Implement transformer (watch test go green)
# Refactor for clarity
```

**Phase 3 (Seeding)**:

```bash
# Seed both protocols
npm run dev  # Chat UI
cd packages/admin-ui && npm run dev  # Admin UI

# Check browser console for seeding logs
# Inspect localStorage: war-rooms namespace
```

**Phase 5 (E2E)**:

```bash
# Run E2E in UI mode for debugging
npm run test:e2e -- --ui

# Run specific test
npm run test:e2e e2e/cross-ui-sync.spec.ts:34
```

### Debugging Storage

```typescript
// In browser console
const storage = createStorage({ backend: 'localStorage', namespace: 'war-rooms' });
const dump = await dumpStorage(storage);
console.log(
  'XMPP users:',
  Array.from(dump.keys()).filter((k) => k.startsWith('roster/'))
);
console.log(
  'REST users:',
  Array.from(dump.keys()).filter((k) => k.startsWith('rest:user:'))
);
```

### Rollback Plan

If issues arise:

1. Revert UI changes (T027-T033)
2. Keep transformers (useful for future)
3. UIs return to separate namespaces
4. Fix issues, then re-integrate

---

## Success Metrics

**Implementation Quality**:

- [ ] All 51 tasks completed
- [ ] All tests pass (unit + E2E)
- [ ] Code coverage ≥ 80% for new code
- [ ] Build succeeds with no errors
- [ ] Linting passes
- [ ] Type checking passes

**Functional Validation**:

- [ ] Admin creates user → Chat sees user within 1s
- [ ] Admin creates room → Chat can join within 1s
- [ ] Admin updates force → Chat sees new theme within 1s
- [ ] Chat sends message → Admin sees count update
- [ ] Seeding creates both XMPP and REST entities
- [ ] Storage consistency validation passes

**Performance**:

- [ ] Transformation overhead < 1ms per entity
- [ ] Seeding completes in < 2 seconds
- [ ] No performance regression vs separate namespaces
- [ ] Memory footprint unchanged (~100KB total)

---

## References

- **Plan**: [plan.md](./plan.md) - Architecture and design decisions
- **Research**: [research.md](./research.md) - Technical decisions (952 lines)
- **Data Model**: [data-model.md](./data-model.md) - Entity schemas
- **Contracts**: [contracts/](./contracts/) - TypeScript interfaces
- **Quickstart**: [quickstart.md](./quickstart.md) - Integration scenarios
- **Spec**: [spec.md](./spec.md) - User stories and requirements
