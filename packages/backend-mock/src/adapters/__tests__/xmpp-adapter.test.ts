/**
 * XMPPAdapter Unit Tests
 */

import { XMPPAdapter } from '../xmpp-adapter';
import { createStorage } from '../../storage';
import type { Storage } from '../../storage';
import type { UnifiedRoom } from '@war-rooms/backend-interface';
import { MOCK_DOMAIN, MOCK_CONFERENCE } from '../../fixtures';
import { seedTestWargame, createTestUser, createTestRoom } from '../test-fixtures';

describe('XMPPAdapter', () => {
  let storage: Storage;
  let adapter: XMPPAdapter;

  beforeEach(async () => {
    // Create fresh in-memory storage for each test
    storage = createStorage({
      backend: 'memory',
      namespace: 'test',
    });

    adapter = new XMPPAdapter(storage, MOCK_DOMAIN);

    // Seed the test wargame scenario
    await seedTestWargame(storage);
  });

  describe('Room Operations', () => {
    describe('getRoom', () => {
      it('should get room in XMPP format', async () => {
        const room = await adapter.getRoom('all-hands');
        expect(room).toBeDefined();
        expect(room?.jid).toBe(`all-hands@${MOCK_CONFERENCE}`);
        expect(room?.info.identity.name).toBe('All Hands');
        expect(room?.info.x?.['muc#roomconfig_publicroom']).toBe(true);
        expect(room?.info.x?.['muc#roomconfig_membersonly']).toBe(false);
      });

      it('should include room features', async () => {
        const room = await adapter.getRoom('all-hands');
        expect(room?.info.features).toContain('http://jabber.org/protocol/muc');
        expect(room?.info.features).toContain('muc_persistent');
        expect(room?.info.features).toContain('muc_public');
      });

      it('should convert individual members to JIDs', async () => {
        const room = await adapter.getRoom('intel-room');
        expect(room?.info.x?.['muc#roomconfig_members']).toEqual([
          `analyst.red1@${MOCK_DOMAIN}`,
          `analyst.blue1@${MOCK_DOMAIN}`,
          `gamemaster@${MOCK_DOMAIN}`,
        ]);
      });

      it('should include password fields when set', async () => {
        const room = await adapter.getRoom('red-command');
        expect(room?.info.x?.['muc#roomconfig_passwordprotectedroom']).toBe(true);
        expect(room?.info.x?.['muc#roomconfig_roomsecret']).toBe('redsecret');
        expect(room?.info.features).toContain('muc_passwordprotected');
      });

      it('should return null for non-existent room', async () => {
        const room = await adapter.getRoom('non-existent');
        expect(room).toBeNull();
      });
    });

    describe('getUserRooms', () => {
      it('should return public rooms for any user', async () => {
        const rooms = await adapter.getUserRooms(`commander.red@${MOCK_DOMAIN}`);
        const publicRoom = rooms.find((r) => r.jid === `all-hands@${MOCK_CONFERENCE}`);
        expect(publicRoom).toBeDefined();
        expect(publicRoom?.info.identity.name).toBe('All Hands');
      });

      it('should return group-restricted rooms for group members', async () => {
        const rooms = await adapter.getUserRooms(`commander.red@${MOCK_DOMAIN}`);
        const redCommand = rooms.find((r) => r.jid === `red-command@${MOCK_CONFERENCE}`);
        expect(redCommand).toBeDefined();
        expect(redCommand?.info.identity.name).toBe('Red Command Center');
      });

      it('should not return group-restricted rooms for non-members', async () => {
        const rooms = await adapter.getUserRooms(`commander.blue@${MOCK_DOMAIN}`);
        const redCommand = rooms.find((r) => r.jid === `red-command@${MOCK_CONFERENCE}`);
        expect(redCommand).toBeUndefined();
      });

      it('should return rooms with individual membership', async () => {
        const rooms = await adapter.getUserRooms(`analyst.red1@${MOCK_DOMAIN}`);
        const intelRoom = rooms.find((r) => r.jid === `intel-room@${MOCK_CONFERENCE}`);
        expect(intelRoom).toBeDefined();
        expect(intelRoom?.info.identity.name).toBe('Intelligence Room');
      });

      it('should handle mixed access (group + individual)', async () => {
        // Blue commander should see planning (force-blue group)
        const blueRooms = await adapter.getUserRooms(`commander.blue@${MOCK_DOMAIN}`);
        const bluePlanning = blueRooms.find((r) => r.jid === `planning@${MOCK_CONFERENCE}`);
        expect(bluePlanning).toBeDefined();

        // Gamemaster should see planning (individual member)
        const gmRooms = await adapter.getUserRooms(`gamemaster@${MOCK_DOMAIN}`);
        const gmPlanning = gmRooms.find((r) => r.jid === `planning@${MOCK_CONFERENCE}`);
        expect(gmPlanning).toBeDefined();

        // Red commander should NOT see planning
        const redRooms = await adapter.getUserRooms(`commander.red@${MOCK_DOMAIN}`);
        const redPlanning = redRooms.find((r) => r.jid === `planning@${MOCK_CONFERENCE}`);
        expect(redPlanning).toBeUndefined();
      });

      it('should return empty array for non-existent user', async () => {
        const rooms = await adapter.getUserRooms(`unknown@${MOCK_DOMAIN}`);
        expect(rooms).toEqual([]);
      });
    });

    describe('getAllRooms', () => {
      it('should return all rooms', async () => {
        const rooms = await adapter.getAllRooms();
        expect(rooms).toHaveLength(4);
        const roomNames = rooms.map((r) => r.info.identity.name).sort();
        expect(roomNames).toEqual([
          'All Hands',
          'Intelligence Room',
          'Joint Planning',
          'Red Command Center',
        ]);
      });
    });

    describe('updateRoomMembers', () => {
      it('should update individual members list', async () => {
        await adapter.updateRoomMembers('intel-room', ['commander.red', 'commander.blue']);

        const room = await adapter.getRoom('intel-room');
        expect(room?.info.x?.['muc#roomconfig_members']).toEqual([
          `commander.red@${MOCK_DOMAIN}`,
          `commander.blue@${MOCK_DOMAIN}`,
        ]);
      });

      it('should handle empty members list', async () => {
        await adapter.updateRoomMembers('intel-room', []);

        const room = await adapter.getRoom('intel-room');
        expect(room?.info.x?.['muc#roomconfig_members']).toEqual([]);
      });

      it('should update modification timestamp', async () => {
        const before = Date.now();
        await adapter.updateRoomMembers('intel-room', ['gamemaster']);
        const after = Date.now();

        const unified = await storage.getItem<UnifiedRoom>('entities/rooms/intel-room');
        expect(unified?.modifiedAt).toBeDefined();
        const modTime = new Date(unified!.modifiedAt!).getTime();
        expect(modTime).toBeGreaterThanOrEqual(before);
        expect(modTime).toBeLessThanOrEqual(after);
      });

      it('should not fail for non-existent room', async () => {
        await expect(adapter.updateRoomMembers('non-existent', ['user1'])).resolves.not.toThrow();
      });
    });
  });

  describe('User Operations', () => {
    describe('getUser', () => {
      it('should get user in XMPP format', async () => {
        const user = await adapter.getUser('commander.red');
        expect(user).toBeDefined();
        expect(user?.bare_jid).toBe(`commander.red@${MOCK_DOMAIN}`);
        expect(user?.jid).toBe(`commander.red@${MOCK_DOMAIN}/resource`);
        expect(user?.name).toBe('Red Commander');
        expect(user?.groups).toEqual(['force-red']);
      });

      it('should include vCard data', async () => {
        const user = await adapter.getUser('commander.red');
        expect(user?.vcard).toBeDefined();
        expect(user?.vcard?.fn).toBe('Red Commander');
        expect(user?.vcard?.nickname).toBe('RedCmd');
        expect(user?.vcard?.title).toBe('Force Commander');
        expect(user?.vcard?.org).toBe('Red Force');
      });

      it('should default to bare JID when full JID not set', async () => {
        const newUser = createTestUser('test.user');
        await storage.setItem('entities/users/test.user', newUser);

        const user = await adapter.getUser('test.user');
        expect(user?.jid).toBe(`test.user@${MOCK_DOMAIN}`);
        expect(user?.bare_jid).toBe(`test.user@${MOCK_DOMAIN}`);
      });

      it('should return null for non-existent user', async () => {
        const user = await adapter.getUser('non-existent');
        expect(user).toBeNull();
      });
    });

    describe('getAllUsers', () => {
      it('should return all users', async () => {
        const users = await adapter.getAllUsers();
        expect(users).toHaveLength(5);
        const usernames = users.map((u) => u.bare_jid.split('@')[0]).sort();
        expect(usernames).toEqual([
          'analyst.blue1',
          'analyst.red1',
          'commander.blue',
          'commander.red',
          'gamemaster',
        ]);
      });

      it('should set subscription to both for all users', async () => {
        const users = await adapter.getAllUsers();
        users.forEach((user) => {
          expect(user.subscription).toBe('both');
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle room with no wargaming extensions', async () => {
      const minimalRoom = createTestRoom('minimal', {
        wargaming: {
          type: 'standard',
          // No restrictions or members
        },
      });
      await storage.setItem('entities/rooms/minimal', minimalRoom);

      const room = await adapter.getRoom('minimal');
      expect(room).toBeDefined();
      expect(room?.info.x?.['muc#roomconfig_members']).toEqual([]);
    });

    it('should handle user with no groups', async () => {
      const loneUser = createTestUser('lone.wolf', []);
      await storage.setItem('entities/users/lone.wolf', loneUser);

      const user = await adapter.getUser('lone.wolf');
      expect(user?.groups).toEqual([]);

      const rooms = await adapter.getUserRooms(`lone.wolf@${MOCK_DOMAIN}`);
      // Should only see public rooms
      expect(rooms).toHaveLength(1);
      expect(rooms[0]?.jid).toBe(`all-hands@${MOCK_CONFERENCE}`);
    });

    it('should handle empty storage gracefully', async () => {
      // Clear all data
      await storage.clear();

      const rooms = await adapter.getAllRooms();
      expect(rooms).toEqual([]);

      const users = await adapter.getAllUsers();
      expect(users).toEqual([]);

      const room = await adapter.getRoom('any');
      expect(room).toBeNull();

      const user = await adapter.getUser('any');
      expect(user).toBeNull();
    });
  });
});
