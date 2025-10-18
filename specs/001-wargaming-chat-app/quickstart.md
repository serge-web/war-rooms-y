# QuickStart Guide: OpenFire Setup for War-Rooms-Y

**Created**: 2025-10-17
**Phase**: Design (Phase 1)
**Purpose**: Step-by-step guide for setting up OpenFire server for development and production

> **💡 Having Docker Issues?** If you're experiencing problems with the OpenFire Docker setup (common on some development machines), you can:
>
> 1. **Start with the mock backend** - See [mock-development-guide.md](mock-development-guide.md) to begin UI development immediately without any server
> 2. **Use a remote OpenFire instance** - Skip to [Remote OpenFire Setup](#remote-openfire-setup) section
> 3. **Continue with Docker troubleshooting** - See [Docker Troubleshooting](#docker-troubleshooting) section

## Prerequisites

- Docker and Docker Compose (for development)
- Java 11+ (for production)
- PostgreSQL or MySQL (optional, for production)
- 2GB RAM minimum, 4GB recommended
- Ports 5222, 5269, 7070, 7443, 9090 available

## Development Setup (Docker)

### 1. Create Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  openfire:
    image: nasqueron/openfire:4.7.5
    container_name: war-rooms-openfire
    hostname: openfire.local
    ports:
      - '9090:9090' # Admin console (HTTP)
      - '9091:9091' # Admin console (HTTPS)
      - '5222:5222' # XMPP client connections
      - '5269:5269' # XMPP server connections
      - '7443:7443' # HTTP-Bind (BOSH) / WebSocket (WSS)
      - '7070:7070' # HTTP-Bind (BOSH) plain
      - '5229:5229' # Flash Cross Domain
    volumes:
      - openfire-data:/var/lib/openfire
      - ./openfire/plugins:/var/lib/openfire/plugins
    environment:
      - OPENFIRE_ADMIN_PASSWORD=admin123
      - OPENFIRE_DOMAIN=wargame.local
    restart: unless-stopped

volumes:
  openfire-data:
```

### 2. Start OpenFire

```bash
# Start the container
docker-compose up -d

# View logs
docker-compose logs -f openfire

# Wait for startup (typically 30-60 seconds)
```

### 3. Initial Configuration

1. Open browser to http://localhost:9090
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Complete setup wizard:
   - Domain: `wargame.local`
   - Database: Embedded (for development)
   - Admin email: `admin@wargame.local`

## Required Plugins Installation

### Via Admin Console

1. Navigate to **Plugins** tab
2. Install from Available Plugins:

| Plugin             | Purpose              | Required |
| ------------------ | -------------------- | -------- |
| REST API           | Admin operations     | ✓        |
| Monitoring Service | Statistics & MAM     | ✓        |
| User Import Export | Bulk user operations | ✓        |
| Presence Service   | Presence information | ✓        |
| HTTP File Upload   | File sharing         | Optional |

### Manual Plugin Installation

Download plugins to `./openfire/plugins/`:

```bash
# REST API Plugin
wget https://www.igniterealtime.org/projects/openfire/plugins/1.9.0/restAPI.jar \
  -O ./openfire/plugins/restAPI.jar

# Monitoring Plugin (includes MAM)
wget https://www.igniterealtime.org/projects/openfire/plugins/2.5.0/monitoring.jar \
  -O ./openfire/plugins/monitoring.jar
```

## Configuration Steps

### 1. Enable REST API

1. Go to **Server > Server Settings > REST API**
2. Settings:
   ```
   ✓ Enabled
   ✓ HTTP Basic Auth
   Secret Key: [Generate and save]
   Allowed IPs: * (development) or specific IPs (production)
   ```

### 2. Configure WebSocket Support

1. Go to **Server > Server Settings > HTTP Binding**
2. Settings:

   ```
   ✓ HTTP Binding Enabled
   ✓ Script Syntax Enabled
   HTTP Bind Port: 7070
   HTTPS Bind Port: 7443

   ✓ WebSocket Enabled
   WebSocket Port: 7070 (ws://)
   WebSocket Secure Port: 7443 (wss://)
   ```

### 3. Enable Message Archive Management (MAM)

1. Go to **Server > Archiving > Archiving Settings**
2. Settings:
   ```
   ✓ Archive one-to-one chats
   ✓ Archive group chats
   Retention: Permanent (or set days)
   ```

### 4. Configure Conference (MUC) Service

1. Go to **Server > Group Chat > Group Chat Settings**
2. Create/Configure service:

   ```
   Service Name: conference
   Service Description: War Rooms Conference Service

   ✓ Room creation restricted to admins
   ✓ List rooms in service discovery
   ✓ Allow users to register nicknames

   History Settings:
   - Show last 50 messages
   - Store unlimited history
   ```

### 5. Configure PubSub Service

1. Go to **Server > PubSub > Service Summary**
2. Verify service exists at `pubsub.wargame.local`
3. Create root collection node:
   ```
   Node ID: war-rooms
   Type: Collection
   Access Model: Presence
   ```

## User and Group Setup

### Create Initial Admin User

```bash
# Using REST API
curl -X POST http://localhost:9090/plugins/restapi/v1/users \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gamemaster",
    "password": "gm_pass123",
    "name": "Game Master",
    "email": "gm@wargame.local"
  }'
```

### Create Groups

```bash
# Force groups
curl -X POST http://localhost:9090/plugins/restapi/v1/groups \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "force-blue",
    "description": "Blue Force Members"
  }'

# Role groups
curl -X POST http://localhost:9090/plugins/restapi/v1/groups \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "role-admin",
    "description": "System Administrators"
  }'
```

### Create Initial Rooms

```bash
# Create standard room
curl -X POST http://localhost:9090/plugins/restapi/v1/chatrooms \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "blue-command",
    "naturalName": "Blue Force Command",
    "description": "Blue force command channel",
    "maxUsers": 50,
    "persistent": true,
    "publicRoom": false,
    "membersOnly": true,
    "allowedGroups": ["force-blue"]
  }'

