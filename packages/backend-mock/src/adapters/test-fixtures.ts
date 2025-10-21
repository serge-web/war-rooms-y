/**
 * Test Fixtures for Adapter Unit Tests
 * Core sample data in unified format
 */

import type {
  UnifiedRoom,
  UnifiedForce,
  UnifiedUser,
  UnifiedFormTemplate,
} from '@war-rooms/backend-interface';
import type { Theme } from '@mui/material/styles';
import { MOCK_DOMAIN, MOCK_CONFERENCE } from '../fixtures';

// ============================================================================
// Test Users
// ============================================================================

export const TEST_USERS: UnifiedUser[] = [
  {
    username: 'commander.red',
    jid: `commander.red@${MOCK_DOMAIN}/resource`,
    name: 'Red Commander',
    email: 'red.commander@test.local',
    password: 'test123',
    groups: ['force-red'],
    isGameMaster: false,
    vcard: {
      fn: 'Red Commander',
      nickname: 'RedCmd',
      title: 'Force Commander',
      org: 'Red Force',
    },
    presence: {
      show: 'chat',
      status: 'Commanding Red Force',
      priority: 10,
    },
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    username: 'commander.blue',
    jid: `commander.blue@${MOCK_DOMAIN}/resource`,
    name: 'Blue Commander',
    email: 'blue.commander@test.local',
    password: 'test123',
    groups: ['force-blue'],
    isGameMaster: false,
    vcard: {
      fn: 'Blue Commander',
      nickname: 'BlueCmd',
      title: 'Force Commander',
      org: 'Blue Force',
    },
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    username: 'gamemaster',
    jid: `gamemaster@${MOCK_DOMAIN}/resource`,
    name: 'Game Master',
    email: 'gm@test.local',
    password: 'admin123',
    groups: ['Game Masters'],
    isGameMaster: true,
    vcard: {
      fn: 'Game Master',
      nickname: 'GM',
      title: 'Exercise Controller',
    },
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    username: 'analyst.red1',
    jid: `analyst.red1@${MOCK_DOMAIN}/resource`,
    name: 'Red Analyst 1',
    email: 'analyst1@red.test.local',
    password: 'test123',
    groups: ['force-red'],
    isGameMaster: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    username: 'analyst.blue1',
    jid: `analyst.blue1@${MOCK_DOMAIN}/resource`,
    name: 'Blue Analyst 1',
    email: 'analyst1@blue.test.local',
    password: 'test123',
    groups: ['force-blue'],
    isGameMaster: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// Test Forces
// ============================================================================

export const TEST_FORCES: UnifiedForce[] = [
  {
    id: 'force-red',
    name: 'Red Force',
    description: 'Opposing force in exercise',
    color: '#D32F2F',
    icon: 'military_tech',
    members: ['commander.red', 'analyst.red1'],
    admins: ['commander.red'],
    objectives: [
      'Maintain territorial control',
      'Disrupt Blue Force operations',
      'Preserve force strength',
    ],
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'gamemaster',
  },
  {
    id: 'force-blue',
    name: 'Blue Force',
    description: 'Friendly force in exercise',
    color: '#1976D2',
    icon: 'shield',
    members: ['commander.blue', 'analyst.blue1'],
    admins: ['commander.blue'],
    objectives: [
      'Secure key objectives',
      'Neutralize Red Force capabilities',
      'Minimize casualties',
    ],
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'gamemaster',
  },
];

// ============================================================================
// Test Rooms
// ============================================================================

export const TEST_ROOMS: UnifiedRoom[] = [
  {
    // Public room - everyone can access
    id: 'all-hands',
    jid: `all-hands@${MOCK_CONFERENCE}`,
    name: 'All Hands',
    description: 'Main coordination room for all participants',
    xmpp: {
      persistent: true,
      publicRoom: true,
      membersOnly: false,
      moderated: false,
      maxUsers: 100,
      subject: 'Exercise coordination',
      changeSubject: false,
    },
    wargaming: {
      type: 'all-hands',
      formTemplates: ['sitrep', 'contact'],
      theme: {
        palette: {
          primary: {
            main: '#4CAF50',
          },
        },
      } as Partial<Theme>,
    },
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: `gamemaster@${MOCK_DOMAIN}`,
  },
  {
    // Force-restricted room
    id: 'red-command',
    jid: `red-command@${MOCK_CONFERENCE}`,
    name: 'Red Command Center',
    description: 'Red Force command and control',
    xmpp: {
      persistent: true,
      publicRoom: false,
      membersOnly: true,
      moderated: false,
      maxUsers: 50,
      subject: 'Red Force operations',
      changeSubject: true,
      password: 'redsecret',
    },
    wargaming: {
      type: 'command',
      groupMembers: ['force-red'],
      formTemplates: ['oporder', 'sitrep'],
      theme: {
        palette: {
          primary: {
            main: '#D32F2F',
          },
        },
      } as Partial<Theme>,
    },
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: `gamemaster@${MOCK_DOMAIN}`,
  },
  {
    // Individual member room
    id: 'intel-room',
    jid: `intel-room@${MOCK_CONFERENCE}`,
    name: 'Intelligence Room',
    description: 'Intelligence sharing and analysis',
    xmpp: {
      persistent: true,
      publicRoom: false,
      membersOnly: true,
      moderated: true,
      maxUsers: 20,
    },
    wargaming: {
      type: 'private',
      individualMembers: ['analyst.red1', 'analyst.blue1', 'gamemaster'],
      formTemplates: ['intrep'],
    },
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: `gamemaster@${MOCK_DOMAIN}`,
  },
  {
    // Mixed access room (force + individuals)
    id: 'planning',
    jid: `planning@${MOCK_CONFERENCE}`,
    name: 'Joint Planning',
    description: 'Joint planning and coordination',
    xmpp: {
      persistent: true,
      publicRoom: false,
      membersOnly: true,
      moderated: false,
      maxUsers: 30,
    },
    wargaming: {
      type: 'standard',
      groupMembers: ['force-blue'],
      individualMembers: ['gamemaster'],
      formTemplates: ['plan', 'rfi'],
    },
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: `gamemaster@${MOCK_DOMAIN}`,
  },
];

// ============================================================================
// Test Form Templates
// ============================================================================

export const TEST_TEMPLATES: UnifiedFormTemplate[] = [
  {
    id: 'sitrep',
    name: 'Situation Report',
    description: 'Standard situation report template',
    schema: {
      type: 'object',
      properties: {
        dtg: {
          type: 'string',
          title: 'Date-Time Group',
        },
        situation: {
          type: 'string',
          title: 'Current Situation',
        },
        actions: {
          type: 'string',
          title: 'Actions Taken',
        },
      },
      required: ['dtg', 'situation'],
    },
    category: 'operational',
    allowedForces: ['force-red', 'force-blue'],
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'gamemaster',
    version: 1,
  },
  {
    id: 'oporder',
    name: 'Operations Order',
    description: 'Operational order template',
    schema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          title: 'Operation Name',
        },
        mission: {
          type: 'string',
          title: 'Mission Statement',
        },
        execution: {
          type: 'string',
          title: 'Execution',
        },
      },
      required: ['operation', 'mission'],
    },
    category: 'command',
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'gamemaster',
    version: 1,
  },
];

