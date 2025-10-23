# REST API Contracts: Administrative Operations

**Created**: 2025-10-17
**Phase**: Design (Phase 1)
**Purpose**: Define REST API contracts for admin operations, implemented by both OpenFire and mock backends

## Base Configuration

### Endpoints

- **Production**: `https://{openfire-host}:9090/plugins/restapi/v1`
- **Mock**: In-memory handler, no network calls

### Authentication

- **Production**: Basic Auth or API Key header
- **Mock**: Simulated auth with localStorage token

### Common Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token} | Basic {base64}
X-Request-ID: {uuid}           # Request tracing
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string; // ERROR_CODE
    message: string; // Human-readable message
    details?: any; // Additional error context
    timestamp: string; // ISO 8601
    requestId: string; // Trace ID
  };
}
```

## User Management

### Create User

```http
POST /users
```

**Request**:

```typescript
interface CreateUserRequest {
  username: string; // Required, unique
  password: string; // Required, min 8 chars
  email?: string; // Optional
  displayName: string; // Required
  role: 'admin' | 'participant' | 'observer';
  groups?: string[]; // Group IDs to join
  forceId?: string; // Force affiliation
}
```

**Response**: `201 Created`

```typescript
interface CreateUserResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    role: string;
    groups: string[];
    forceId?: string;
    createdAt: string;
    jid?: string; // XMPP JID if OpenFire
  };
}
```

### Get Users

```http
GET /users?page={page}&limit={limit}&role={role}&group={groupId}
```

**Query Parameters**:

- `page`: number (default: 1)
- `limit`: number (default: 100, max: 500)
- `role`: Filter by role
- `group`: Filter by group membership
- `search`: Text search in username/displayName

**Response**: `200 OK`

```typescript
interface GetUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Get User

```http
GET /users/{userId}
```

**Response**: `200 OK`

```typescript
interface GetUserResponse {
  user: User;
  presence?: UserPresence; // Current presence if online
  groups: Group[]; // Expanded group details
}
```

### Update User

```http
PUT /users/{userId}
```

**Request**:

```typescript
interface UpdateUserRequest {
  displayName?: string;
  email?: string;
  role?: string;
  groups?: string[]; // Replace all groups
  forceId?: string;
  status?: 'active' | 'suspended';
}
```

**Response**: `200 OK`

```typescript
interface UpdateUserResponse {
  user: User;
}
```

### Delete User

```http
DELETE /users/{userId}
```

**Response**: `204 No Content`

### Reset Password

```http
POST /users/{userId}/reset-password
```

**Request**:

```typescript
interface ResetPasswordRequest {
  newPassword: string; // Min 8 characters
  requireChange?: boolean; // Force change on next login
}
```

**Response**: `200 OK`

## Group Management

### Create Group

```http
POST /groups
```

**Request**:

```typescript
interface CreateGroupRequest {
  name: string; // Required, unique
  description?: string;
  type: 'force' | 'role' | 'custom';
  allowedRooms?: string[]; // Room IDs
  permissions?: Permission[];
}
```

**Response**: `201 Created`

```typescript
interface CreateGroupResponse {
  group: Group;
}
```

### Get Groups

```http
GET /groups?type={type}
```

**Response**: `200 OK`

```typescript
interface GetGroupsResponse {
  groups: Group[];
}
```

### Update Group

```http
PUT /groups/{groupId}
```

**Request**:

```typescript
interface UpdateGroupRequest {
  name?: string;
  description?: string;
  allowedRooms?: string[];
  permissions?: Permission[];
}
```

**Response**: `200 OK`

### Add Group Members

```http
POST /groups/{groupId}/members
```

**Request**:

```typescript
interface AddMembersRequest {
  userIds: string[]; // User IDs to add
}
```

**Response**: `200 OK`

### Remove Group Members

```http
DELETE /groups/{groupId}/members/{userId}
```

**Response**: `204 No Content`

## Room Management

### Create Room

```http
POST /rooms
```

**Request**:

