# Tasks: War-Rooms-Y Multi-Room Wargaming Chat Application

**Input**: Design documents from `/specs/001-wargaming-chat-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included as requested by the TDD principle in constitution.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md monorepo structure:

- Backend packages: `packages/backend-interface/`, `packages/backend-mock/`, `packages/backend-openfire/`
- State management: `packages/state/`
- Chat UI: `packages/chat-ui/`
- Admin UI: `packages/admin-ui/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic monorepo structure

- [x] T001 Create monorepo structure with npm workspaces in package.json
- [x] T002 [P] Initialize TypeScript configuration in tsconfig.json and packages/\*/tsconfig.json
- [x] T003 [P] Configure ESLint and Prettier in .eslintrc.js and .prettierrc
- [x] T004 [P] Setup Jest testing framework configuration in jest.config.js
- [x] T005 [P] Setup Playwright for E2E testing in playwright.config.ts
- [x] T006 [P] Configure Storybook in .storybook/main.js
- [x] T007 Create GitHub Actions CI/CD pipeline in .github/workflows/ci.yml
- [x] T008 [P] Initialize Vite build configuration for UIs in packages/chat-ui/vite.config.ts and packages/admin-ui/vite.config.ts
- [x] T009 Create environment configuration template in .env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core XMPP backend interface and mock implementation that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Define XMPP stanza types in packages/backend-interface/src/types.ts
- [ ] T011 Create XMPP operations interface in packages/backend-interface/src/xmpp.ts
- [ ] T012 Create PubSub operations interface in packages/backend-interface/src/pubsub.ts
- [ ] T013 [P] Initialize mock backend package structure in packages/backend-mock/src/index.ts
- [ ] T014 [P] Implement localForage storage wrapper in packages/backend-mock/src/storage.ts
- [ ] T015 Implement XMPP stanza generation in packages/backend-mock/src/stanzas.ts
- [ ] T016 Implement MUC protocol simulation in packages/backend-mock/src/muc.ts
- [ ] T017 Implement PubSub simulation in packages/backend-mock/src/pubsub.ts
- [ ] T018 Implement event emitter for mock XMPP events in packages/backend-mock/src/emitter.ts
- [ ] T019 Create mock backend main implementation in packages/backend-mock/src/index.ts
- [ ] T020 [P] Create initial mock data fixtures in packages/backend-mock/src/fixtures/initial-data.ts
- [ ] T021 [P] Setup Zustand store structure in packages/state/src/stores/index.ts
- [ ] T022 [P] Create base React component library structure in packages/chat-ui/src/components/index.ts
- [ ] T023 Write unit tests for mock backend XMPP compliance in packages/backend-mock/src/**tests**/xmpp-compliance.test.ts

**Checkpoint**: Mock backend ready - user story implementation can now begin

---

## Phase 3: User Story 5 - Standalone Demo/Training Mode (Priority: P5 - But implemented first!)

**Goal**: Fully functional demo mode using browser storage, enabling immediate UI development

**Independent Test**: Load static HTML build, verify all functions work with localForage, data persists across sessions

**Note**: Implementing this first enables mock-first development for all other user stories

### Tests for User Story 5

- [ ] T024 [P] [US5] Test mock backend XMPP event generation in packages/backend-mock/tests/stanza-generation.test.ts
- [ ] T025 [P] [US5] Test localForage persistence across sessions in packages/backend-mock/tests/persistence.test.ts
- [ ] T026 [P] [US5] Test cross-tab synchronization via BroadcastChannel in packages/backend-mock/tests/cross-tab.test.ts

### Implementation for User Story 5