// ============================================================================
// Test Wargame Setup
// ============================================================================

import type { Storage } from '../storage';

/**
 * Seed the test wargame scenario into storage
 * Creates a complete wargaming environment with users, forces, rooms, and templates
 */
export async function seedTestWargame(storage: Storage): Promise<void> {
  // Seed users (deep copy to avoid mutation)
  for (const user of TEST_USERS) {
    await storage.setItem(`entities/users/${user.username}`, JSON.parse(JSON.stringify(user)));
  }
  await storage.setItem('entities/users/_index', TEST_USERS.map(u => u.username));

  // Seed forces (deep copy to avoid mutation)
  for (const force of TEST_FORCES) {
    await storage.setItem(`entities/forces/${force.id}`, JSON.parse(JSON.stringify(force)));
  }
  await storage.setItem('entities/forces/_index', TEST_FORCES.map(f => f.id));

  // Seed rooms (deep copy to avoid mutation)
  for (const room of TEST_ROOMS) {
    await storage.setItem(`entities/rooms/${room.id}`, JSON.parse(JSON.stringify(room)));
  }
  await storage.setItem('entities/rooms/_index', TEST_ROOMS.map(r => r.id));

  // Seed templates (deep copy to avoid mutation)
  for (const template of TEST_TEMPLATES) {
    await storage.setItem(`entities/templates/${template.id}`, JSON.parse(JSON.stringify(template)));
  }
  await storage.setItem('entities/templates/_index', TEST_TEMPLATES.map(t => t.id));
}

/**
 * Seed a minimal test environment with just the essentials
 */