```typescript
interface CreateRoomRequest {
  name: string; // Required, unique
  description?: string;
  type: 'standard' | 'all-hands' | 'private' | 'command';
  maxUsers?: number; // Default based on type
  accessType: 'public' | 'members-only' | 'invite-only';
  allowedGroups?: string[]; // Group IDs
  persistent?: boolean; // Default: true
  moderated?: boolean; // Default: false
  allowForms?: boolean; // Default: false
  formSchemaIds?: string[];
  theme?: RoomTheme;
}
```

**Response**: `201 Created`

```typescript
interface CreateRoomResponse {
  room: Room;
}
```

### Get Rooms

```http
GET /rooms?type={type}&active={boolean}
```

**Query Parameters**:

- `type`: Filter by room type
- `active`: Filter by activity status
- `userId`: Rooms accessible by user
- `groupId`: Rooms accessible by group

**Response**: `200 OK`

```typescript
interface GetRoomsResponse {
  rooms: Room[];
}
```

### Get Room

```http
GET /rooms/{roomId}
```

**Response**: `200 OK`

```typescript
interface GetRoomResponse {
  room: Room;
  activeUsers: User[]; // Currently in room
  recentMessages: Message[]; // Last 50 messages
}
```

### Update Room

```http
PUT /rooms/{roomId}
```

**Request**:

```typescript
interface UpdateRoomRequest {
  name?: string;
  description?: string;
  maxUsers?: number;
  accessType?: string;
  allowedGroups?: string[];
  moderated?: boolean;
  allowForms?: boolean;
  formSchemaIds?: string[];
  theme?: RoomTheme;
}
```

**Response**: `200 OK`

### Delete Room

```http
DELETE /rooms/{roomId}
```

**Query Parameters**:

- `archive`: boolean (default: true) - Archive vs hard delete

**Response**: `204 No Content`

### Get Room Messages

```http
GET /rooms/{roomId}/messages?before={timestamp}&limit={limit}
```

**Query Parameters**:

- `before`: ISO 8601 timestamp (pagination cursor)
- `after`: ISO 8601 timestamp
- `limit`: number (default: 50, max: 200)
- `type`: Filter by message type

**Response**: `200 OK`

```typescript
interface GetMessagesResponse {
  messages: Message[];
  hasMore: boolean;
  oldestTimestamp?: string;
  newestTimestamp?: string;
}
```

### Clear Room Messages

```http
DELETE /rooms/{roomId}/messages
```

**Response**: `204 No Content`

## Form Schema Management

### Create Form Schema

```http
POST /forms
```

**Request**:

```typescript
interface CreateFormRequest {
  name: string;
  category: 'report' | 'request' | 'update' | 'custom';
  jsonSchema: JSONSchema7;
  uiSchema?: object;
  requiredRole?: string;
  allowedRooms?: string[];
}
```

**Response**: `201 Created`

### Get Form Schemas

```http
GET /forms?category={category}&roomId={roomId}
```

**Response**: `200 OK`

```typescript
interface GetFormsResponse {
  forms: FormSchema[];
}
```

### Update Form Schema

```http
PUT /forms/{formId}
```

**Note**: Creates new version, doesn't modify existing

**Response**: `200 OK`

### Delete Form Schema

```http
DELETE /forms/{formId}
```

**Note**: Soft delete, marks as deprecated

**Response**: `204 No Content`

## Game Metadata Management

### Get Game Metadata

```http
GET /game
```

**Response**: `200 OK`

```typescript
interface GetGameResponse {
  game: GameMetadata;
}
```

### Update Game Metadata

```http
PUT /game
```

**Request**:

```typescript
interface UpdateGameRequest {
  title?: string;
  description?: string;
  scenario?: string;
  logoUrl?: string;
  theme?: GlobalTheme;
  publicInfo?: PublicGameInfo;
}
```

**Response**: `200 OK`

### Update Game State

```http
PUT /game/state
```

**Request**:

```typescript
interface UpdateGameStateRequest {
  status?: 'setup' | 'running' | 'paused' | 'completed';
  currentTurn?: number;
  currentPhase?: string;
  description?: string; // Change description
}
```

