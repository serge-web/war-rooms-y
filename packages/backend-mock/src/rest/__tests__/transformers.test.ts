/**
 * Transformer Tests (TDD)
 * Tests MUST be written before implementation per constitution
 */

import {
  xmppUserToRest,
  restUserToXmpp,
  xmppRoomToRest,
  restRoomToXmpp,
  forceToRestGroup,
  deriveRestGroupsFromRoster,
  extractUsername,
  buildBareJid,
  extractRoomName,
  buildRoomJid,
} from '../transformers';

const MOCK_DOMAIN = 'wargame.local';
const MOCK_CONFERENCE = `conference.${MOCK_DOMAIN}`;

// ============================================================================
// T005: User Transformer Round-Trip Tests
// ============================================================================

describe('User Transformers', () => {
  const mockXmppUser = {
    jid: 'commander.red@wargame.local',
    bare_jid: 'commander.red@wargame.local',
    name: 'Red Force Commander',
    subscription: 'both' as const,
    groups: ['Red Force', 'Commanders'],
    vcard: {
      fn: 'Commander Red',
      nickname: 'RedCmd',
      org: 'Red Force',
      title: 'Force Commander',
      email: 'red.cmd@wargame.local',
    },
  };

  test('xmppUserToRest() extracts username from JID', () => {
    const restUser = xmppUserToRest(mockXmppUser);
    
    expect(restUser.username).toBe('commander.red');
    expect(restUser.name).toBe('Commander Red');
    expect(restUser.email).toBe('red.cmd@wargame.local');
    expect(restUser.properties?.sharedGroups).toEqual(['Red Force', 'Commanders']);
  });

  test('xmppUserToRest() handles missing vcard gracefully', () => {
    const { vcard, ...userWithoutVcard } = mockXmppUser;

    const restUser = xmppUserToRest(userWithoutVcard);

    expect(restUser.username).toBe('commander.red');
    expect(restUser.name).toBe('Red Force Commander'); // Falls back to name
  });

  test('restUserToXmpp() builds correct JID', () => {
    const restUser = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      properties: {
        sharedGroups: ['TestGroup'],
      },
    };

    const xmppUser = restUserToXmpp(restUser, MOCK_DOMAIN);

    expect(xmppUser.bare_jid).toBe('testuser@wargame.local');
    expect(xmppUser.jid).toBe('testuser@wargame.local');
    expect(xmppUser.groups).toEqual(['TestGroup']);
    expect(xmppUser.subscription).toBe('both');
    expect(xmppUser.vcard?.fn).toBe('Test User');
    expect(xmppUser.vcard?.email).toBe('test@example.com');
  });

  test('Round-trip XMPP → REST → XMPP preserves core fields', () => {
    const rest = xmppUserToRest(mockXmppUser);
    const roundTrip = restUserToXmpp(rest, MOCK_DOMAIN);

    expect(roundTrip.bare_jid).toBe(mockXmppUser.bare_jid);
    expect(roundTrip.jid).toBe(mockXmppUser.jid);
    expect(roundTrip.groups).toEqual(mockXmppUser.groups);
    expect(roundTrip.vcard?.fn).toBe(mockXmppUser.vcard?.fn);
    expect(roundTrip.vcard?.email).toBe(mockXmppUser.vcard?.email);
  });
});

// ============================================================================
// T006: Room Transformer Round-Trip Tests
// ============================================================================

