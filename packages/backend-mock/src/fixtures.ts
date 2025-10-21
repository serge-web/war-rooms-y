/**
 * Mock Fixtures
 * Realistic XMPP-compliant seed data for development
 */

import type {
  XMPPUser,
  XMPPRoom,
  XMPPMessage,
  GameMetadata,
  GameTheme,
  ForceMetadata,
  RoomExtension,
  FormSchema,
} from '@war-rooms/backend-interface';

import { buildJid, generateMessageId } from './helpers';

// ============================================================================
// Configuration
// ============================================================================

export const MOCK_DOMAIN = 'wargame.local';
export const MOCK_CONFERENCE = `conference.${MOCK_DOMAIN}`;
export const MOCK_PUBSUB = `pubsub.${MOCK_DOMAIN}`;

// ============================================================================
// Users (Roster)
// ============================================================================

export const MOCK_USERS: XMPPUser[] = [
  {
    jid: buildJid('commander.red', MOCK_DOMAIN),
    bare_jid: buildJid('commander.red', MOCK_DOMAIN),
    name: 'Red Force Commander',
    subscription: 'both',
    groups: ['force-red', 'Commanders'],
    vcard: {
      fn: 'Commander Red',
      nickname: 'RedCmd',
      org: 'Red Force',
      title: 'Force Commander',
    },
  },
  {
    jid: buildJid('commander.blue', MOCK_DOMAIN),
    bare_jid: buildJid('commander.blue', MOCK_DOMAIN),
    name: 'Blue Force Commander',
    subscription: 'both',
    groups: ['force-blue', 'Commanders'],
    vcard: {
      fn: 'Commander Blue',
      nickname: 'BlueCmd',
      org: 'Blue Force',
      title: 'Force Commander',
    },
  },
  {
    jid: buildJid('analyst.red1', MOCK_DOMAIN),
    bare_jid: buildJid('analyst.red1', MOCK_DOMAIN),
    name: 'Red Analyst 1',
    subscription: 'both',
    groups: ['force-red', 'Analysts'],
    vcard: {
      fn: 'Analyst Red 1',
      nickname: 'RedA1',
      org: 'Red Force',
      title: 'Intelligence Analyst',
    },
  },
  {
    jid: buildJid('analyst.blue1', MOCK_DOMAIN),
    bare_jid: buildJid('analyst.blue1', MOCK_DOMAIN),
    name: 'Blue Analyst 1',
    subscription: 'both',
    groups: ['force-blue', 'Analysts'],
    vcard: {
      fn: 'Analyst Blue 1',
      nickname: 'BlueA1',
      org: 'Blue Force',
      title: 'Intelligence Analyst',
    },
  },
  {
    jid: buildJid('gamemaster', MOCK_DOMAIN),
    bare_jid: buildJid('gamemaster', MOCK_DOMAIN),
    name: 'Game Master',
    subscription: 'both',
    groups: ['Control', 'Game Masters'],
    vcard: {
      fn: 'Game Master',
      nickname: 'GM',
      org: 'Control',
      title: 'Senior Game Master',
    },
  },
];

// ============================================================================
// Forces
// ============================================================================

export const MOCK_FORCES: ForceMetadata[] = [
  {
    id: 'force-red',
    name: 'Red Force',
    description: 'Opposing force conducting offensive operations',
    color: '#D32F2F',
    members: [buildJid('commander.red', MOCK_DOMAIN), buildJid('analyst.red1', MOCK_DOMAIN)],
    commander: buildJid('commander.red', MOCK_DOMAIN),
    metadata: {
      designation: 'OPFOR',
      strength: '2 members',
    },
    createdAt: '2025-01-15T08:00:00.000Z',
    createdBy: buildJid('gamemaster', MOCK_DOMAIN),
  },
  {
    id: 'force-blue',
    name: 'Blue Force',
    description: 'Friendly force conducting defensive operations',
    color: '#1976D2',
    members: [buildJid('commander.blue', MOCK_DOMAIN), buildJid('analyst.blue1', MOCK_DOMAIN)],
    commander: buildJid('commander.blue', MOCK_DOMAIN),
    metadata: {
      designation: 'BLUFOR',
      strength: '2 members',
    },
    createdAt: '2025-01-15T08:00:00.000Z',
    createdBy: buildJid('gamemaster', MOCK_DOMAIN),
  },
];

