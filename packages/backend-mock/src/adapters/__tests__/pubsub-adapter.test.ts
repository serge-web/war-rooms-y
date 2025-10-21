/**
 * PubSubAdapter Unit Tests
 */

import { PubSubAdapter } from '../pubsub-adapter';
import { createStorage } from '../../storage';
import type { Storage } from '../../storage';
import type { UnifiedRoom, UnifiedForce } from '@war-rooms/backend-interface';
import type { Theme } from '@mui/material/styles';
import { MOCK_CONFERENCE } from '../../fixtures';
import {
  seedTestWargame,
  createTestRoom,
  createTestForce,
} from '../test-fixtures';

describe('PubSubAdapter', () => {
  let storage: Storage;
  let adapter: PubSubAdapter;

  beforeEach(async () => {
    // Create fresh in-memory storage for each test
    storage = createStorage({
      backend: 'memory',
      namespace: 'test',
    });

    adapter = new PubSubAdapter(storage);

    // Seed the test wargame scenario
    await seedTestWargame(storage);
  });

  describe('Room Metadata Operations (Admin UI)', () => {
    describe('getRoomMetadata', () => {
      it('should get room metadata for admin UI', async () => {
        const metadata = await adapter.getRoomMetadata('red-command');
        expect(metadata).toBeDefined();
        expect(metadata?.allowedGroups).toEqual(['force-red']);
        expect(metadata?.formTemplates).toEqual(['oporder', 'sitrep']);
        expect(metadata?.theme?.palette?.primary?.main).toBe('#D32F2F');
      });

      it('should handle individual members', async () => {
        const metadata = await adapter.getRoomMetadata('intel-room');
        expect(metadata?.members).toEqual(['analyst.red1', 'analyst.blue1', 'gamemaster']);
      });

      it('should handle mixed access', async () => {
        const metadata = await adapter.getRoomMetadata('planning');
        expect(metadata?.allowedGroups).toEqual(['force-blue']);
        expect(metadata?.members).toEqual(['gamemaster']);
      });

      it('should return null for non-existent room', async () => {
        const metadata = await adapter.getRoomMetadata('non-existent');
        expect(metadata).toBeNull();
      });
    });

    describe('setRoomMetadata', () => {
      it('should update room metadata', async () => {
        await adapter.setRoomMetadata('all-hands', {
          allowedGroups: ['force-red', 'force-blue'],
          members: ['observer1'],
          formTemplates: ['contact', 'sitrep'],
          theme: { palette: { primary: { main: '#FF0000' } } } as Partial<Theme>,
          maxOccupants: 150,
        });

        const room = await storage.getItem<UnifiedRoom>('entities/rooms/all-hands');
        expect(room?.wargaming.groupMembers).toEqual(['force-red', 'force-blue']);
        expect(room?.wargaming.individualMembers).toEqual(['observer1']);
        expect(room?.wargaming.formTemplates).toEqual(['contact', 'sitrep']);
        expect(room?.wargaming.theme?.palette?.primary?.main).toBe('#FF0000');
        expect(room?.xmpp.maxUsers).toBe(150);
      });

      it('should update modification timestamp', async () => {
        const before = Date.now();
        await adapter.setRoomMetadata('all-hands', {
          allowedGroups: ['test'],
        });
        const after = Date.now();

        const room = await storage.getItem<UnifiedRoom>('entities/rooms/all-hands');
        expect(room?.modifiedAt).toBeDefined();
        const modTime = new Date(room!.modifiedAt!).getTime();
        expect(modTime).toBeGreaterThanOrEqual(before);
        expect(modTime).toBeLessThanOrEqual(after);
      });

      it('should not fail for non-existent room', async () => {
        await expect(
          adapter.setRoomMetadata('non-existent', { allowedGroups: ['test'] })
        ).resolves.not.toThrow();
      });
    });

    describe('deleteRoomMetadata', () => {
      it('should clear wargaming extensions', async () => {
        await adapter.deleteRoomMetadata('red-command');

        const room = await storage.getItem<UnifiedRoom>('entities/rooms/red-command');
        expect(room?.wargaming.groupMembers).toBeUndefined();
        expect(room?.wargaming.individualMembers).toBeUndefined();
        expect(room?.wargaming.formTemplates).toBeUndefined();
        expect(room?.wargaming.theme).toBeUndefined();
        expect(room?.wargaming.type).toBe('standard'); // Type should be preserved
      });

      it('should not delete the room itself', async () => {
        await adapter.deleteRoomMetadata('red-command');

        const room = await storage.getItem<UnifiedRoom>('entities/rooms/red-command');
        expect(room).toBeDefined();
        expect(room?.name).toBe('Red Command Center');
        expect(room?.xmpp.persistent).toBe(true);
      });
    });
  });

  describe('Room Extension Operations (XMPP PubSub)', () => {
    describe('getRoomExtension', () => {
      it('should get room extension for XMPP PubSub', async () => {
        const extension = await adapter.getRoomExtension(`red-command@${MOCK_CONFERENCE}`);
        expect(extension).toBeDefined();
        expect(extension?.roomJid).toBe(`red-command@${MOCK_CONFERENCE}`);
        expect(extension?.type).toBe('command');
        expect(extension?.forceRestrictions).toEqual(['force-red']);
        expect(extension?.formSchemaIds).toEqual(['oporder', 'sitrep']);
      });

      it('should extract room name from JID', async () => {
        const extension = await adapter.getRoomExtension(`planning@${MOCK_CONFERENCE}`);
        expect(extension).toBeDefined();
        expect(extension?.forceRestrictions).toEqual(['force-blue']);
      });

      it('should return null for invalid JID', async () => {
        const extension = await adapter.getRoomExtension('invalid-jid');
        expect(extension).toBeNull();
      });

      it('should return null for non-existent room', async () => {
        const extension = await adapter.getRoomExtension(`non-existent@${MOCK_CONFERENCE}`);
        expect(extension).toBeNull();
      });
    });

    describe('getAllRoomExtensions', () => {
      it('should return extensions for rooms with group restrictions', async () => {
        const extensions = await adapter.getAllRoomExtensions();
        // red-command and planning have group restrictions
        expect(extensions).toHaveLength(2);

        const roomJids = extensions.map(e => e.roomJid).sort();
        expect(roomJids).toEqual([
          `planning@${MOCK_CONFERENCE}`,
          `red-command@${MOCK_CONFERENCE}`,
        ]);
      });

      it('should not include rooms without group restrictions', async () => {
        const extensions = await adapter.getAllRoomExtensions();
        const allHands = extensions.find(e => e.roomJid === `all-hands@${MOCK_CONFERENCE}`);
        expect(allHands).toBeUndefined();

        const intelRoom = extensions.find(e => e.roomJid === `intel-room@${MOCK_CONFERENCE}`);
        expect(intelRoom).toBeUndefined();
      });
    });
  });

  describe('Force Metadata Operations', () => {
    describe('getForceMetadata', () => {
      it('should get force metadata', async () => {
        const metadata = await adapter.getForceMetadata('force-red');
        expect(metadata).toBeDefined();
        expect(metadata?.color).toBe('#D32F2F');
        expect(metadata?.icon).toBe('military_tech');
        expect(metadata?.description).toBe('Opposing force in exercise');
        expect(metadata?.objectives).toEqual([
          'Maintain territorial control',
          'Disrupt Blue Force operations',
          'Preserve force strength',
        ]);
      });

      it('should return null for non-existent force', async () => {
        const metadata = await adapter.getForceMetadata('non-existent');
        expect(metadata).toBeNull();
      });
    });

    describe('setForceMetadata', () => {
      it('should update existing force', async () => {
        await adapter.setForceMetadata('force-red', {
          color: '#FF0000',
          icon: 'flag',
          description: 'Updated description',
          objectives: ['New objective 1', 'New objective 2'],
        });

        const force = await storage.getItem<UnifiedForce>('entities/forces/force-red');
        expect(force?.color).toBe('#FF0000');
        expect(force?.icon).toBe('flag');
        expect(force?.description).toBe('Updated description');
        expect(force?.objectives).toEqual(['New objective 1', 'New objective 2']);
      });

      it('should create new force if not exists', async () => {
        await adapter.setForceMetadata('force-green', {
          color: '#00FF00',
          icon: 'nature',
          description: 'Green force',
          objectives: ['Objective 1'],
        });

        const force = await storage.getItem<UnifiedForce>('entities/forces/force-green');
        expect(force).toBeDefined();
        expect(force?.id).toBe('force-green');
        expect(force?.color).toBe('#00FF00');
        expect(force?.members).toEqual([]);

        const index = await storage.getItem<string[]>('entities/forces/_index');
        expect(index).toContain('force-green');
      });

      it('should set modification timestamp for updates', async () => {
        const before = Date.now();
        await adapter.setForceMetadata('force-blue', {
          color: '#0000FF',
          icon: 'water',
          description: 'Updated',
          objectives: [],
        });
        const after = Date.now();

        const force = await storage.getItem<UnifiedForce>('entities/forces/force-blue');
        expect(force?.modifiedAt).toBeDefined();
        const modTime = new Date(force!.modifiedAt!).getTime();
        expect(modTime).toBeGreaterThanOrEqual(before);
        expect(modTime).toBeLessThanOrEqual(after);
      });
    });

    describe('deleteForceMetadata', () => {
      it('should clear objectives but preserve force', async () => {
        await adapter.deleteForceMetadata('force-red');

        const force = await storage.getItem<UnifiedForce>('entities/forces/force-red');
        expect(force).toBeDefined();
        expect(force?.id).toBe('force-red');
        expect(force?.members).toEqual(['commander.red', 'analyst.red1']);
        expect(force?.objectives).toBeUndefined();
        expect(force?.metadata).toBeUndefined();
      });
    });
  });

  describe('Game Overview Operations', () => {
    describe('getGameOverview', () => {
      it('should get game overview', async () => {
        const overview = {
          title: 'Winter Exercise 2024',
          status: 'active' as const,
          currentTurn: 3,
          gameTime: '2024-01-15T10:00:00Z',
          description: 'Large-scale exercise',
          scenario: 'Scenario Alpha',
        };
        await storage.setItem('entities/game/overview', overview);

        const retrieved = await adapter.getGameOverview();
        expect(retrieved).toEqual(overview);
      });

      it('should return null if no overview exists', async () => {
        const overview = await adapter.getGameOverview();
        expect(overview).toBeNull();
      });
    });

    describe('setGameOverview', () => {
      it('should set game overview', async () => {
        const overview = {
          title: 'Summer Exercise 2024',
          status: 'setup' as const,
          currentTurn: 0,
          gameTime: '2024-06-01T00:00:00Z',
        };

        await adapter.setGameOverview(overview);

        const stored = await storage.getItem('entities/game/overview');
        expect(stored).toEqual(overview);
      });
    });

    describe('deleteGameOverview', () => {
      it('should delete game overview', async () => {
        await storage.setItem('entities/game/overview', { title: 'Test' });
        await adapter.deleteGameOverview();

        const overview = await storage.getItem('entities/game/overview');
        expect(overview).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle room with no wargaming data', async () => {
      const room = createTestRoom('basic', {
        wargaming: { type: 'standard' },
      });
      await storage.setItem('entities/rooms/basic', room);

      const metadata = await adapter.getRoomMetadata('basic');
      expect(metadata).toBeDefined();
      expect(metadata?.allowedGroups).toBeUndefined();
      expect(metadata?.members).toBeUndefined();
      expect(metadata?.formTemplates).toBeUndefined();
      expect(metadata?.theme).toBeUndefined();
    });

    it('should handle force with minimal data', async () => {
      const force = createTestForce('minimal-force');
      await storage.setItem('entities/forces/minimal-force', force);

      const metadata = await adapter.getForceMetadata('minimal-force');
      expect(metadata).toBeDefined();
      expect(metadata?.color).toBe('#000000');
      expect(metadata?.icon).toBe('group');
      expect(metadata?.objectives).toEqual([]);
    });
  });
});