# Create all-hands room
curl -X POST http://localhost:9090/plugins/restapi/v1/chatrooms \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "all-hands",
    "naturalName": "All Hands",
    "description": "Server-wide announcements",
    "maxUsers": 200,
    "persistent": true,
    "publicRoom": true
  }'
```

## Testing the Setup

### 1. Test XMPP Connection

Using Stanza.js in browser console:

```javascript
import { createClient } from 'stanza';

const client = createClient({
  jid: 'gamemaster@wargame.local',
  password: 'gm_pass123',
  transports: {
    websocket: 'ws://localhost:7070/ws',
  },
});

client.on('session:started', () => {
  console.log('Connected!');
  client.getRoster();
  client.sendPresence();
});

client.connect();
```

### 2. Test REST API

```bash
# Get server info
curl http://localhost:9090/plugins/restapi/v1/system/properties \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM="

# Get users
curl http://localhost:9090/plugins/restapi/v1/users \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM="
```

### 3. Test MUC (Multi-User Chat)

```javascript
// Join room
await client.joinRoom('blue-command@conference.wargame.local', 'GameMaster');

// Send message
client.sendMessage({
  to: 'blue-command@conference.wargame.local',
  type: 'groupchat',
  body: 'Testing MUC',
});
```

### 4. Test PubSub

```javascript
// Subscribe to game state
await client.subscribeToNode('pubsub.wargame.local', 'war-rooms/game/state');

// Publish update
await client.publish('pubsub.wargame.local', 'war-rooms/game/state', {
  id: 'current',
  content: {
    status: 'setup',
    currentTurn: 0,
  },
});
```

## Production Setup

### System Requirements

- **OS**: Ubuntu 20.04+ or RHEL 8+
- **Java**: OpenJDK 11 or 17
- **Database**: PostgreSQL 12+ or MySQL 8+
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 20GB for application + data growth

### Installation Steps

1. **Install Java**:

```bash
sudo apt update
sudo apt install openjdk-11-jdk
```

2. **Download OpenFire**:

```bash
wget https://www.igniterealtime.org/downloadServlet?filename=openfire/openfire_4_7_5.tar.gz \
  -O openfire.tar.gz
tar -xzf openfire.tar.gz
sudo mv openfire /opt/
```

3. **Create Service**:

```bash
sudo useradd -r -s /bin/false openfire
sudo chown -R openfire:openfire /opt/openfire
```

Create `/etc/systemd/system/openfire.service`:

```ini
[Unit]
Description=OpenFire XMPP Server
After=network.target

[Service]
Type=forking
User=openfire
Group=openfire
ExecStart=/opt/openfire/bin/openfire.sh start
ExecStop=/opt/openfire/bin/openfire.sh stop
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

4. **Configure Database**:

```sql
CREATE DATABASE openfire;
CREATE USER openfire WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE openfire TO openfire;
```

5. **Start Service**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable openfire
sudo systemctl start openfire
```

## Security Hardening

### 1. TLS Configuration

1. Generate or obtain SSL certificate
2. Configure in **Server > Server Settings > Server Certificates**
3. Force TLS for client connections:
   - **Server > Server Settings > Client Connections**
   - Set "Required" for both C2S and S2S

### 2. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 5222/tcp  # XMPP clients
sudo ufw allow 7443/tcp  # WebSocket SSL
sudo ufw allow 9091/tcp  # Admin HTTPS
sudo ufw deny 9090/tcp   # Block plain HTTP admin
```

### 3. Access Control

1. Restrict admin console:
   - **Server > Server Manager > Admin Console**
   - Set allowed IP addresses
2. Configure REST API security:
   - Use strong secret key
   - Restrict to backend server IPs
3. Enable account lockout:
   - **Server > Server Settings > Security Settings**
   - Set lockout after 5 failed attempts

## Monitoring and Maintenance

### Health Checks

Create monitoring script:

