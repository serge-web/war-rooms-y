/**
 * RESTAdapter Unit Tests
 */

import { RESTAdapter } from '../rest-adapter';
import { createStorage } from '../../storage';
import type { Storage } from '../../storage';
import type { UnifiedRoom, UnifiedUser, OpenFireRoom } from '@war-rooms/backend-interface';
import {
  TEST_DOMAIN,
  TEST_CONFERENCE,
  seedTestWargame,
  createTestUser,
  createTestRoom,
  createTestForce,
} from '../test-fixtures';

describe('RESTAdapter', () => {
  let storage: Storage;
  let adapter: RESTAdapter;

  beforeEach(async () => {
    // Create fresh in-memory storage for each test
    storage = createStorage({
      backend: 'memory',
      namespace: 'test',
    });

    adapter = new RESTAdapter(storage, TEST_DOMAIN, TEST_CONFERENCE);

    // Seed the test wargame scenario
    await seedTestWargame(storage);
  });

  describe('Room Operations', () => {
    describe('getRoom', () => {
      it('should get room in REST format', async () => {
        const room = await adapter.getRoom('all-hands');
        expect(room).toBeDefined();
        expect(room?.roomName).toBe('all-hands');
        expect(room?.naturalName).toBe('All Hands');
        expect(room?.description).toBe('Main coordination room for all participants');
        expect(room?.publicRoom).toBe(true);
        expect(room?.membersOnly).toBe(false);
        expect(room?.persistent).toBe(true);
      });

      it('should convert individual members to JIDs', async () => {
        const room = await adapter.getRoom('intel-room');
        expect(room?.members).toEqual([
          `analyst.red1@${TEST_DOMAIN}`,
          `analyst.blue1@${TEST_DOMAIN}`,
          `gamemaster@${TEST_DOMAIN}`,
        ]);
      });

      it('should include timestamps', async () => {
        const room = await adapter.getRoom('red-command');
        expect(room?.creationDate).toBe('2024-01-01T00:00:00Z');
        expect(room?.modificationDate).toBeUndefined();
      });

      it('should return null for non-existent room', async () => {
        const room = await adapter.getRoom('non-existent');
        expect(room).toBeNull();
      });
    });

    describe('getAllRooms', () => {
      it('should return all rooms', async () => {
        const rooms = await adapter.getAllRooms();
        expect(rooms).toHaveLength(4);
        const roomNames = rooms.map(r => r.roomName).sort();
        expect(roomNames).toEqual([
          'all-hands',
          'intel-room',
          'planning',
          'red-command',
        ]);
      });
    });

    describe('createRoom', () => {
      it('should create a new room', async () => {
        const newRoom: OpenFireRoom = {
          roomName: 'new-room',
          naturalName: 'New Room',
          description: 'Test room',
          persistent: true,
          publicRoom: false,
          membersOnly: true,
          maxUsers: 25,
          members: [`test.user@${TEST_DOMAIN}`],
        };

        const created = await adapter.createRoom(newRoom);
        expect(created.roomName).toBe('new-room');
        expect(created.naturalName).toBe('New Room');
        expect(created.members).toEqual([`test.user@${TEST_DOMAIN}`]);

        // Verify stored in unified format
        const unified = await storage.getItem<UnifiedRoom>('entities/rooms/new-room');
        expect(unified).toBeDefined();
        expect(unified?.id).toBe('new-room');
        expect(unified?.jid).toBe(`new-room@${TEST_CONFERENCE}`);
        expect(unified?.name).toBe('New Room');
        expect(unified?.xmpp.maxUsers).toBe(25);
        expect(unified?.wargaming.individualMembers).toEqual(['test.user']);
      });

      it('should update room index', async () => {
        await adapter.createRoom({
          roomName: 'indexed-room',
          naturalName: 'Indexed',
        });

        const index = await storage.getItem<string[]>('entities/rooms/_index');
        expect(index).toContain('indexed-room');
      });

      it('should handle defaults correctly', async () => {
        const created = await adapter.createRoom({
          roomName: 'minimal',
          naturalName: 'Minimal Room',
        });

        expect(created.persistent).toBe(true);
        expect(created.publicRoom).toBe(false);
        expect(created.membersOnly).toBe(true);
        expect(created.moderated).toBe(false);
        expect(created.members).toEqual([]);
      });
    });

    describe('updateRoom', () => {
      it('should update room fields', async () => {
        const updated = await adapter.updateRoom('red-command', {
          naturalName: 'Updated Red Command',
          description: 'New description',
          maxUsers: 75,
          publicRoom: true,
        });

        expect(updated?.naturalName).toBe('Updated Red Command');
        expect(updated?.description).toBe('New description');
        expect(updated?.maxUsers).toBe(75);
        expect(updated?.publicRoom).toBe(true);

        // Verify unified storage updated
        const unified = await storage.getItem<UnifiedRoom>('entities/rooms/red-command');
        expect(unified?.name).toBe('Updated Red Command');
        expect(unified?.description).toBe('New description');
        expect(unified?.xmpp.maxUsers).toBe(75);
        expect(unified?.xmpp.publicRoom).toBe(true);
      });

      it('should update members list', async () => {
        const updated = await adapter.updateRoom('intel-room', {
          members: [`commander.red@${TEST_DOMAIN}`, `commander.blue@${TEST_DOMAIN}`],
        });

        expect(updated?.members).toEqual([
          `commander.red@${TEST_DOMAIN}`,
          `commander.blue@${TEST_DOMAIN}`,
        ]);

        const unified = await storage.getItem<UnifiedRoom>('entities/rooms/intel-room');
        expect(unified?.wargaming.individualMembers).toEqual(['commander.red', 'commander.blue']);
      });

      it('should set modification timestamp', async () => {
        const before = Date.now();
        await adapter.updateRoom('all-hands', { description: 'Updated' });
        const after = Date.now();

        const room = await adapter.getRoom('all-hands');
        expect(room?.modificationDate).toBeDefined();
        const modTime = new Date(room!.modificationDate!).getTime();
        expect(modTime).toBeGreaterThanOrEqual(before);
        expect(modTime).toBeLessThanOrEqual(after);
      });

      it('should return null for non-existent room', async () => {
        const updated = await adapter.updateRoom('non-existent', { naturalName: 'Test' });
        expect(updated).toBeNull();
      });
    });

    describe('deleteRoom', () => {
      it('should delete room from storage', async () => {
        await adapter.deleteRoom('planning');
        const room = await adapter.getRoom('planning');
        expect(room).toBeNull();
      });

      it('should update room index', async () => {
        await adapter.deleteRoom('planning');
        const index = await storage.getItem<string[]>('entities/rooms/_index');
        expect(index).not.toContain('planning');
      });
    });
  });

  describe('User Operations', () => {
    describe('getUser', () => {
      it('should get user in REST format', async () => {
        const user = await adapter.getUser('commander.red');
        expect(user).toBeDefined();
        expect(user?.username).toBe('commander.red');
        expect(user?.name).toBe('Red Commander');
        expect(user?.email).toBe('red.commander@test.local');
        expect(user?.properties?.sharedGroups).toEqual(['force-red']);
      });

      it('should never return password', async () => {
        const user = await adapter.getUser('commander.red');
        expect(user?.password).toBeUndefined();
        expect('password' in (user || {})).toBe(false);
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
        const usernames = users.map(u => u.username).sort();
        expect(usernames).toEqual([
          'analyst.blue1',
          'analyst.red1',
          'commander.blue',
          'commander.red',
          'gamemaster',
        ]);
      });

      it('should never include passwords', async () => {
        const users = await adapter.getAllUsers();
        users.forEach(user => {
          expect(user.password).toBeUndefined();
          expect('password' in user).toBe(false);
        });
      });
    });

    describe('createUser', () => {
      it('should create a new user', async () => {
        const newUser = {
          username: 'test.user',
          name: 'Test User',
          email: 'test@example.com',
          password: 'secret123',
          properties: {
            sharedGroups: ['force-red', 'Game Masters'],
          },
        };

        const created = await adapter.createUser(newUser);
        expect(created.username).toBe('test.user');
        expect(created.name).toBe('Test User');
        expect(created.email).toBe('test@example.com');
        expect(created.properties?.sharedGroups).toEqual(['force-red', 'Game Masters']);
        expect(created.password).toBeUndefined();

        // Verify stored in unified format
        const unified = await storage.getItem<UnifiedUser>('entities/users/test.user');
        expect(unified).toBeDefined();
        expect(unified?.username).toBe('test.user');
        expect(unified?.groups).toEqual(['force-red', 'Game Masters']);
        expect(unified?.isGameMaster).toBe(true);
        expect(unified?.password).toBe('secret123'); // Password IS stored internally
      });

      it('should update user index', async () => {
        await adapter.createUser({
          username: 'indexed.user',
          name: 'Indexed User',
        });

        const index = await storage.getItem<string[]>('entities/users/_index');
        expect(index).toContain('indexed.user');
      });

      it('should detect game masters', async () => {
        await adapter.createUser({
          username: 'new.gm',
          properties: { sharedGroups: ['Game Masters'] },
        });

        const unified = await storage.getItem<UnifiedUser>('entities/users/new.gm');
        expect(unified?.isGameMaster).toBe(true);
      });
    });
  });

  describe('Group Operations', () => {
    describe('getGroup', () => {
      it('should get force as group', async () => {
        const group = await adapter.getGroup('force-red');
        expect(group).toBeDefined();
        expect(group?.name).toBe('force-red');
        expect(group?.description).toBe('Opposing force in exercise');
        expect(group?.members).toEqual(['commander.red', 'analyst.red1']);
        expect(group?.admins).toEqual(['commander.red']);
      });

      it('should return null for non-existent group', async () => {
        const group = await adapter.getGroup('non-existent');
        expect(group).toBeNull();
      });
    });

    describe('getAllGroups', () => {
      it('should return all forces as groups', async () => {
        const groups = await adapter.getAllGroups();
        expect(groups.length).toBeGreaterThanOrEqual(2); // Forces + Game Masters

        const forceGroups = groups.filter(g => g.name.startsWith('force-'));
        expect(forceGroups).toHaveLength(2);
      });

      it('should include Game Masters group', async () => {
        const groups = await adapter.getAllGroups();
        const gmGroup = groups.find(g => g.name === 'Game Masters');
        expect(gmGroup).toBeDefined();
        expect(gmGroup?.description).toBe('Game administrators');
        expect(gmGroup?.members).toEqual(['gamemaster']);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle room with no members', async () => {
      const room = createTestRoom('empty-room', {
        wargaming: { type: 'standard' },
      });
      await storage.setItem('entities/rooms/empty-room', room);

      const restRoom = await adapter.getRoom('empty-room');
      expect(restRoom?.members).toEqual([]);
    });

    it('should handle user with no groups', async () => {
      const user = createTestUser('no-groups');
      await storage.setItem('entities/users/no-groups', user);

      const restUser = await adapter.getUser('no-groups');
      expect(restUser?.properties?.sharedGroups).toEqual([]);
    });

    it('should handle force with no members', async () => {
      const force = createTestForce('empty-force', []);
      await storage.setItem('entities/forces/empty-force', force);

      const group = await adapter.getGroup('empty-force');
      expect(group?.members).toEqual([]);
    });

    it('should extract username from JID correctly', async () => {
      await adapter.createRoom({
        roomName: 'jid-test',
        naturalName: 'JID Test',
        members: [
          `user1@${TEST_DOMAIN}`,
          `user2@${TEST_DOMAIN}/resource`,
          'user3', // Should handle plain username
        ],
      });

      const unified = await storage.getItem<UnifiedRoom>('entities/rooms/jid-test');
      expect(unified?.wargaming.individualMembers).toEqual(['user1', 'user2', 'user3']);
    });
  });
});