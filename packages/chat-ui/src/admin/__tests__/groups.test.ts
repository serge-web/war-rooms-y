/**
 * Group Membership Management Tests
 * Tests force/group membership operations via REST API + PubSub metadata
 */

// @ts-nocheck
import { createStorage, MockOpenFireAPI, MockPubSubMetadataREST as MockPubSubMetadata, seedTestWargame } from '@war-rooms/backend-mock';

describe('Group Membership Management', () => {
  let storage: ReturnType<typeof createStorage>;
  let api: MockOpenFireAPI;
  let pubsub: MockPubSubMetadata;

  beforeEach(async () => {
    storage = createStorage({
      backend: 'memory',
      namespace: 'admin-test-groups',
    });
    api = new MockOpenFireAPI(storage);
    pubsub = new MockPubSubMetadata(storage);

    // Seed unified test wargame data
    await seedTestWargame(storage);

    // Create additional test users
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
    await api.createUser({
      username: 'user3',
      name: 'User Three',
      email: 'user3@test.local',
      password: 'pass3',
    });
  });

  describe('Group Creation', () => {
    it('should create a basic group', async () => {
      await api.createGroup({
        name: 'TestForce',
        description: 'Test force description',
        members: [],
        admins: [],
      });

      const group = await api.getGroup('TestForce');
      expect(group.name).toBe('TestForce');
      expect(group.description).toBe('Test force description');
      expect(group.members).toEqual([]);
    });

    it('should create group with initial members', async () => {
      await api.createGroup({
        name: 'ForceWithMembers',
        description: 'Force with members',
        members: ['user1', 'user2'],
        admins: [],
      });

      const group = await api.getGroup('ForceWithMembers');
      expect(group.members).toContain('user1');
      expect(group.members).toContain('user2');

      // Verify bidirectional relationship
      const user1 = await api.getUser('user1');
      expect(user1.properties?.sharedGroups).toContain('ForceWithMembers');
    });

    it('should create group with metadata', async () => {
      await api.createGroup({
        name: 'MetaForce',
        description: 'Force with metadata',
        members: [],
        admins: [],
      });

      await pubsub.setForceMetadata('MetaForce', {
        description: 'Extended description',
        color: '#FF5722',
        icon: 'military-tech',
        objectives: ['Objective 1', 'Objective 2'],
      });

      const metadata = await pubsub.getForceMetadata('MetaForce');
      expect(metadata.color).toBe('#FF5722');
      expect(metadata.icon).toBe('military-tech');
      expect(metadata.objectives).toEqual(['Objective 1', 'Objective 2']);
    });
  });

  describe('Adding Members', () => {
    beforeEach(async () => {
      await api.createGroup({
        name: 'RedForce',
        description: 'Red Force',
        members: [],
        admins: [],
      });
    });

    it('should add a single member to group', async () => {
      const group = await api.getGroup('RedForce');
      await api.updateGroup('RedForce', {
        members: [...group.members, 'user1'],
      });

      const updatedGroup = await api.getGroup('RedForce');
      expect(updatedGroup.members).toContain('user1');

      const user = await api.getUser('user1');
      expect(user.properties?.sharedGroups).toContain('RedForce');
    });

    it('should add multiple members to group', async () => {
      const group = await api.getGroup('RedForce');
      await api.updateGroup('RedForce', {
        members: [...group.members, 'user1', 'user2', 'user3'],
      });

      const updatedGroup = await api.getGroup('RedForce');
      expect(updatedGroup.members).toContain('user1');
      expect(updatedGroup.members).toContain('user2');
      expect(updatedGroup.members).toContain('user3');
    });

    it('should maintain bidirectional user-group relationship', async () => {
      const group = await api.getGroup('RedForce');
      await api.updateGroup('RedForce', {
        members: [...group.members, 'user1'],
      });

      const user = await api.getUser('user1');
      expect(user.properties?.sharedGroups).toContain('RedForce');

      const updatedGroup = await api.getGroup('RedForce');
      expect(updatedGroup.members).toContain('user1');
    });

    it('should not duplicate members', async () => {
      const group = await api.getGroup('RedForce');
      await api.updateGroup('RedForce', {
        members: [...group.members, 'user1'],
      });

      const groupAfterFirst = await api.getGroup('RedForce');
      await api.updateGroup('RedForce', {
        members: [...groupAfterFirst.members, 'user1'],
      });

      const finalGroup = await api.getGroup('RedForce');
      const user1Count = finalGroup.members.filter((m: string) => m === 'user1').length;
      expect(user1Count).toBe(1);
    });
  });

  describe('Removing Members', () => {
    beforeEach(async () => {
      await api.createGroup({
        name: 'BlueForce',
        description: 'Blue Force',
        members: ['user1', 'user2', 'user3'],
        admins: [],
      });
    });

    it('should remove a single member from group', async () => {
      const group = await api.getGroup('BlueForce');
      await api.updateGroup('BlueForce', {
        members: group.members.filter((m: string) => m !== 'user2'),
      });

      const updatedGroup = await api.getGroup('BlueForce');
      expect(updatedGroup.members).not.toContain('user2');
      expect(updatedGroup.members).toContain('user1');
      expect(updatedGroup.members).toContain('user3');

      const user = await api.getUser('user2');
      expect(user.properties?.sharedGroups || []).not.toContain('BlueForce');
    });

    it('should remove multiple members from group', async () => {
      const group = await api.getGroup('BlueForce');
      await api.updateGroup('BlueForce', {
        members: group.members.filter((m: string) => !['user1', 'user2'].includes(m)),
      });

      const updatedGroup = await api.getGroup('BlueForce');
      expect(updatedGroup.members).not.toContain('user1');
      expect(updatedGroup.members).not.toContain('user2');
      expect(updatedGroup.members).toContain('user3');
    });

    it('should update user when removed from group', async () => {
      const group = await api.getGroup('BlueForce');
      await api.updateGroup('BlueForce', {
        members: group.members.filter((m: string) => m !== 'user1'),
      });

      const user = await api.getUser('user1');
      expect(user.properties?.sharedGroups || []).not.toContain('BlueForce');
    });

    it('should handle removing all members', async () => {
      await api.updateGroup('BlueForce', {
        members: [],
      });

      const group = await api.getGroup('BlueForce');
      expect(group.members).toEqual([]);

      // Verify all users updated
      const user1 = await api.getUser('user1');
      const user2 = await api.getUser('user2');
      const user3 = await api.getUser('user3');
      expect(user1.properties?.sharedGroups || []).not.toContain('BlueForce');
      expect(user2.properties?.sharedGroups || []).not.toContain('BlueForce');
      expect(user3.properties?.sharedGroups || []).not.toContain('BlueForce');
    });
  });

  describe('Multi-Group Membership', () => {
    beforeEach(async () => {
      await api.createGroup({
        name: 'Group1',
        description: 'First group',
        members: [],
        admins: [],
      });
      await api.createGroup({
        name: 'Group2',
        description: 'Second group',
        members: [],
        admins: [],
      });
      await api.createGroup({
        name: 'Group3',
        description: 'Third group',
        members: [],
        admins: [],
      });
    });

    it('should allow user in multiple groups', async () => {
      await api.updateGroup('Group1', { members: ['user1'] });
      await api.updateGroup('Group2', { members: ['user1'] });
      await api.updateGroup('Group3', { members: ['user1'] });

      const user = await api.getUser('user1');
      expect(user.properties?.sharedGroups).toContain('Group1');
      expect(user.properties?.sharedGroups).toContain('Group2');
      expect(user.properties?.sharedGroups).toContain('Group3');
    });

    it('should remove from one group without affecting others', async () => {
      await api.updateGroup('Group1', { members: ['user1'] });
      await api.updateGroup('Group2', { members: ['user1'] });
      await api.updateGroup('Group3', { members: ['user1'] });

      await api.updateGroup('Group2', { members: [] });

      const user = await api.getUser('user1');
      expect(user.properties?.sharedGroups).toContain('Group1');
      expect(user.properties?.sharedGroups).not.toContain('Group2');
      expect(user.properties?.sharedGroups).toContain('Group3');
    });
  });

  describe('Group Metadata with Membership', () => {
    beforeEach(async () => {
      await api.createGroup({
        name: 'ColoredForce',
        description: 'Force with color',
        members: ['user1'],
        admins: [],
      });
    });

    it('should maintain metadata when adding members', async () => {
      await pubsub.setForceMetadata('ColoredForce', {
        color: '#4CAF50',
        icon: 'shield',
        objectives: ['Hold position'],
      });

      const group = await api.getGroup('ColoredForce');
      await api.updateGroup('ColoredForce', {
        members: [...group.members, 'user2'],
      });

      const metadata = await pubsub.getForceMetadata('ColoredForce');
      expect(metadata.color).toBe('#4CAF50');
      expect(metadata.icon).toBe('shield');
      expect(metadata.objectives).toEqual(['Hold position']);
    });

    it('should maintain metadata when removing members', async () => {
      await pubsub.setForceMetadata('ColoredForce', {
        color: '#2196F3',
        icon: 'groups',
        objectives: ['Advance', 'Secure area'],
      });

      await api.updateGroup('ColoredForce', {
        members: [],
      });

      const metadata = await pubsub.getForceMetadata('ColoredForce');
      expect(metadata.color).toBe('#2196F3');
      expect(metadata.objectives).toEqual(['Advance', 'Secure area']);
    });

    it('should update metadata and members independently', async () => {
      // Set initial metadata
      await pubsub.setForceMetadata('ColoredForce', {
        color: '#FF9800',
        objectives: ['Initial objective'],
      });

      // Add member
      const group = await api.getGroup('ColoredForce');
      await api.updateGroup('ColoredForce', {
        members: [...group.members, 'user2'],
      });

      // Update metadata
      await pubsub.setForceMetadata('ColoredForce', {
        color: '#F44336',
        objectives: ['Updated objective'],
      });

      // Verify both updates
      const finalGroup = await api.getGroup('ColoredForce');
      const finalMetadata = await pubsub.getForceMetadata('ColoredForce');

      expect(finalGroup.members).toContain('user1');
      expect(finalGroup.members).toContain('user2');
      expect(finalMetadata.color).toBe('#F44336');
      expect(finalMetadata.objectives).toEqual(['Updated objective']);
    });
  });

  describe('Group Deletion with Members', () => {
    beforeEach(async () => {
      await api.createGroup({
        name: 'DeleteForce',
        description: 'To be deleted',
        members: ['user1', 'user2'],
        admins: [],
      });
    });

    it('should remove group from all members when deleted', async () => {
      await api.deleteGroup('DeleteForce');

      const user1 = await api.getUser('user1');
      const user2 = await api.getUser('user2');

      expect(user1.properties?.sharedGroups || []).not.toContain('DeleteForce');
      expect(user2.properties?.sharedGroups || []).not.toContain('DeleteForce');
    });

    it('should delete metadata when group deleted', async () => {
      await pubsub.setForceMetadata('DeleteForce', {
        color: '#000000',
        icon: 'test',
        objectives: ['To be deleted'],
        description: 'Test',
      });

      await api.deleteGroup('DeleteForce');

      const metadata = await pubsub.getForceMetadata('DeleteForce');
      expect(metadata).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should allow adding non-existent user to group (no validation)', async () => {
      await api.createGroup({
        name: 'ErrorForce',
        description: 'Error test',
        members: [],
        admins: [],
      });

      // Adding non-existent user is allowed (no validation at group level)
      await api.updateGroup('ErrorForce', {
        members: ['nonexistent'],
      });

      const group = await api.getGroup('ErrorForce');
      expect(group.members).toContain('nonexistent');
    });

    it('should throw error updating non-existent group', async () => {
      await expect(async () => {
        await api.updateGroup('NonExistent', {
          members: ['user1'],
        });
      }).rejects.toThrow();
    });
  });
});