**Response**: `200 OK`

### Manage Forces

```http
POST /game/forces
PUT /game/forces/{forceId}
DELETE /game/forces/{forceId}
```

### Manage Missions

```http
POST /game/missions
PUT /game/missions/{missionId}
DELETE /game/missions/{missionId}
```

## System Operations

### Reset Wargame

```http
POST /system/reset
```

**Request**:

```typescript
interface ResetRequest {
  preserveUsers?: boolean; // Keep user accounts
  preserveGroups?: boolean; // Keep group structure
  preserveRooms?: boolean; // Keep room definitions
  clearMessages: boolean; // Always clear messages
  resetGameState: boolean; // Reset to turn 0
}
```

**Response**: `200 OK`

```typescript
interface ResetResponse {
  deletedMessages: number;
  resetState: GameState;
  timestamp: string;
}
```

### Health Check

```http
GET /health
```

**Response**: `200 OK`

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  backend: 'openfire' | 'mock';
  version: string;
  uptime: number; // Seconds
  checks: {
    database: boolean;
    messaging: boolean;
    storage: boolean;
  };
}
```

### Get Statistics

```http
GET /stats
```

**Response**: `200 OK`

```typescript
interface StatsResponse {
  users: {
    total: number;
    online: number;
    active24h: number;
  };
  rooms: {
    total: number;
    active: number;
  };
  messages: {
    total: number;
    today: number;
    averagePerDay: number;
  };
  storage: {
    used: number; // Bytes
    limit?: number; // Bytes (if applicable)
  };
}
```

## Batch Operations

### Bulk Create Users

```http
POST /batch/users
```

**Request**:

```typescript
interface BulkCreateUsersRequest {
  users: CreateUserRequest[];
  continueOnError?: boolean; // Default: false
}
```

**Response**: `200 OK`

```typescript
interface BulkCreateResponse {
  created: User[];
  failed: Array<{
    index: number;
    error: string;
    data: CreateUserRequest;
  }>;
}
```

### Bulk Assign Groups

```http
POST /batch/group-assignments
```

**Request**:

```typescript
interface BulkAssignRequest {
  assignments: Array<{
    userId: string;
    groupIds: string[];
    operation: 'add' | 'remove' | 'replace';
  }>;
}
```

**Response**: `200 OK`

## WebSocket Events (Admin Channel)

For real-time admin updates:

```typescript
interface AdminEvent {
  type:
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'group.created'
    | 'group.updated'
    | 'group.deleted'
    | 'room.created'
    | 'room.updated'
    | 'room.deleted'
    | 'game.updated'
    | 'system.reset';
  data: any;
  timestamp: string;
  userId: string; // Who made the change
}
```

## Rate Limiting

Production backend enforces:

- 100 requests/minute for read operations
- 20 requests/minute for write operations
- 5 requests/minute for bulk operations

Mock backend has no rate limiting.

## Idempotency

All write operations support idempotency via:

```http
X-Idempotency-Key: {uuid}
```

Server caches results for 24 hours.

## Pagination

Standard pagination format:

```typescript
interface PaginatedRequest {
  page?: number; // 1-based
  limit?: number; // Items per page
  sort?: string; // Field to sort by
  order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Filtering

Standard filter format:

```typescript
interface FilterRequest {
  filters?: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'contains';
    value: any;
  }>;
}
```

## Mock Backend Considerations

The mock backend implements all these contracts with:

- Data stored in localForage
- No actual network requests
- Simulated delays (optional) for realism
- Full CRUD operations on browser storage
- Cross-tab synchronization via BroadcastChannel

Example mock implementation:

```typescript
class MockAdminAPI implements AdminAPI {
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Validate request
    this.validateCreateUser(request);

    // Generate ID
    const user: User = {
      id: generateUUID(),
      ...request,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    // Store in localForage
    await this.storage.addUser(user);

    // Emit event for real-time sync
    this.events.emit('user.created', user);

    return { user };
  }
}
```