// ============================================================================
// Game Metadata
// ============================================================================

export const MOCK_GAME: GameMetadata = {
  id: 'game-2025-winter-exercise',
  title: 'Winter Exercise 2025',
  description: 'Multi-domain wargaming exercise focusing on defensive operations',
  startTime: '2025-01-20T09:00:00.000Z',
  endTime: '2025-01-22T17:00:00.000Z',
  status: 'active',
  gameMasters: [buildJid('gamemaster', MOCK_DOMAIN)],
  metadata: {
    scenario: 'Defensive Operations',
    classification: 'UNCLASSIFIED',
    participants: 5,
  },
  createdAt: '2025-01-15T08:00:00.000Z',
  createdBy: buildJid('gamemaster', MOCK_DOMAIN),
  updatedAt: '2025-01-20T09:00:00.000Z',
};

// ============================================================================
// Game Theme (Material UI)
// ============================================================================

export const MOCK_GAME_THEME: GameTheme = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#90CAF9',
    },
    secondary: {
      main: '#F48FB1',
    },
    background: {
      default: '#1A1A1A',
      paper: '#242424',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Courier New", monospace',
  },
} as GameTheme;

// ============================================================================
// Rooms
// ============================================================================

export const MOCK_ROOMS: Array<{
  info: XMPPRoom['info'];
  jid: string;
  extension?: RoomExtension;
}> = [
  {
    jid: buildJid('all-hands', MOCK_CONFERENCE),
    info: {
      identity: {
        category: 'conference',
        type: 'text',
        name: 'All Hands',
      },
      features: ['http://jabber.org/protocol/muc', 'muc_public', 'muc_persistent', 'muc_open'],
      x: {
        description: 'Main coordination room for all participants',
        'muc#roomconfig_roomname': 'All Hands',
        'muc#roomconfig_roomdesc': 'Main coordination room',
        'muc#roomconfig_persistentroom': true,
        'muc#roomconfig_publicroom': true,
        'muc#roomconfig_membersonly': false,
        'muc#roomconfig_moderatedroom': false,
      },
    },
    extension: {
      roomJid: buildJid('all-hands', MOCK_CONFERENCE),
      type: 'all-hands',
      formSchemaIds: ['sitrep', 'intsum'],
      createdAt: '2025-01-15T08:00:00.000Z',
      createdBy: buildJid('gamemaster', MOCK_DOMAIN),
    },
  },
  {
    jid: buildJid('red-command', MOCK_CONFERENCE),
    info: {
      identity: {
        category: 'conference',
        type: 'text',
        name: 'Red Force Command',
      },
      features: ['http://jabber.org/protocol/muc', 'muc_persistent', 'muc_membersonly'],
      x: {
        description: 'Red Force command and control room',
        'muc#roomconfig_roomname': 'Red Force Command',
        'muc#roomconfig_roomdesc': 'Red Force C2',
        'muc#roomconfig_persistentroom': true,
        'muc#roomconfig_publicroom': false,
        'muc#roomconfig_membersonly': true,
        'muc#roomconfig_moderatedroom': false,
      },
    },
    extension: {
      roomJid: buildJid('red-command', MOCK_CONFERENCE),
      type: 'command',
      forceRestrictions: ['force-red'],
      formSchemaIds: ['sitrep', 'oporder'],
      theme: {
        palette: {
          primary: {
            main: '#D32F2F',
          },
        },
      } as Partial<import('@mui/material/styles').Theme>,
      createdAt: '2025-01-15T08:00:00.000Z',
      createdBy: buildJid('gamemaster', MOCK_DOMAIN),
    },
  },
  {
    jid: buildJid('blue-command', MOCK_CONFERENCE),
    info: {
      identity: {
        category: 'conference',
        type: 'text',
        name: 'Blue Force Command',
      },
      features: ['http://jabber.org/protocol/muc', 'muc_persistent', 'muc_membersonly'],
      x: {
        description: 'Blue Force command and control room',
        'muc#roomconfig_roomname': 'Blue Force Command',
        'muc#roomconfig_roomdesc': 'Blue Force C2',
        'muc#roomconfig_persistentroom': true,
        'muc#roomconfig_publicroom': false,
        'muc#roomconfig_membersonly': true,
        'muc#roomconfig_moderatedroom': false,
      },
    },
    extension: {
      roomJid: buildJid('blue-command', MOCK_CONFERENCE),
      type: 'command',
      forceRestrictions: ['force-blue'],
      formSchemaIds: ['sitrep', 'oporder'],
      theme: {
        palette: {
          primary: {
            main: '#1976D2',
          },
        },
      } as Partial<import('@mui/material/styles').Theme>,
      createdAt: '2025-01-15T08:00:00.000Z',
      createdBy: buildJid('gamemaster', MOCK_DOMAIN),
    },
  },
  {
    jid: buildJid('red-media', MOCK_CONFERENCE),
    info: {
      identity: {
        category: 'conference',
        type: 'text',
        name: 'Red Force Media',
      },
      features: ['http://jabber.org/protocol/muc', 'muc_persistent', 'muc_membersonly'],
      x: {
        description: 'Red Force media operations room',
        'muc#roomconfig_roomname': 'Red Force Media',
        'muc#roomconfig_roomdesc': 'Red Force Media Ops',
        'muc#roomconfig_persistentroom': true,
        'muc#roomconfig_publicroom': false,
        'muc#roomconfig_membersonly': true,
        'muc#roomconfig_moderatedroom': false,
      },
    },
    extension: {
      roomJid: buildJid('red-media', MOCK_CONFERENCE),
      type: 'standard',
      forceRestrictions: ['force-red'],
      formSchemaIds: ['sitrep'],
      theme: {
        palette: {
          primary: {
            main: '#D32F2F',
          },
        },
      } as Partial<import('@mui/material/styles').Theme>,
      createdAt: '2025-01-15T08:00:00.000Z',
      createdBy: buildJid('gamemaster', MOCK_DOMAIN),
    },
  },
  {
    jid: buildJid('red-logistics', MOCK_CONFERENCE),
    info: {
      identity: {
        category: 'conference',
        type: 'text',
        name: 'Red Force Logistics',
      },
      features: ['http://jabber.org/protocol/muc', 'muc_persistent', 'muc_membersonly'],
      x: {
        description: 'Red Force logistics coordination room',
        'muc#roomconfig_roomname': 'Red Force Logistics',
        'muc#roomconfig_roomdesc': 'Red Force Logistics',
        'muc#roomconfig_persistentroom': true,
        'muc#roomconfig_publicroom': false,
        'muc#roomconfig_membersonly': true,
        'muc#roomconfig_moderatedroom': false,
      },
    },
    extension: {
      roomJid: buildJid('red-logistics', MOCK_CONFERENCE),
      type: 'standard',
      forceRestrictions: ['force-red'],
      formSchemaIds: ['sitrep'],
      theme: {
        palette: {
          primary: {
            main: '#D32F2F',
          },
        },
      } as Partial<import('@mui/material/styles').Theme>,
      createdAt: '2025-01-15T08:00:00.000Z',
      createdBy: buildJid('gamemaster', MOCK_DOMAIN),
    },
  },
  {
    jid: buildJid('red-HQ', MOCK_CONFERENCE),
    info: {
      identity: {
        category: 'conference',
        type: 'text',
        name: 'Red Force HQ',
      },
      features: ['http://jabber.org/protocol/muc', 'muc_persistent', 'muc_membersonly'],
      x: {
        description: 'Red Force headquarters coordination room',
        'muc#roomconfig_roomname': 'Red Force HQ',
        'muc#roomconfig_roomdesc': 'Red Force HQ',
        'muc#roomconfig_persistentroom': true,
        'muc#roomconfig_publicroom': false,
        'muc#roomconfig_membersonly': true,
        'muc#roomconfig_moderatedroom': false,
      },
    },
    extension: {
      roomJid: buildJid('red-HQ', MOCK_CONFERENCE),
      type: 'standard',
      forceRestrictions: ['force-red'],
      formSchemaIds: ['sitrep', 'oporder'],
      theme: {
        palette: {
          primary: {
            main: '#D32F2F',
          },
        },
      } as Partial<import('@mui/material/styles').Theme>,
      createdAt: '2025-01-15T08:00:00.000Z',
      createdBy: buildJid('gamemaster', MOCK_DOMAIN),
    },
  },
];