export async function seedMinimalTestData(storage: Storage): Promise<void> {
  // Just gamemaster user
  const gm = TEST_USERS.find(u => u.username === 'gamemaster')!;
  await storage.setItem(`entities/users/gamemaster`, gm);
  await storage.setItem('entities/users/_index', ['gamemaster']);

  // Just all-hands room
  const allHands = TEST_ROOMS.find(r => r.id === 'all-hands')!;
  await storage.setItem(`entities/rooms/all-hands`, allHands);
  await storage.setItem('entities/rooms/_index', ['all-hands']);
}

/**
 * Add a new player to an existing force in the test wargame
 */
export async function addPlayerToForce(
  storage: Storage,
  username: string,
  forceName: string,
  role?: string
): Promise<UnifiedUser> {
  const user: UnifiedUser = {
    username,
    name: username.replace('.', ' ').replace(/_/g, ' '),
    groups: [forceName],
    isGameMaster: false,
    vcard: {
      fn: username,
      ...(role ? { title: role } : {}),
      org: forceName,
    },
    createdAt: new Date().toISOString(),
  };

  await storage.setItem(`entities/users/${username}`, user);

  // Update user index
  const userIndex = await storage.getItem<string[]>('entities/users/_index') || [];
  if (!userIndex.includes(username)) {
    userIndex.push(username);
    await storage.setItem('entities/users/_index', userIndex);
  }

  // Update force membership
  const force = await storage.getItem<UnifiedForce>(`entities/forces/${forceName}`);
  if (force && !force.members.includes(username)) {
    force.members.push(username);
    await storage.setItem(`entities/forces/${forceName}`, force);
  }

  return user;
}

/**
 * Create a new room in the test wargame
 */
export async function createTestRoomInWargame(
  storage: Storage,
  id: string,
  options: {
    name?: string;
    groupAccess?: string[];
    individualAccess?: string[];
    publicRoom?: boolean;
  } = {}
): Promise<UnifiedRoom> {
  const room: UnifiedRoom = {
    id,
    jid: `${id}@${MOCK_CONFERENCE}`,
    name: options.name || id,
    xmpp: {
      persistent: true,
      publicRoom: options.publicRoom || false,
      membersOnly: !options.publicRoom,
      moderated: false,
    },
    wargaming: {
      type: 'standard',
      ...(options.groupAccess ? { groupMembers: options.groupAccess } : {}),
      ...(options.individualAccess ? { individualMembers: options.individualAccess } : {}),
    },
    createdAt: new Date().toISOString(),
    createdBy: `gamemaster@${MOCK_DOMAIN}`,
  };

  await storage.setItem(`entities/rooms/${id}`, room);

  // Update room index
  const roomIndex = await storage.getItem<string[]>('entities/rooms/_index') || [];
  if (!roomIndex.includes(id)) {
    roomIndex.push(id);
    await storage.setItem('entities/rooms/_index', roomIndex);
  }

  return room;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a minimal test user
 */
export function createTestUser(username: string, groups: string[] = []): UnifiedUser {
  return {
    username,
    name: username,
    groups,
    isGameMaster: groups.includes('Game Masters'),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create a minimal test room
 */
export function createTestRoom(id: string, options: Partial<UnifiedRoom> = {}): UnifiedRoom {
  return {
    id,
    jid: `${id}@${MOCK_CONFERENCE}`,
    name: options.name || id,
    ...(options.description ? { description: options.description } : {}),
    xmpp: {
      persistent: true,
      publicRoom: false,
      membersOnly: true,
      moderated: false,
      ...options.xmpp,
    },
    wargaming: {
      type: 'standard',
      ...options.wargaming,
    },
    createdAt: new Date().toISOString(),
    createdBy: `gamemaster@${MOCK_DOMAIN}`,
    ...options,
  };
}

/**
 * Create a minimal test force
 */
export function createTestForce(id: string, members: string[] = []): UnifiedForce {
  return {
    id,
    name: id,
    description: `Test force ${id}`,
    color: '#000000',
    icon: 'group',
    members,
    createdAt: new Date().toISOString(),
    createdBy: 'gamemaster',
  };
}

/**
 * Get test data statistics for assertions
 */
export function getTestWargameStats() {
  return {
    userCount: TEST_USERS.length,
    forceCount: TEST_FORCES.length,
    roomCount: TEST_ROOMS.length,
    templateCount: TEST_TEMPLATES.length,
    redForceMembers: TEST_FORCES.find(f => f.id === 'force-red')?.members.length || 0,
    blueForceMembers: TEST_FORCES.find(f => f.id === 'force-blue')?.members.length || 0,
    publicRooms: TEST_ROOMS.filter(r => r.xmpp.publicRoom).length,
    privateRooms: TEST_ROOMS.filter(r => !r.xmpp.publicRoom).length,
  };
}