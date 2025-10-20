/**
 * Room CRUD Operations Tests
 * Tests admin panel room management via REST API + PubSub metadata
 */

// @ts-nocheck
import { createStorage, MockOpenFireAPI, MockPubSubMetadataREST } from '@war-rooms/backend-mock';

describe('Admin Room CRUD Operations', () => {
  let storage: ReturnType<typeof createStorage>;
  let api: MockOpenFireAPI;
  let pubsub: MockPubSubMetadataREST;

  beforeEach(async () => {
    storage = createStorage({
      backend: 'memory',
      namespace: 'admin-test-rooms',
    });
    api = new MockOpenFireAPI(storage);
    pubsub = new MockPubSubMetadataREST(storage);
  });

  describe('Room Creation', () => {
    it('should create a basic room', async () => {
      const newRoom = {
        roomName: 'testroom',
        naturalName: 'Test Room',
        description: 'A test room',
        persistent: true,
        publicRoom: false,
        membersOnly: true,
        moderated: false,
        maxUsers: 50,
      };

      await api.createRoom(newRoom);

      const room = await api.getRoom('testroom');
      expect(room.roomName).toBe('testroom');
      expect(room.naturalName).toBe('Test Room');
      expect(room.description).toBe('A test room');
      expect(room.persistent).toBe(true);
      expect(room.membersOnly).toBe(true);
    });

    it('should reject duplicate room names', async () => {
      const room = {
        roomName: 'duplicate',
        naturalName: 'Duplicate Room',
        description: 'Test',
        persistent: true,
      };

      await api.createRoom(room);

      await expect(async () => {
        await api.createRoom(room);
      }).rejects.toThrow();
    });

    it('should create room with metadata', async () => {
      const newRoom = {
        roomName: 'metaroom',
        naturalName: 'Metadata Room',
        description: 'Room with metadata',
        persistent: true,
      };

      await api.createRoom(newRoom);

      // Set metadata via PubSub
      const metadata = {
        description: 'Extended description',
        allowedGroups: ['Red Force', 'Blue Force'],
        formTemplates: ['sitrep', 'contact'],
        theme: {
          palette: {
            primary: {
              main: '#1976D2',
            },
          },
        },
      };

      await pubsub.setRoomMetadata('metaroom', metadata);

      const retrievedMetadata = await pubsub.getRoomMetadata('metaroom');
      expect(retrievedMetadata.description).toBe('Extended description');
      expect(retrievedMetadata.allowedGroups).toEqual(['Red Force', 'Blue Force']);
      expect(retrievedMetadata.formTemplates).toEqual(['sitrep', 'contact']);
      expect(retrievedMetadata.theme.palette.primary.main).toBe('#1976D2');
    });
  });

  describe('Room Retrieval', () => {
    beforeEach(async () => {
      await api.createRoom({
        roomName: 'room1',
        naturalName: 'Room One',
        description: 'First room',
        persistent: true,
      });
      await api.createRoom({
        roomName: 'room2',
        naturalName: 'Room Two',
        description: 'Second room',
        persistent: true,
      });
    });

    it('should list all rooms', async () => {
      const rooms = await api.getRooms();
      expect(rooms.length).toBeGreaterThanOrEqual(2);
      expect(rooms.some((r: any) => r.roomName === 'room1')).toBe(true);
      expect(rooms.some((r: any) => r.roomName === 'room2')).toBe(true);
    });

    it('should get room by name', async () => {
      const room = await api.getRoom('room1');
      expect(room.roomName).toBe('room1');
      expect(room.naturalName).toBe('Room One');
      expect(room.description).toBe('First room');
    });

    it('should throw error for non-existent room', async () => {
      await expect(async () => {
        await api.getRoom('nonexistent');
      }).rejects.toThrow('Room not found');
    });

    it('should get room with metadata', async () => {
      await pubsub.setRoomMetadata('room1', {
        description: 'Extended info',
        allowedGroups: ['Control'],
        formTemplates: ['sitrep'],
      });

      const room = await api.getRoom('room1');
      const metadata = await pubsub.getRoomMetadata('room1');

      expect(room.roomName).toBe('room1');
      expect(metadata.description).toBe('Extended info');
      expect(metadata.allowedGroups).toContain('Control');
    });
  });

  describe('Room Update', () => {
    beforeEach(async () => {
      await api.createRoom({
        roomName: 'updateroom',
        naturalName: 'Original Name',
        description: 'Original description',
        persistent: true,
        maxUsers: 30,
      });
    });

    it('should update room properties', async () => {
      await api.updateRoom('updateroom', {
        naturalName: 'Updated Name',
        description: 'Updated description',
        maxUsers: 100,
      });

      const room = await api.getRoom('updateroom');
      expect(room.naturalName).toBe('Updated Name');
      expect(room.description).toBe('Updated description');
      expect(room.maxUsers).toBe(100);
    });

    it('should update room subject', async () => {
      await api.updateRoom('updateroom', {
        subject: 'New subject line',
      });

      const room = await api.getRoom('updateroom');
      expect(room.subject).toBe('New subject line');
    });

    it('should update room access controls', async () => {
      await api.updateRoom('updateroom', {
        membersOnly: false,
        publicRoom: true,
        moderated: true,
      });

      const room = await api.getRoom('updateroom');
      expect(room.membersOnly).toBe(false);
      expect(room.publicRoom).toBe(true);
      expect(room.moderated).toBe(true);
    });

    it('should update room metadata', async () => {
      await pubsub.setRoomMetadata('updateroom', {
        description: 'Original metadata',
        allowedGroups: ['Red Force'],
      });

      await pubsub.setRoomMetadata('updateroom', {
        description: 'Updated metadata',
        allowedGroups: ['Red Force', 'Blue Force'],
        formTemplates: ['sitrep', 'contact'],
      });

      const metadata = await pubsub.getRoomMetadata('updateroom');
      expect(metadata.description).toBe('Updated metadata');
      expect(metadata.allowedGroups).toEqual(['Red Force', 'Blue Force']);
      expect(metadata.formTemplates).toEqual(['sitrep', 'contact']);
    });

    it('should update room theme', async () => {
      await pubsub.setRoomMetadata('updateroom', {
        theme: {
          palette: {
            primary: {
              main: '#FF5722',
            },
          },
        },
      });

      const metadata = await pubsub.getRoomMetadata('updateroom');
      expect(metadata.theme.palette.primary.main).toBe('#FF5722');
    });
  });

  describe('Room Deletion', () => {
    beforeEach(async () => {
      await api.createRoom({
        roomName: 'deleteroom',
        naturalName: 'Delete Room',
        description: 'To be deleted',
        persistent: true,
      });

      await pubsub.setRoomMetadata('deleteroom', {
        description: 'Metadata to be deleted',
      });
    });

    it('should delete a room', async () => {
      await api.deleteRoom('deleteroom');

      await expect(async () => {
        await api.getRoom('deleteroom');
      }).rejects.toThrow('Room not found');
    });

    it('should delete room metadata when room deleted', async () => {
      // Verify metadata exists
      const metadataBefore = await pubsub.getRoomMetadata('deleteroom');
      expect(metadataBefore.description).toBe('Metadata to be deleted');

      // Delete room
      await api.deleteRoom('deleteroom');

      // Verify metadata is also deleted (or empty)
      const metadataAfter = await pubsub.getRoomMetadata('deleteroom');
      expect(metadataAfter).toEqual({});
    });

    it('should throw error when deleting non-existent room', async () => {
      await expect(async () => {
        await api.deleteRoom('nonexistent');
      }).rejects.toThrow();
    });
  });

  describe('Room Metadata Operations', () => {
    beforeEach(async () => {
      await api.createRoom({
        roomName: 'metaroom',
        naturalName: 'Metadata Room',
        description: 'For metadata testing',
        persistent: true,
      });
    });

    it('should set allowed groups', async () => {
      await pubsub.setRoomMetadata('metaroom', {
        allowedGroups: ['Red Force', 'Blue Force', 'Control'],
      });

      const metadata = await pubsub.getRoomMetadata('metaroom');
      expect(metadata.allowedGroups).toEqual(['Red Force', 'Blue Force', 'Control']);
    });

    it('should set form templates', async () => {
      await pubsub.setRoomMetadata('metaroom', {
        formTemplates: ['sitrep', 'contact', 'intrep'],
      });

      const metadata = await pubsub.getRoomMetadata('metaroom');
      expect(metadata.formTemplates).toEqual(['sitrep', 'contact', 'intrep']);
    });

    it('should set multiple metadata fields', async () => {
      const fullMetadata = {
        description: 'Full metadata example',
        allowedGroups: ['Red Force'],
        formTemplates: ['sitrep'],
        theme: {
          palette: {
            primary: {
              main: '#4CAF50',
            },
          },
        },
      };

      await pubsub.setRoomMetadata('metaroom', fullMetadata);

      const metadata = await pubsub.getRoomMetadata('metaroom');
      expect(metadata.description).toBe('Full metadata example');
      expect(metadata.allowedGroups).toEqual(['Red Force']);
      expect(metadata.formTemplates).toEqual(['sitrep']);
      expect(metadata.theme.palette.primary.main).toBe('#4CAF50');
    });
  });

  describe('Room Configuration Combinations', () => {
    it('should create public non-persistent room', async () => {
      await api.createRoom({
        roomName: 'publictemp',
        naturalName: 'Public Temp',
        description: 'Temporary public room',
        persistent: false,
        publicRoom: true,
        membersOnly: false,
      });

      const room = await api.getRoom('publictemp');
      expect(room.persistent).toBe(false);
      expect(room.publicRoom).toBe(true);
      expect(room.membersOnly).toBe(false);
    });

    it('should create moderated members-only room', async () => {
      await api.createRoom({
        roomName: 'moderated',
        naturalName: 'Moderated Room',
        description: 'Moderated members-only',
        persistent: true,
        publicRoom: false,
        membersOnly: true,
        moderated: true,
      });

      const room = await api.getRoom('moderated');
      expect(room.membersOnly).toBe(true);
      expect(room.moderated).toBe(true);
    });

    it('should set custom max users', async () => {
      await api.createRoom({
        roomName: 'large',
        naturalName: 'Large Room',
        description: 'Large capacity',
        persistent: true,
        maxUsers: 500,
      });

      const room = await api.getRoom('large');
      expect(room.maxUsers).toBe(500);
    });
  });
});