// ============================================================================
// Sample Messages
// ============================================================================

export const MOCK_MESSAGES: XMPPMessage[] = [
  // All-Hands messages
  {
    id: generateMessageId(),
    from: `${buildJid('all-hands', MOCK_CONFERENCE)}/GM`,
    to: buildJid('all-hands', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Welcome to Winter Exercise 2025. Exercise start time is 0900Z.',
    delay: {
      stamp: '2025-01-20T08:55:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('all-hands', MOCK_CONFERENCE)}/RedCmd`,
    to: buildJid('all-hands', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Red Force standing by.',
    delay: {
      stamp: '2025-01-20T08:56:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('all-hands', MOCK_CONFERENCE)}/BlueCmd`,
    to: buildJid('all-hands', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Blue Force ready.',
    delay: {
      stamp: '2025-01-20T08:57:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('all-hands', MOCK_CONFERENCE)}/GM`,
    to: buildJid('all-hands', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Exercise is now LIVE. All forces proceed with initial objectives.',
    delay: {
      stamp: '2025-01-20T09:00:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('all-hands', MOCK_CONFERENCE)}/RedA1`,
    to: buildJid('all-hands', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Roger that. Beginning reconnaissance operations.',
    delay: {
      stamp: '2025-01-20T09:01:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('all-hands', MOCK_CONFERENCE)}/BlueA1`,
    to: buildJid('all-hands', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Blue analyst standing by for intelligence updates.',
    delay: {
      stamp: '2025-01-20T09:02:00.000Z',
    },
  },
  // Red Command messages
  {
    id: generateMessageId(),
    from: `${buildJid('red-command', MOCK_CONFERENCE)}/RedCmd`,
    to: buildJid('red-command', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'RedA1, prepare initial SITREP for T+30 minutes.',
    delay: {
      stamp: '2025-01-20T09:05:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-command', MOCK_CONFERENCE)}/RedA1`,
    to: buildJid('red-command', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Understood, Commander. Working on initial assessment now.',
    delay: {
      stamp: '2025-01-20T09:06:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-command', MOCK_CONFERENCE)}/RedCmd`,
    to: buildJid('red-command', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Priority is to establish situational awareness before H+1.',
    delay: {
      stamp: '2025-01-20T09:10:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-command', MOCK_CONFERENCE)}/RedA1`,
    to: buildJid('red-command', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'SITREP: All units in position. No hostile contact yet.',
    delay: {
      stamp: '2025-01-20T09:30:00.000Z',
    },
  },
  // Red Media messages
  {
    id: generateMessageId(),
    from: `${buildJid('red-media', MOCK_CONFERENCE)}/RedCmd`,
    to: buildJid('red-media', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Media team, prepare for initial press release at H+2.',
    delay: {
      stamp: '2025-01-20T09:15:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-media', MOCK_CONFERENCE)}/RedA1`,
    to: buildJid('red-media', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Monitoring social media channels. No significant activity detected.',
    delay: {
      stamp: '2025-01-20T09:20:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-media', MOCK_CONFERENCE)}/RedCmd`,
    to: buildJid('red-media', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Good. Keep tracking Blue Force information operations.',
    delay: {
      stamp: '2025-01-20T09:21:00.000Z',
    },
  },
  // Red Logistics messages
  {
    id: generateMessageId(),
    from: `${buildJid('red-logistics', MOCK_CONFERENCE)}/RedA1`,
    to: buildJid('red-logistics', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Supply status: All units at 100% fuel and ammunition.',
    delay: {
      stamp: '2025-01-20T09:08:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-logistics', MOCK_CONFERENCE)}/RedCmd`,
    to: buildJid('red-logistics', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Excellent. Maintain readiness for extended operations.',
    delay: {
      stamp: '2025-01-20T09:09:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-logistics', MOCK_CONFERENCE)}/RedA1`,
    to: buildJid('red-logistics', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Medical supplies confirmed available at all forward positions.',
    delay: {
      stamp: '2025-01-20T09:25:00.000Z',
    },
  },
  // Red HQ messages
  {
    id: generateMessageId(),
    from: `${buildJid('red-HQ', MOCK_CONFERENCE)}/RedCmd`,
    to: buildJid('red-HQ', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'HQ team, I need eyes on all operational channels.',
    delay: {
      stamp: '2025-01-20T09:03:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-HQ', MOCK_CONFERENCE)}/RedA1`,
    to: buildJid('red-HQ', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Monitoring command, media, and logistics channels now.',
    delay: {
      stamp: '2025-01-20T09:04:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-HQ', MOCK_CONFERENCE)}/RedCmd`,
    to: buildJid('red-HQ', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Report any anomalies immediately.',
    delay: {
      stamp: '2025-01-20T09:12:00.000Z',
    },
  },
  {
    id: generateMessageId(),
    from: `${buildJid('red-HQ', MOCK_CONFERENCE)}/RedA1`,
    to: buildJid('red-HQ', MOCK_CONFERENCE),
    type: 'groupchat',
    body: 'Understood. All channels nominal so far.',
    delay: {
      stamp: '2025-01-20T09:13:00.000Z',
    },
  },
];

// ============================================================================
// Form Schemas (RJSF)
// ============================================================================

// ============================================================================
// Seed Function for MOCK Data
// ============================================================================

import type { Storage } from './storage';
import type { UnifiedUser, UnifiedForce, UnifiedRoom, UnifiedFormTemplate } from '@war-rooms/backend-interface';

/**
 * Convert MOCK fixtures to unified storage format and seed
 */
export async function seedMockWargame(storage: Storage): Promise<void> {
  // Convert MOCK_USERS to UnifiedUser format
  const unifiedUsers: UnifiedUser[] = MOCK_USERS.map(user => {
    const baseUser: UnifiedUser = {
      username: user.jid.split('@')[0] || '',
      jid: user.jid,
      name: user.name || user.jid.split('@')[0] || '',
      email: `${user.jid.split('@')[0]}@${MOCK_DOMAIN}`,
      password: user.jid.split('@')[0] || '', // username as password
      groups: user.groups,
      isGameMaster: user.groups.includes('Game Masters'),
      createdAt: '2025-01-15T08:00:00.000Z',
    };
    if (user.vcard) {
      baseUser.vcard = user.vcard;
    }
    return baseUser;
  });

  // Seed users
  for (const user of unifiedUsers) {
    await storage.setItem(`entities/users/${user.username}`, user);
  }
  await storage.setItem('entities/users/_index', unifiedUsers.map(u => u.username));

  // Convert MOCK_FORCES to UnifiedForce format
  const unifiedForces: UnifiedForce[] = MOCK_FORCES.map(force => {
    const baseForce: UnifiedForce = {
      id: force.id,
      name: force.name,
      color: force.color || '#000000',
      icon: 'military_tech',
      members: force.members.map(jid => jid.split('@')[0] || ''),
      admins: force.commander ? [force.commander.split('@')[0] || ''] : [],
      objectives: [],
      createdAt: force.createdAt,
      createdBy: force.createdBy.split('@')[0] || '',
    };
    if (force.description) {
      baseForce.description = force.description;
    }
    return baseForce;
  });

  // Seed forces
  for (const force of unifiedForces) {
    await storage.setItem(`entities/forces/${force.id}`, force);
  }
  await storage.setItem('entities/forces/_index', unifiedForces.map(f => f.id));

  // Convert MOCK_ROOMS to UnifiedRoom format
  const unifiedRooms: UnifiedRoom[] = MOCK_ROOMS.map(room => {
    const baseRoom: UnifiedRoom = {
      id: room.jid.split('@')[0] || '',
      jid: room.jid,
      name: room.info.identity.name,
      xmpp: {
        persistent: room.info.x?.['muc#roomconfig_persistentroom'] ?? true,
        publicRoom: room.info.x?.['muc#roomconfig_publicroom'] ?? false,
        membersOnly: room.info.x?.['muc#roomconfig_membersonly'] ?? false,
        moderated: room.info.x?.['muc#roomconfig_moderatedroom'] ?? false,
        maxUsers: room.info.x?.['muc#roomconfig_maxusers'] ?? 100,
        changeSubject: room.info.x?.['muc#roomconfig_changesubject'] ?? false,
      },
      wargaming: {
        type: room.extension?.type || 'standard',
      },
      createdAt: room.extension?.createdAt || '2025-01-15T08:00:00.000Z',
      createdBy: room.extension?.createdBy.split('@')[0] || 'gamemaster',
    };
    if (room.info.x?.description) {
      baseRoom.description = room.info.x.description;
    }
    if (room.info.x?.subject) {
      baseRoom.xmpp.subject = room.info.x.subject;
    }
    if (room.info.x?.['muc#roomconfig_roomsecret']) {
      baseRoom.xmpp.password = room.info.x['muc#roomconfig_roomsecret'];
    }
    if (room.extension?.forceRestrictions) {
      baseRoom.wargaming.groupMembers = room.extension.forceRestrictions;
    }
    if (room.extension?.formSchemaIds) {
      baseRoom.wargaming.formTemplates = room.extension.formSchemaIds;
    }
    if (room.extension?.theme) {
      baseRoom.wargaming.theme = room.extension.theme;
    }
    return baseRoom;
  });

  // Seed rooms
  for (const room of unifiedRooms) {
    await storage.setItem(`entities/rooms/${room.id}`, room);
  }
  await storage.setItem('entities/rooms/_index', unifiedRooms.map(r => r.id));

  // Convert MOCK_FORM_SCHEMAS to UnifiedFormTemplate format
  const unifiedTemplates: UnifiedFormTemplate[] = MOCK_FORM_SCHEMAS.map(schema => {
    const baseTemplate: UnifiedFormTemplate = {
      id: schema.id,
      name: schema.title,
      schema: schema.schema,
      category: (schema.tags && schema.tags[0]) || 'general',
      allowedForces: [],
      createdAt: schema.createdAt,
      createdBy: schema.createdBy.split('@')[0] || '',
      version: 1,
    };
    if (schema.description) {
      baseTemplate.description = schema.description;
    }
    if (schema.uiSchema) {
      baseTemplate.uiSchema = schema.uiSchema;
    }
    return baseTemplate;
  });

  // Seed templates
  for (const template of unifiedTemplates) {
    await storage.setItem(`entities/templates/${template.id}`, template);
  }
  await storage.setItem('entities/templates/_index', unifiedTemplates.map(t => t.id));

  console.info(`✅ Seeded ${unifiedUsers.length} users, ${unifiedForces.length} forces, ${unifiedRooms.length} rooms, ${unifiedTemplates.length} templates`);
}

// ============================================================================
// Form Schemas (RJSF)
// ============================================================================

export const MOCK_FORM_SCHEMAS: FormSchema[] = [
  {
    id: 'sitrep',
    title: 'Situation Report (SITREP)',
    description: 'Standard situation report format',
    schema: {
      type: 'object',
      required: ['datetime', 'location', 'situation'],
      properties: {
        datetime: {
          type: 'string',
          format: 'date-time',
          title: 'Date/Time',
        },
        location: {
          type: 'string',
          title: 'Location',
        },
        situation: {
          type: 'string',
          title: 'Situation',
        },
        ownForces: {
          type: 'string',
          title: 'Own Forces',
        },
        enemyForces: {
          type: 'string',
          title: 'Enemy Forces',
        },
        assessment: {
          type: 'string',
          title: 'Assessment',
        },
      },
    },
    uiSchema: {
      datetime: {
        'ui:widget': 'datetime',
      },
      situation: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 5,
        },
      },
      ownForces: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
        },
      },
      enemyForces: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
        },
      },
      assessment: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
        },
      },
    },
    icon: 'description',
    tags: ['report', 'tactical'],
    createdAt: '2025-01-15T08:00:00.000Z',
    createdBy: buildJid('gamemaster', MOCK_DOMAIN),
  },
  {
    id: 'intsum',
    title: 'Intelligence Summary (INTSUM)',
    description: 'Intelligence summary report',
    schema: {
      type: 'object',
      required: ['datetime', 'summary'],
      properties: {
        datetime: {
          type: 'string',
          format: 'date-time',
          title: 'Date/Time',
        },
        summary: {
          type: 'string',
          title: 'Summary',
        },
        enemyActivity: {
          type: 'string',
          title: 'Enemy Activity',
        },
        intelligence: {
          type: 'string',
          title: 'Key Intelligence',
        },
        threats: {
          type: 'array',
          title: 'Identified Threats',
          items: {
            type: 'string',
          },
        },
      },
    },
    uiSchema: {
      datetime: {
        'ui:widget': 'datetime',
      },
      summary: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 5,
        },
      },
      enemyActivity: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
        },
      },
      intelligence: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
        },
      },
    },
    icon: 'analytics',
    tags: ['intelligence', 'report'],
    createdAt: '2025-01-15T08:00:00.000Z',
    createdBy: buildJid('gamemaster', MOCK_DOMAIN),
  },
  {
    id: 'oporder',
    title: 'Operations Order (OPORD)',
    description: 'Standard five-paragraph operations order',
    schema: {
      type: 'object',
      required: ['datetime', 'situation', 'mission', 'execution'],
      properties: {
        datetime: {
          type: 'string',
          format: 'date-time',
          title: 'Date/Time',
        },
        situation: {
          type: 'string',
          title: '1. Situation',
        },
        mission: {
          type: 'string',
          title: '2. Mission',
        },
        execution: {
          type: 'string',
          title: '3. Execution',
        },
        sustainment: {
          type: 'string',
          title: '4. Sustainment',
        },
        commandAndSignal: {
          type: 'string',
          title: '5. Command and Signal',
        },
      },
    },
    uiSchema: {
      datetime: {
        'ui:widget': 'datetime',
      },
      situation: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 4,
        },
      },
      mission: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
        },
      },
      execution: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 5,
        },
      },
      sustainment: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
        },
      },
      commandAndSignal: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
        },
      },
    },
    icon: 'assignment',
    tags: ['order', 'tactical'],
    createdAt: '2025-01-15T08:00:00.000Z',
    createdBy: buildJid('gamemaster', MOCK_DOMAIN),
  },
];
