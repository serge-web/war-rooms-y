/**
 * Unified Seeding Tests (TDD)
 * Tests for XMPP → REST seeding functions
 */

import { createStorage } from '../storage';
import {
  seedRestUsers,
  seedRestGroups,
  seedRestRooms,
  seedAll,
} from '../seed';

const TEST_NAMESPACE = 'test-seed';
const MOCK_DOMAIN = 'wargame.local';
const MOCK_CONFERENCE = `conference.${MOCK_DOMAIN}`;

describe('Unified Seeding - REST from XMPP', () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(async () => {
    storage = createStorage({ backend: 'memory', namespace: TEST_NAMESPACE });
    await storage.clear();
  });

  // ============================================================================
  // T016: seedRestUsers() Test
  // ============================================================================

  describe('seedRestUsers()', () => {
    test('transforms XMPP users to REST users in storage', async () => {
      // Seed with minimal XMPP users
      const mockXmppUsers = [
        {
          jid: 'user1@wargame.local',
          bare_jid: 'user1@wargame.local',
          name: 'User One',
          subscription: 'both' as const,
          groups: ['Red Force'],
          vcard: {
            fn: 'User One',
            email: 'user1@test.com',
          },
        },
        {
          jid: 'user2@wargame.local',
          bare_jid: 'user2@wargame.local',
          name: 'User Two',
          subscription: 'both' as const,
          groups: ['Blue Force'],
        },
      ];

      // Seed XMPP users first
      for (const user of mockXmppUsers) {
        await storage.setItem(`roster/${user.bare_jid}`, user);
      }

      // Execute seedRestUsers
      await seedRestUsers(storage, MOCK_DOMAIN);

      // Verify REST users created
      const restUser1 = await storage.getItem<any>('rest:user:user1');
      expect(restUser1).toBeDefined();
      expect(restUser1?.username).toBe('user1');
      expect(restUser1?.name).toBe('User One');
      expect(restUser1?.email).toBe('user1@test.com');
      expect(restUser1?.properties?.sharedGroups).toEqual(['Red Force']);

      const restUser2 = await storage.getItem<any>('rest:user:user2');
      expect(restUser2).toBeDefined();
      expect(restUser2?.username).toBe('user2');
      expect(restUser2?.properties?.sharedGroups).toEqual(['Blue Force']);

      // Verify user list index
      const userList = await storage.getItem<any>('rest:users:list');
      expect(userList).toContain('user1');
      expect(userList).toContain('user2');
    });

    test('handles empty roster gracefully', async () => {
      await seedRestUsers(storage, MOCK_DOMAIN);

      const userList = await storage.getItem<any>('rest:users:list');
      expect(userList).toEqual([]);
    });
  });

  // ============================================================================
  // T017: seedRestGroups() Test
  // ============================================================================

  describe('seedRestGroups()', () => {
    test('derives groups from XMPP roster memberships', async () => {
      // Seed XMPP users with groups
      const mockXmppUsers = [
        {
          jid: 'user1@wargame.local',
          bare_jid: 'user1@wargame.local',
          name: 'User 1',
          subscription: 'both' as const,
          groups: ['Red Force', 'Commanders'],
        },
        {
          jid: 'user2@wargame.local',
          bare_jid: 'user2@wargame.local',
          name: 'User 2',
          subscription: 'both' as const,
          groups: ['Red Force', 'Analysts'],
        },
        {
          jid: 'user3@wargame.local',
          bare_jid: 'user3@wargame.local',
          name: 'User 3',
          subscription: 'both' as const,
          groups: ['Blue Force'],
        },
      ];

      for (const user of mockXmppUsers) {
        await storage.setItem(`roster/${user.bare_jid}`, user);
      }

      // Execute seedRestGroups
      await seedRestGroups(storage, MOCK_DOMAIN);

      // Verify Red Force group
      const redForce = await storage.getItem<any>('rest:group:Red Force');
      expect(redForce).toBeDefined();
      expect(redForce?.name).toBe('Red Force');
      expect(redForce?.members).toContain('user1');
      expect(redForce?.members).toContain('user2');
      expect(redForce?.members?.length).toBe(2);

      // Verify Commanders group
      const commanders = await storage.getItem<any>('rest:group:Commanders');
      expect(commanders?.members).toEqual(['user1']);

      // Verify group list index
      const groupList = await storage.getItem<any>('rest:groups:list');
      expect(groupList).toContain('Red Force');
      expect(groupList).toContain('Blue Force');
      expect(groupList).toContain('Commanders');
      expect(groupList).toContain('Analysts');
    });

    test('handles users with no groups', async () => {
      const userWithNoGroups= {
        jid: 'solo@wargame.local',
        bare_jid: 'solo@wargame.local',
        name: 'Solo User',
        subscription: 'both' as const,
        groups: [],
      };

      await storage.setItem(`roster/${userWithNoGroups.bare_jid}`, userWithNoGroups);
      await seedRestGroups(storage, MOCK_DOMAIN);

      const groupList = await storage.getItem<any>('rest:groups:list');
      expect(groupList).toEqual([]);
    });
  });

  // ============================================================================
  // T018: seedRestRooms() Test
  // ============================================================================

  describe('seedRestRooms()', () => {
    test('transforms XMPP rooms to REST rooms in storage', async () => {
      // Seed XMPP rooms
      const mockXmppRooms = [
        {
          jid: 'red-command@conference.wargame.local',
          info: {
            identity: {
              category: 'conference',
              type: 'text',
              name: 'Red Force Command',
            },
            features: ['http://jabber.org/protocol/muc'],
            x: {
              'muc#roomconfig_persistentroom': true,
              'muc#roomconfig_membersonly': true,
              'muc#roomconfig_publicroom': false,
              description: 'Command center for Red Force',
            },
          },
        },
        {
          jid: 'all-hands@conference.wargame.local',
          info: {
            identity: {
              category: 'conference',
              type: 'text',
              name: 'All Hands',
            },
            features: ['http://jabber.org/protocol/muc'],
          },
        },
      ];

      for (const room of mockXmppRooms) {
        await storage.setItem(`rooms/${room.jid}`, room);
      }

      // Execute seedRestRooms
      await seedRestRooms(storage, MOCK_CONFERENCE);

      // Verify red-command room
      const redCommand = await storage.getItem<any>('rest:room:red-command');
      expect(redCommand).toBeDefined();
      expect(redCommand?.roomName).toBe('red-command');
      expect(redCommand?.naturalName).toBe('Red Force Command');
      expect(redCommand?.description).toBe('Command center for Red Force');
      expect(redCommand?.persistent).toBe(true);
      expect(redCommand?.membersOnly).toBe(true);
      expect(redCommand?.publicRoom).toBe(false);

      // Verify all-hands room
      const allHands = await storage.getItem<any>('rest:room:all-hands');
      expect(allHands?.roomName).toBe('all-hands');
      expect(allHands?.naturalName).toBe('All Hands');

      // Verify room list index
      const roomList = await storage.getItem<any>('rest:rooms:list');
      expect(roomList).toContain('red-command');
      expect(roomList).toContain('all-hands');
    });
  });

  // ============================================================================
  // T019: seedAll() Integration Test
  // ============================================================================

  describe('seedAll() with rest: true', () => {
    test('seeds both XMPP and REST representations', async () => {
      // Execute unified seeding
      await seedAll(storage, {
        domain: MOCK_DOMAIN,
        conferenceService: MOCK_CONFERENCE,
        rest: true,
      });

      // Verify XMPP entities exist
      const xmppUserKeys = await storage.keys('roster/');
      expect(xmppUserKeys.length).toBeGreaterThan(0);

      const xmppRoomKeys = await storage.keys('rooms/');
      expect(xmppRoomKeys.length).toBeGreaterThan(0);

      // Verify REST entities exist
      const restUserKeys = await storage.keys('rest:user:');
      expect(restUserKeys.length).toBeGreaterThan(0);

      const restGroupKeys = await storage.keys('rest:group:');
      expect(restGroupKeys.length).toBeGreaterThan(0);

      const restRoomKeys = await storage.keys('rest:room:');
      expect(restRoomKeys.length).toBeGreaterThan(0);

      // Verify user count matches
      expect(restUserKeys.length).toBe(xmppUserKeys.length);

      // Verify specific user exists in both formats
      const xmppUsers = await storage.getAll<any>('roster/');
      const firstUserJid = Object.keys(xmppUsers)[0];
      if (firstUserJid) {
        const firstUser = xmppUsers[firstUserJid];
        if (firstUser) {
          const username = firstUser.bare_jid.split('@')[0];
          const restUser = await storage.getItem<any>(`rest:user:${username}`);
          expect(restUser).toBeDefined();
          expect(restUser?.username).toBe(username);
        }
      }
    });

    test('does not seed REST entities when rest: false', async () => {
      await seedAll(storage, {
        domain: MOCK_DOMAIN,
        conferenceService: MOCK_CONFERENCE,
        rest: false,
      });

      // Verify XMPP entities exist
      const xmppUserKeys = await storage.keys('roster/');
      expect(xmppUserKeys.length).toBeGreaterThan(0);

      // Verify REST entities do NOT exist
      const restUserKeys = await storage.keys('rest:user:');
      expect(restUserKeys.length).toBe(0);

      const restGroupKeys = await storage.keys('rest:group:');
      expect(restGroupKeys.length).toBe(0);

      const restRoomKeys = await storage.keys('rest:room:');
      expect(restRoomKeys.length).toBe(0);
    });
  });
});
