# Admin REST API Contract

**Purpose**: Define the integration contract between React-Admin and OpenFire REST API, including PubSub extensions for metadata.

## OpenFire REST API v1.12.0 Integration

Base URL: `https://[openfire-server]:9091/plugins/restapi/v1`
Authentication: Basic Auth or Shared Secret Key

## Authentication Flow

### Admin UI Access Control

The Admin UI (`/admin`) enforces access control through OpenFire group membership:

**Login Flow**:

1. User provides credentials at `/admin` login page
2. Admin UI performs XMPP authentication via backend
3. On successful XMPP auth, check user's group memberships
4. Query OpenFire REST API: `GET /users/{username}`
5. Response includes `properties` object with group information
6. Verify user is member of `admins` group
7. **If admin**: Grant access to React-Admin interface
8. **If not admin**: Display error + redirect to `/` (Chat UI)

### REST API Authentication Endpoint

```
GET /users/{username}
Authorization: Basic [admin-credentials] or X-Auth-Token: [secret-key]

Response:
{
  "username": "gamemaster",
  "name": "Game Master",
  "email": "gm@example.com",
  "properties": {
    "sharedGroups": ["admins", "gamemaster-group"]
  }
}
```

### Mock Implementation

Mock backend must simulate admin group check:

**Mock Storage Structure** (localForage):

```typescript
// Key: 'rest:user:gamemaster'
{
  username: 'gamemaster',
  password: 'password', // For mock auth only
  properties: {
    sharedGroups: ['admins', 'gamemaster-group']
  }
}
```

**Mock Auth Provider**:

```typescript
async checkAuth(credentials) {
  // 1. Authenticate via XMPP mock
  const authenticated = await mockBackend.authenticate(credentials);
  if (!authenticated) throw new Error('Invalid credentials');

  // 2. Check admin group membership
  const user = await mockStorage.get(`rest:user:${credentials.username}`);
  const isAdmin = user.properties?.sharedGroups?.includes('admins');
  if (!isAdmin) throw new Error('Unauthorized: admin access required');

  return { username: credentials.username, isAdmin: true };
}
```

### Error Handling

**401 Unauthorized**: Invalid credentials

- Message: "Authentication failed. Please check your username and password."
- Action: Clear form, allow retry

**403 Forbidden**: Valid user but not in admin group

- Message: "Admin access required. Redirecting to chat interface..."
- Action: Auto-redirect to `/` after 2 seconds

**500 Server Error**: OpenFire connection failed

- Message: "Unable to connect to server. Please try again later."
- Action: Retry option, don't redirect

### Core REST Endpoints Used

#### Users

- `GET /users` - List all users with pagination
- `GET /users/{username}` - Get user details
- `POST /users` - Create new user
- `PUT /users/{username}` - Update user
- `DELETE /users/{username}` - Delete user

#### Groups (Forces)

- `GET /groups` - List all groups
- `GET /groups/{groupName}` - Get group details
- `POST /groups` - Create new group
- `PUT /groups/{groupName}` - Update group
- `DELETE /groups/{groupName}` - Delete group
- `POST /groups/{groupName}/members/{username}` - Add member
- `DELETE /groups/{groupName}/members/{username}` - Remove member

#### MUC Rooms

- `GET /chatrooms` - List all rooms
- `GET /chatrooms/{roomName}` - Get room details
- `POST /chatrooms` - Create new room
- `PUT /chatrooms/{roomName}` - Update room
- `DELETE /chatrooms/{roomName}` - Delete room
- `POST /chatrooms/{roomName}/members/{jid}` - Add member
- `POST /chatrooms/{roomName}/owners/{jid}` - Add owner
- `POST /chatrooms/{roomName}/admins/{jid}` - Add admin

### PubSub Metadata Extensions

Since OpenFire REST API doesn't provide all needed metadata, we store additional data in PubSub nodes:

#### Force Metadata Node

Node ID: `force:{groupName}`

```json
{
  "color": "#FF0000",
  "icon": "military-tech",
  "objectives": ["Secure northern border", "Maintain supply lines"],
  "description": "Red Force Command"
}
```