- [ ] T027 [US5] Implement mock authentication in packages/backend-mock/src/auth.ts
- [ ] T028 [US5] Implement mock roster management in packages/backend-mock/src/roster.ts
- [ ] T029 [US5] Implement mock presence simulation in packages/backend-mock/src/presence.ts
- [ ] T030 [US5] Implement MAM (message archive) simulation in packages/backend-mock/src/mam.ts
- [ ] T031 [US5] Create backend factory for runtime selection in packages/backend-interface/src/factory.ts
- [ ] T032 [US5] Implement data reset functionality in packages/backend-mock/src/reset.ts
- [ ] T033 [US5] Add debug utilities for state inspection in packages/backend-mock/src/debug.ts
- [ ] T034 [P] [US5] Create demo scenarios and fixtures in packages/backend-mock/src/fixtures/scenarios.ts
- [ ] T035 [US5] Configure static HTML build in packages/chat-ui/vite.config.ts

**Checkpoint**: Demo mode fully functional - UI development can proceed without OpenFire

---

## Phase 4: User Story 1 - Basic Multi-Room Messaging (Priority: P1) 🎯 MVP

**Goal**: Real-time multi-room chat with presence, using mock backend for development

**Independent Test**: Two users join rooms, exchange messages, verify real-time delivery and presence updates

### Tests for User Story 1

- [x] T036 [P] [US1] Test message delivery within 2 seconds in packages/chat-ui/tests/message-delivery.test.ts
- [x] T037 [P] [US1] Test presence updates on join/leave in packages/chat-ui/tests/presence.test.ts
- [x] T038 [P] [US1] Test room switching and unread counts in packages/chat-ui/tests/room-switching.test.ts
- [x] T039 [P] [US1] E2E test multi-user messaging flow in packages/chat-ui/e2e/messaging.spec.ts

### Implementation for User Story 1

- [x] T040 [P] [US1] Create message state store in packages/state/src/messages.ts
- [x] T041 [P] [US1] Create room state store in packages/state/src/rooms.ts
- [x] T042 [P] [US1] Create presence state store in packages/state/src/rooms.ts (integrated)
- [x] T043 [P] [US1] Implement XMPP connection hook in packages/chat-ui/src/providers/BackendProvider.tsx
- [x] T044 [P] [US1] Create MessageList component in packages/chat-ui/src/components/ChatRoom.tsx (integrated)
- [x] T045 [P] [US1] Create MessageInput component in packages/chat-ui/src/components/ChatRoom.tsx (integrated)
- [x] T046 [P] [US1] Create RoomList component in packages/chat-ui/src/components/RoomList.tsx
- [x] T047 [P] [US1] Create PresenceIndicator component in packages/chat-ui/src/components/PresenceIndicator.tsx
- [x] T048 [P] [US1] Create ParticipantList component in packages/chat-ui/src/components/ParticipantList.tsx
- [x] T049 [US1] Implement room layout with flexlayout-react in packages/chat-ui/src/components/GameLayout.tsx
- [x] T050 [US1] Create chat page container in packages/chat-ui/src/App.tsx
- [x] T051 [US1] Implement message composition helpers in packages/chat-ui/src/components/ChatRoom.tsx (inline)
- [x] T052 [US1] Add real-time message handling in packages/chat-ui/src/providers/BackendProvider.tsx
- [x] T053 [US1] Implement unread message tracking in packages/state/src/unread.ts
- [x] T054 [P] [US1] Create Storybook stories for chat components in packages/chat-ui/src/components/\*.stories.tsx

**Checkpoint**: Core messaging functionality complete and independently testable

---

## Phase 5: User Story 2 - User and Room Administration (Priority: P2)

**Goal**: Admin interface for managing users, groups, and rooms via React-Admin

**Independent Test**: Admin creates users/rooms, verify participants can access only assigned rooms

### Tests for User Story 2

- [ ] T055 [P] [US2] Test user CRUD operations in packages/admin-ui/tests/users.test.ts
- [ ] T056 [P] [US2] Test room CRUD operations in packages/admin-ui/tests/rooms.test.ts
- [ ] T057 [P] [US2] Test group membership updates in packages/admin-ui/tests/groups.test.ts
- [ ] T058 [P] [US2] E2E test admin workflow in packages/admin-ui/e2e/admin.spec.ts