describe('Room Transformers', () => {
  const mockXmppRoom= {
    jid: 'red-command@conference.wargame.local',
    info: {
      identity: {
        category: 'conference' as const,
        type: 'text' as const,
        name: 'Red Force Command',
      },
      features: ['http://jabber.org/protocol/muc'],
      x: {
        'muc#roomconfig_membersonly': true,
        'muc#roomconfig_persistentroom': true,
      },
    },
  };

  test('xmppRoomToRest() extracts room name from JID', () => {
    const restRoom = xmppRoomToRest(mockXmppRoom, MOCK_CONFERENCE);

    expect(restRoom.roomName).toBe('red-command');
    expect(restRoom.naturalName).toBe('Red Force Command');
    expect(restRoom.membersOnly).toBe(true);
    expect(restRoom.persistent).toBe(true);
  });

  test('xmppRoomToRest() handles missing config fields', () => {
    const minimalRoom= {
      jid: 'test-room@conference.wargame.local',
      info: {
        identity: {
          category: 'conference' as const,
          type: 'text' as const,
          name: 'Test Room',
        },
        features: ['http://jabber.org/protocol/muc'],
      },
    };

    const restRoom = xmppRoomToRest(minimalRoom, MOCK_CONFERENCE);

    expect(restRoom.roomName).toBe('test-room');
    expect(restRoom.naturalName).toBe('Test Room');
  });

  test('restRoomToXmpp() builds correct room JID', () => {
    const restRoom = {
      roomName: 'test-ops',
      naturalName: 'Test Operations Center',
      membersOnly: true,
      persistent: true,
      publicRoom: false,
    };

    const xmppRoom = restRoomToXmpp(restRoom, MOCK_CONFERENCE);

    expect(xmppRoom.jid).toBe('test-ops@conference.wargame.local');
    expect(xmppRoom.info.identity.name).toBe('Test Operations Center');
  });

  test('Round-trip XMPP → REST → XMPP preserves core fields', () => {
    const rest = xmppRoomToRest(mockXmppRoom, MOCK_CONFERENCE);
    const roundTrip = restRoomToXmpp(rest, MOCK_CONFERENCE);

    expect(roundTrip.jid).toBe(mockXmppRoom.jid);
    expect(roundTrip.info.identity.name).toBe(mockXmppRoom.info.identity.name);
  });
});

// ============================================================================
// T007: Group/Force Transformer Tests
// ============================================================================

describe('Group/Force Transformers', () => {
  const mockForce= {
    id: 'force-red',
    name: 'Red Force',
    description: 'Opposing force',
    color: '#D32F2F',
    members: ['commander.red@wargame.local', 'analyst.red1@wargame.local'],
    commander: 'commander.red@wargame.local',
    metadata: { designation: 'OPFOR' },
    createdAt: '2025-01-15T08:00:00.000Z',
    createdBy: 'gamemaster@wargame.local',
  };

  test('forceToRestGroup() creates group with member usernames', () => {
    const members = ['commander.red', 'analyst.red1'];
    const group = forceToRestGroup(mockForce, members);

    expect(group.name).toBe('force-red');
    expect(group.description).toBe('Red Force');
    expect(group.members).toEqual(members);
  });

  test('deriveRestGroupsFromRoster() extracts groups from users', () => {
    const users= [
      {
        jid: 'user1@domain',
        bare_jid: 'user1@domain',
        name: 'User 1',
        subscription: 'both' as const,
        groups: ['Red Force', 'Commanders'],
      },
      {
        jid: 'user2@domain',
        bare_jid: 'user2@domain',
        name: 'User 2',
        subscription: 'both' as const,
        groups: ['Red Force', 'Analysts'],
      },
    ];

    const groups = deriveRestGroupsFromRoster(users);

    expect(groups.length).toBe(3); // Red Force, Commanders, Analysts
    
    const redForce = groups.find(g => g.name === 'Red Force');
    expect(redForce?.members).toContain('user1');
    expect(redForce?.members).toContain('user2');
    
    const commanders = groups.find(g => g.name === 'Commanders');
    expect(commanders?.members).toEqual(['user1']);
  });
});

// ============================================================================
// T008: JID Parsing Utility Tests
// ============================================================================

describe('JID Helper Utilities', () => {
  test('extractUsername() parses username from bare JID', () => {
    expect(extractUsername('commander.red@wargame.local')).toBe('commander.red');
    expect(extractUsername('user@domain')).toBe('user');
  });

  test('extractUsername() parses username from full JID with resource', () => {
    expect(extractUsername('user@domain/resource')).toBe('user');
  });

  test('buildBareJid() constructs valid JID', () => {
    expect(buildBareJid('analyst.blue1', 'wargame.local')).toBe('analyst.blue1@wargame.local');
  });

  test('extractRoomName() parses room name from MUC JID', () => {
    expect(extractRoomName('red-command@conference.wargame.local')).toBe('red-command');
  });

  test('buildRoomJid() constructs valid room JID', () => {
    expect(buildRoomJid('all-hands', 'conference.wargame.local')).toBe(
      'all-hands@conference.wargame.local'
    );
  });
});