#### Room Metadata Node

Node ID: `room:{roomName}`

```json
{
  "theme": {
    "primaryColor": "#1976d2",
    "backgroundColor": "#f5f5f5",
    "logo": "data:image/png;base64,..."
  },
  "description": "Strategic planning room",
  "allowedGroups": ["red-force", "blue-force"],
  "allowedUsers": ["observer1", "referee"],
  "formTemplates": ["sitrep", "contact-report"],
  "maxOccupants": 50
}
```

#### Game Overview Node

Node ID: `game:overview`

```json
{
  "title": "Operation Thunder Strike",
  "status": "active",
  "currentTurn": 3,
  "gameTime": "2025-01-20T14:00:00Z",
  "description": "Maritime interdiction scenario",
  "startTime": "2025-01-20T09:00:00Z",
  "scenario": "maritime-interdiction-v2"
}
```

## React-Admin Data Provider Implementation

### Hybrid Data Provider Architecture

```typescript
interface AdminDataProvider extends DataProvider {
  // Standard React-Admin methods
  getList(resource: string, params: GetListParams): Promise<GetListResult>;
  getOne(resource: string, params: GetOneParams): Promise<GetOneResult>;
  create(resource: string, params: CreateParams): Promise<CreateResult>;
  update(resource: string, params: UpdateParams): Promise<UpdateResult>;
  delete(resource: string, params: DeleteParams): Promise<DeleteResult>;

  // Extended methods for metadata
  getMetadata(nodeId: string): Promise<any>;
  setMetadata(nodeId: string, data: any): Promise<void>;
}
```

### Resource Mapping

#### Overview Resource

- **getOne**: Fetches from PubSub node `game:overview`
- **update**: Updates PubSub node `game:overview`
- No create/delete operations (single record)

#### Forces Resource

- **getList**: `GET /groups` + PubSub metadata for each group
- **getOne**: `GET /groups/{name}` + PubSub node `force:{name}`
- **create**: `POST /groups` + create PubSub node
- **update**: `PUT /groups/{name}` + update PubSub node
- **delete**: `DELETE /groups/{name}` + delete PubSub node

#### Rooms Resource

- **getList**: `GET /chatrooms` + PubSub metadata for each room
- **getOne**: `GET /chatrooms/{name}` + PubSub node `room:{name}`
- **create**: `POST /chatrooms` + create PubSub node
- **update**: `PUT /chatrooms/{name}` + update PubSub node
- **delete**: `DELETE /chatrooms/{name}` + delete PubSub node

#### Templates Resource (Placeholder)

- All operations via PubSub nodes only
- Node pattern: `template:{templateId}`

## Mock Implementation Requirements

### Mock REST API

- Implement all OpenFire REST endpoints listed above
- Store data in localForage with key pattern: `rest:{resource}:{id}`
- Simulate authentication with shared secret
- Support pagination, filtering, sorting

### Mock PubSub Storage

- Store metadata in localForage with key pattern: `pubsub:{nodeId}`
- Emit events via BroadcastChannel for real-time updates
- Support subscription simulation

### Data Synchronization

- REST operations trigger PubSub events
- PubSub updates propagate to all connected clients
- Maintain consistency between REST and PubSub data

## Error Handling

### REST API Errors

- 400: Bad Request (invalid data)
- 401: Unauthorized (auth failure)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (duplicate resource)
- 500: Internal Server Error

### PubSub Errors

- Node not found: Create node automatically
- Permission denied: Check user roles
- Invalid payload: Validate against schema

## Testing Strategy

### Unit Tests

- Mock data provider methods
- Test REST endpoint mapping
- Test PubSub metadata operations
- Validate error handling

### Integration Tests

- Test full CRUD operations for each resource
- Verify REST + PubSub synchronization
- Test real-time updates via subscriptions
- Validate permission enforcement

### E2E Tests

- Admin creates force with metadata
- Admin assigns rooms to forces
- Verify metadata propagation to chat UI
- Test permission-based access control