### Implementation for User Story 2

- [ ] T059 [P] [US2] Create REST API client wrapper in packages/admin-ui/src/providers/dataProvider.ts
- [ ] T060 [P] [US2] Create auth provider for React-Admin in packages/admin-ui/src/providers/authProvider.ts
- [ ] T061 [P] [US2] Create User resource component in packages/admin-ui/src/resources/users/index.tsx
- [ ] T062 [P] [US2] Create Room resource component in packages/admin-ui/src/resources/rooms/index.tsx
- [ ] T063 [P] [US2] Create Group resource component in packages/admin-ui/src/resources/groups/index.tsx
- [ ] T064 [US2] Implement Material UI theme editor for rooms in packages/admin-ui/src/resources/rooms/MUIThemeEditor.tsx
- [ ] T065 [US2] Create bulk user import feature in packages/admin-ui/src/resources/users/BulkImport.tsx
- [ ] T066 [US2] Implement permission editor in packages/admin-ui/src/resources/groups/PermissionEditor.tsx
- [ ] T067 [US2] Create admin dashboard in packages/admin-ui/src/pages/Dashboard.tsx
- [ ] T068 [US2] Configure React-Admin app in packages/admin-ui/src/App.tsx
- [ ] T069 [P] [US2] Mock REST API endpoints in packages/backend-mock/src/rest-api.ts
- [ ] T070 [P] [US2] Create Storybook stories for admin components in packages/admin-ui/src/resources/\*.stories.tsx

**Checkpoint**: Administrative interface fully functional

---

## Phase 6: User Story 3 - Structured Form Submissions (Priority: P3)

**Goal**: Support structured data entry via RJSF forms in addition to free-text

**Independent Test**: Create form schema, submit data, verify structured data appears correctly

### Tests for User Story 3

- [ ] T071 [P] [US3] Test form schema validation in packages/chat-ui/tests/form-validation.test.ts
- [ ] T072 [P] [US3] Test form submission as message in packages/chat-ui/tests/form-submission.test.ts
- [ ] T073 [P] [US3] Test form builder in admin in packages/admin-ui/tests/form-builder.test.ts

### Implementation for User Story 3

- [ ] T074 [P] [US3] Create form schema types in packages/backend-interface/src/forms.ts
- [ ] T075 [P] [US3] Implement form storage in PubSub in packages/backend-mock/src/forms.ts
- [ ] T076 [P] [US3] Create FormRenderer component using RJSF in packages/chat-ui/src/components/FormRenderer.tsx
- [ ] T077 [P] [US3] Create FormSelector component in packages/chat-ui/src/components/FormSelector.tsx
- [ ] T078 [P] [US3] Create FormMessage display component in packages/chat-ui/src/components/FormMessage.tsx
- [ ] T079 [US3] Integrate rjsf-builder in admin UI in packages/admin-ui/src/resources/forms/FormBuilder.tsx
- [ ] T080 [US3] Create Form resource for admin in packages/admin-ui/src/resources/forms/index.tsx
- [ ] T081 [US3] Add form submission to message input in packages/chat-ui/src/components/MessageInput.tsx
- [ ] T082 [US3] Implement form validation with AJV in packages/chat-ui/src/utils/form-validator.ts
- [ ] T083 [P] [US3] Create sample form schemas in packages/backend-mock/src/fixtures/forms.ts

**Checkpoint**: Structured forms fully integrated with messaging

---

## Phase 7: User Story 4 - Game Metadata Management (Priority: P4)

**Goal**: Configure and display game metadata, forces, missions, and themes

**Independent Test**: Configure metadata, verify anonymous users see intro, authenticated see force-specific data

### Tests for User Story 4

