/**
 * User CRUD Operations Tests
 * Tests admin panel user management via REST API
 */

// @ts-nocheck
import { createStorage, MockOpenFireAPI, seedRestUsers } from '@war-rooms/backend-mock';

describe('Admin User CRUD Operations', () => {
  let storage: ReturnType<typeof createStorage>;
  let api: MockOpenFireAPI;

  beforeEach(async () => {
    storage = createStorage({
      backend: 'memory',
      namespace: 'admin-test-users',
    });
    api = new MockOpenFireAPI(storage);

    // Seed default admin users
    await seedRestUsers(storage);
  });

  describe('User Creation', () => {
    it('should create a new user', async () => {
      const newUser = {
        username: 'testuser1',
        name: 'Test User One',
        email: 'testuser1@wargame.local',
        password: 'testpass123',
      };

      await api.createUser(newUser);

      const user = await api.getUser('testuser1');
      expect(user.username).toBe('testuser1');
      expect(user.name).toBe('Test User One');
      expect(user.email).toBe('testuser1@wargame.local');
    });

    it('should reject duplicate usernames', async () => {
      const user = {
        username: 'duplicate',
        name: 'Duplicate User',
        email: 'dup@test.local',
        password: 'pass',
      };

      await api.createUser(user);

      await expect(async () => {
        await api.createUser(user);
      }).rejects.toThrow();
    });

    it('should create user with shared groups', async () => {
      // Create test group
      await api.createGroup({
        name: 'TestForce',
        description: 'Test force',
        members: [],
        admins: [],
      });

      const user = {
        username: 'groupuser',
        name: 'Group User',
        email: 'group@test.local',
        password: 'pass',
        properties: {
          sharedGroups: ['TestForce'],
        },
      };

      await api.createUser(user);

      const retrievedUser = await api.getUser('groupuser');
      expect(retrievedUser.properties?.sharedGroups).toContain('TestForce');

      // Verify bidirectional relationship
      const group = await api.getGroup('TestForce');
      expect(group.members).toContain('groupuser');
    });
  });

  describe('User Retrieval', () => {
    beforeEach(async () => {
      await api.createUser({
        username: 'user1',
        name: 'User One',
        email: 'user1@test.local',
        password: 'pass1',
      });
      await api.createUser({
        username: 'user2',
        name: 'User Two',
        email: 'user2@test.local',
        password: 'pass2',
      });
    });

    it('should list all users', async () => {
      const users = await api.getUsers();
      expect(users.length).toBeGreaterThanOrEqual(4); // 2 seeded + 2 created
      expect(users.some((u: any) => u.username === 'admin')).toBe(true);
      expect(users.some((u: any) => u.username === 'user1')).toBe(true);
      expect(users.some((u: any) => u.username === 'user2')).toBe(true);
    });

    it('should get user by username', async () => {
      const user = await api.getUser('user1');
      expect(user.username).toBe('user1');
      expect(user.name).toBe('User One');
      expect(user.email).toBe('user1@test.local');
    });

    it('should throw error for non-existent user', async () => {
      await expect(async () => {
        await api.getUser('nonexistent');
      }).rejects.toThrow('User not found');
    });
  });

  describe('User Update', () => {
    beforeEach(async () => {
      await api.createUser({
        username: 'updateuser',
        name: 'Original Name',
        email: 'original@test.local',
        password: 'pass',
      });
    });

    it('should update user name and email', async () => {
      await api.updateUser('updateuser', {
        name: 'Updated Name',
        email: 'updated@test.local',
      });

      const user = await api.getUser('updateuser');
      expect(user.name).toBe('Updated Name');
      expect(user.email).toBe('updated@test.local');
    });

    it('should update user password', async () => {
      await api.updateUser('updateuser', {
        password: 'newpassword123',
      });

      // Password is stored internally, just verify update doesn't throw
      const user = await api.getUser('updateuser');
      expect(user.username).toBe('updateuser');
    });

    it('should update user group membership', async () => {
      await api.createGroup({
        name: 'UpdateTestGroup',
        description: 'Test group for updates',
        members: [],
        admins: [],
      });

      await api.updateUser('updateuser', {
        properties: {
          sharedGroups: ['UpdateTestGroup'],
        },
      });

      const user = await api.getUser('updateuser');
      expect(user.properties?.sharedGroups).toContain('UpdateTestGroup');

      const group = await api.getGroup('UpdateTestGroup');
      expect(group.members).toContain('updateuser');
    });
  });

  describe('User Deletion', () => {
    beforeEach(async () => {
      await api.createUser({
        username: 'deleteuser',
        name: 'Delete User',
        email: 'delete@test.local',
        password: 'pass',
      });
    });

    it('should delete a user', async () => {
      await api.deleteUser('deleteuser');

      await expect(async () => {
        await api.getUser('deleteuser');
      }).rejects.toThrow('User not found');
    });

    it('should remove user from groups when deleted', async () => {
      await api.createGroup({
        name: 'DeleteTestGroup',
        description: 'Test group',
        members: [],
        admins: [],
      });

      await api.updateUser('deleteuser', {
        properties: {
          sharedGroups: ['DeleteTestGroup'],
        },
      });

      // Verify user is in group
      let group = await api.getGroup('DeleteTestGroup');
      expect(group.members).toContain('deleteuser');

      // Delete user
      await api.deleteUser('deleteuser');

      // Verify user removed from group
      group = await api.getGroup('DeleteTestGroup');
      expect(group.members).not.toContain('deleteuser');
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(async () => {
        await api.deleteUser('nonexistent');
      }).rejects.toThrow();
    });
  });

  describe('Seeded Admin Users', () => {
    it('should have admin user with admin group', async () => {
      const admin = await api.getUser('admin');
      expect(admin.username).toBe('admin');
      expect(admin.name).toBe('System Administrator');
      expect(admin.properties?.sharedGroups).toContain('admins');
    });

    it('should have gamemaster user with admin group', async () => {
      const gm = await api.getUser('gamemaster');
      expect(gm.username).toBe('gamemaster');
      expect(gm.name).toBe('Game Master');
      expect(gm.properties?.sharedGroups).toContain('admins');
    });

    it('should have admins group created', async () => {
      const adminsGroup = await api.getGroup('admins');
      expect(adminsGroup.name).toBe('admins');
      expect(adminsGroup.description).toBe('System administrators');
      expect(adminsGroup.members).toContain('admin');
      expect(adminsGroup.members).toContain('gamemaster');
    });
  });
});