```bash
#!/bin/bash
# check-openfire.sh

# Check if service is running
systemctl is-active openfire || exit 1

# Check XMPP port
nc -zv localhost 5222 || exit 1

# Check REST API
curl -f http://localhost:9090/plugins/restapi/v1/system/properties \
  -H "Authorization: Basic $API_KEY" || exit 1
```

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backup/openfire"
DATE=$(date +%Y%m%d)

# Backup database
pg_dump openfire > $BACKUP_DIR/db_$DATE.sql

# Backup config
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/openfire/conf

# Keep last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Log Rotation

Configure `/etc/logrotate.d/openfire`:

```
/opt/openfire/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 openfire openfire
    sharedscripts
    postrotate
        systemctl reload openfire
    endscript
}
```

## Troubleshooting

### Common Issues

1. **Cannot connect via WebSocket**:
   - Check firewall rules
   - Verify WebSocket enabled in HTTP Binding
   - Check CORS settings if browser-based

2. **Memory issues**:
   - Edit `/opt/openfire/bin/openfire.sh`
   - Increase: `-Xms512m -Xmx2048m`

3. **Database connection lost**:
   - Check connection pool settings
   - Verify network between OpenFire and DB
   - Check DB max connections

4. **Plugin not loading**:
   - Check plugin compatibility with OpenFire version
   - Review logs in `/opt/openfire/logs/`
   - Verify file permissions

### Debug Logging

Enable debug logging:

1. **Server > Server Manager > Logs**
2. Set level to DEBUG for:
   - `org.jivesoftware.openfire`
   - `org.jivesoftware.openfire.muc`
   - `org.jivesoftware.openfire.pubsub`

## Remote OpenFire Setup

If using an existing remote OpenFire instance:

### 1. Configure Connection

Create `.env.local`:

```env
VITE_BACKEND_MODE=openfire
VITE_OPENFIRE_WS=wss://your-openfire-server.com:7443/ws
VITE_OPENFIRE_DOMAIN=your-domain.com
VITE_OPENFIRE_CONFERENCE=conference.your-domain.com
VITE_OPENFIRE_PUBSUB=pubsub.your-domain.com
```

### 2. CORS Configuration

Ensure remote OpenFire allows your development origin:

**Admin Console** → **Server Settings** → **HTTP Binding** → **CORS**:

```
Allowed Origins: http://localhost:5173, https://localhost:5173
Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
Allowed Headers: Content-Type, Authorization
```

### 3. Test Connection

```typescript
import { StanzaBackend } from '@war-rooms/backend-openfire';

const backend = new StanzaBackend({
  websocketUrl: process.env.VITE_OPENFIRE_WS,
  domain: process.env.VITE_OPENFIRE_DOMAIN,
});

try {
  await backend.connect('testuser@domain', 'password');
  console.log('Connected to remote OpenFire!');
} catch (error) {
  console.error('Connection failed:', error);
}
```

## Docker Troubleshooting

Common Docker issues and solutions:

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :9090
lsof -i :5222
lsof -i :7443

# Use different ports in docker-compose.yml
ports:
  - "19090:9090"  # Changed from 9090
  - "15222:5222"  # Changed from 5222
```

### Memory Issues

```yaml
# Add to docker-compose.yml
services:
  openfire:
    mem_limit: 2g
    memswap_limit: 2g
    environment:
      - JAVA_OPTS=-Xms256m -Xmx1g
```

### Network Issues on Mac

```bash
# Use host network mode (Mac specific)
docker run --network host nasqueron/openfire:4.7.5

# Or create custom network
docker network create openfire-net
docker run --network openfire-net --name openfire nasqueron/openfire:4.7.5
```

### Permission Issues

```bash
# Fix volume permissions
sudo chown -R $(id -u):$(id -g) ./openfire/

# Or run with user mapping
docker run --user $(id -u):$(id -g) nasqueron/openfire:4.7.5
```

### Container Won't Start

```bash
# Check logs
docker logs openfire -f

# Common fix: Remove existing data
docker-compose down -v
rm -rf ./openfire/data
docker-compose up -d
```

## Demo Mode Setup (No OpenFire)

For standalone browser demo, see [mock-development-guide.md](mock-development-guide.md) for complete instructions.

Quick start:

```javascript
// Initialize mock backend
import { MockXMPPBackend } from '@war-rooms/backend-mock';

const backend = new MockXMPPBackend({
  persistence: 'localStorage',
  debugMode: true,
  initialData: initialMockData,
});

// Use same API as OpenFire backend
await backend.connect('demo@local', 'demo');
```

## Next Steps

1. Configure monitoring dashboard
2. Set up automated backups
3. Implement security audit logging
4. Configure rate limiting
5. Set up development/staging environments
6. Create deployment automation scripts

## Resources

- [OpenFire Documentation](https://www.igniterealtime.org/projects/openfire/documentation.jsp)
- [REST API Plugin Docs](https://www.igniterealtime.org/projects/openfire/plugins/1.9.0/restAPI/readme.html)
- [XMPP Standards](https://xmpp.org/extensions/)
- [Stanza.js Documentation](https://github.com/legastero/stanza)