- [ ] T084 [P] [US4] Test metadata PubSub updates in packages/chat-ui/tests/metadata-updates.test.ts
- [ ] T085 [P] [US4] Test theme application in packages/chat-ui/tests/theming.test.ts
- [ ] T086 [P] [US4] Test public metadata display in packages/chat-ui/tests/public-metadata.test.ts

### Implementation for User Story 4

- [ ] T087 [P] [US4] Create game metadata types in packages/backend-interface/src/metadata.ts
- [ ] T088 [P] [US4] Implement metadata PubSub nodes in packages/backend-mock/src/metadata.ts
- [ ] T089 [P] [US4] Create GameMetadata component in packages/chat-ui/src/components/GameMetadata.tsx
- [ ] T090 [P] [US4] Create ForceDisplay component in packages/chat-ui/src/components/ForceDisplay.tsx
- [ ] T091 [P] [US4] Create MissionTracker component in packages/chat-ui/src/components/MissionTracker.tsx
- [ ] T092 [US4] Implement Material UI ThemeProvider with hierarchical theme merging in packages/chat-ui/src/providers/ThemeProvider.tsx
- [ ] T093 [US4] Create login screen with public metadata in packages/chat-ui/src/pages/LoginPage.tsx
- [ ] T094 [US4] Create metadata editor with global MUI theme editor in packages/admin-ui/src/resources/metadata/index.tsx
- [ ] T095 [US4] Implement game state tracker in packages/state/src/stores/gameState.ts
- [ ] T096 [US4] Add PubSub subscription for metadata in packages/chat-ui/src/hooks/useMetadata.ts
- [ ] T097 [P] [US4] Create metadata fixtures in packages/backend-mock/src/fixtures/metadata.ts

**Checkpoint**: Full metadata system operational

---

## Phase 8: OpenFire Backend Implementation

**Goal**: Implement real XMPP backend using Stanza.js for production deployment

**Note**: This can be developed in parallel once mock backend is stable

### Tests for OpenFire Backend

- [ ] T098 [P] Test Stanza.js connection in packages/backend-openfire/tests/connection.test.ts
- [ ] T099 [P] Test MUC operations in packages/backend-openfire/tests/muc.test.ts
- [ ] T100 [P] Test PubSub operations in packages/backend-openfire/tests/pubsub.test.ts

### Implementation for OpenFire Backend

- [ ] T101 [P] Initialize OpenFire backend package in packages/backend-openfire/src/index.ts
- [ ] T102 [P] Implement Stanza.js client wrapper in packages/backend-openfire/src/client.ts
- [ ] T103 [P] Implement MUC protocol handler in packages/backend-openfire/src/muc.ts
- [ ] T104 [P] Implement PubSub handler in packages/backend-openfire/src/pubsub.ts
- [ ] T105 [P] Implement MAM queries in packages/backend-openfire/src/mam.ts
- [ ] T106 [P] Implement presence handling in packages/backend-openfire/src/presence.ts
- [ ] T107 Create connection manager with reconnection in packages/backend-openfire/src/connection.ts
- [ ] T108 Add stream management (XEP-0198) in packages/backend-openfire/src/stream.ts
- [ ] T109 Implement roster versioning (XEP-0237) in packages/backend-openfire/src/roster.ts
- [ ] T110 Create OpenFire configuration helper in packages/backend-openfire/src/config.ts

**Checkpoint**: Production backend ready for deployment

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T111 [P] Add comprehensive logging across all packages
- [ ] T112 [P] Implement error boundaries in React components
- [ ] T113 [P] Add performance monitoring hooks
- [ ] T114 [P] Create user documentation in docs/user-guide.md
- [ ] T115 [P] Create deployment documentation in docs/deployment.md
- [ ] T116 Optimize bundle sizes for static builds
- [ ] T117 Add PWA support for offline capability
- [ ] T118 Implement accessibility improvements (WCAG 2.1 AA)
- [ ] T119 Add security headers and CSP configuration
- [ ] T120 Run full quickstart.md validation with mock and OpenFire backends

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 5 (Phase 3)**: Depends on Foundational - enables mock-first development
- **User Stories 1-4 (Phases 4-7)**: All depend on US5 (mock backend) completion
- **OpenFire Backend (Phase 8)**: Can start after Foundational, parallel to user stories
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 5 (Mock Backend)**: MUST be complete first - enables all UI development
- **User Story 1 (Messaging)**: Core functionality - no dependencies on other stories
- **User Story 2 (Admin)**: Independent, but benefits from US1 being complete for testing
- **User Story 3 (Forms)**: Extends US1 messaging with structured data
- **User Story 4 (Metadata)**: Can be parallel to US2/US3, extends US1 with metadata

### Parallel Opportunities

1. **Phase 1**: All setup tasks marked [P] run in parallel
2. **Phase 2**: Mock backend components marked [P] run in parallel
3. **After US5**: All user stories can proceed in parallel (team permitting)
4. **Within each story**: All component tasks marked [P] run in parallel
5. **OpenFire backend**: Entire Phase 8 parallel to user story development

---

## Parallel Example: User Story 1 (Messaging)

```bash
# Launch all tests together:
npm run test:parallel -- packages/chat-ui/tests/message-delivery.test.ts \
                         packages/chat-ui/tests/presence.test.ts \
                         packages/chat-ui/tests/room-switching.test.ts

# Launch all state stores together:
Task: "Create message state store in packages/state/src/stores/messages.ts"
Task: "Create room state store in packages/state/src/stores/rooms.ts"
Task: "Create presence state store in packages/state/src/stores/presence.ts"

# Launch all components together:
Task: "Create MessageList component"
Task: "Create MessageInput component"
Task: "Create RoomList component"
Task: "Create PresenceIndicator component"
Task: "Create ParticipantList component"
```

---

## Implementation Strategy

### Mock-First MVP (US5 + US1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 5 (Mock Backend)
4. Complete Phase 4: User Story 1 (Messaging)
5. **VALIDATE**: Full chat working with mock backend
6. Deploy static HTML demo

### Incremental Delivery

1. Setup + Foundational + US5 → Development environment ready
2. Add US1 → Core chat MVP (deployable)
3. Add US2 → Admin controls
4. Add US3 → Structured forms
5. Add US4 → Full metadata system
6. Add OpenFire backend → Production ready

### Parallel Team Strategy

With 3+ developers:

1. All: Complete Setup + Foundational
2. Dev A: User Story 5 (Mock Backend) - CRITICAL PATH
3. Once US5 ready:
   - Dev A: User Story 1 (Messaging)
   - Dev B: User Story 2 (Admin)
   - Dev C: OpenFire Backend
4. Then:
   - Dev A: User Story 3 (Forms)
   - Dev B: User Story 4 (Metadata)
   - Dev C: Continue OpenFire + Testing

---

## Summary

- **Total Tasks**: 120
- **Setup**: 9 tasks
- **Foundational**: 14 tasks (critical path)
- **US5 (Mock)**: 12 tasks (enables all development)
- **US1 (Messaging)**: 19 tasks (MVP)
- **US2 (Admin)**: 16 tasks
- **US3 (Forms)**: 10 tasks
- **US4 (Metadata)**: 11 tasks
- **OpenFire Backend**: 13 tasks
- **Polish**: 10 tasks

**Parallel Opportunities**:

- 67 tasks marked [P] can run in parallel within their phases
- 5 user stories can be developed independently after mock backend
- OpenFire backend entirely parallel to UI development

**MVP Scope**: Phases 1-4 (Setup + Foundational + Mock Backend + Basic Messaging) = 54 tasks

**Critical Path**: Setup → Foundational → US5 (Mock) → US1 (Messaging) for fastest MVP
