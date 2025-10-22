/**
 * Cross-Adapter Integration Tests
 * Validates unified data model works correctly across protocol adapters
 */

import { XMPPAdapter } from '../xmpp-adapter';
import { RESTAdapter } from '../rest-adapter';
import { PubSubAdapter } from '../pubsub-adapter';
import { createStorage } from '../../storage';
import type { Storage } from '../../storage';
import type { Theme } from '@mui/material/styles';
import { MOCK_DOMAIN, MOCK_CONFERENCE } from '../../fixtures';
import {
  seedTestWargame,
  addPlayerToForce,
  createTestRoomInWargame,
  getTestWargameStats,
} from '../test-fixtures';

describe('Cross-Adapter Integration', () => {
  let storage: Storage;
  let xmppAdapter: XMPPAdapter;
  let restAdapter: RESTAdapter;
  let pubsubAdapter: PubSubAdapter;

  beforeEach(async () => {
    // Create fresh in-memory storage for each test
    storage = createStorage({
      backend: 'memory',
      namespace: 'test',
    });

    // Initialize all adapters with shared storage
    xmppAdapter = new XMPPAdapter(storage, MOCK_DOMAIN);
    restAdapter = new RESTAdapter(storage, MOCK_DOMAIN, MOCK_CONFERENCE);
    pubsubAdapter = new PubSubAdapter(storage);

    // Seed the test wargame scenario
    await seedTestWargame(storage);
  });

  describe('User-Room Membership Synchronization', () => {
    it('should add a user to a room via REST and verify via XMPP', async () => {
      // Add commander.blue to intel-room via REST
      const updatedRoom = await restAdapter.updateRoom('intel-room', {
        members: [
          `analyst.red1@${MOCK_DOMAIN}`,
          `analyst.blue1@${MOCK_DOMAIN}`,
          `gamemaster@${MOCK_DOMAIN}`,
          `commander.blue@${MOCK_DOMAIN}`, // Adding new member
        ],
      });

      expect(updatedRoom?.members).toContain(`commander.blue@${MOCK_DOMAIN}`);

      // Verify commander.blue can see the room via XMPP
      const blueRooms = await xmppAdapter.getUserRooms(`commander.blue@${MOCK_DOMAIN}`);
      const intelRoom = blueRooms.find((r) => r.jid === `intel-room@${MOCK_CONFERENCE}`);
      expect(intelRoom).toBeDefined();
      expect(intelRoom?.info.identities?.[0]?.name).toBe('Intelligence Room');
    });

    it('should remove a user from a room via REST and verify via XMPP', async () => {
      // Remove analyst.red1 from intel-room via REST
      const updatedRoom = await restAdapter.updateRoom('intel-room', {
        members: [
          `analyst.blue1@${MOCK_DOMAIN}`,
          `gamemaster@${MOCK_DOMAIN}`,
          // analyst.red1 removed
        ],
      });

      expect(updatedRoom?.members).not.toContain(`analyst.red1@${MOCK_DOMAIN}`);

      // Verify analyst.red1 can no longer see the room via XMPP
      const redRooms = await xmppAdapter.getUserRooms(`analyst.red1@${MOCK_DOMAIN}`);
      const intelRoom = redRooms.find((r) => r.jid === `intel-room@${MOCK_CONFERENCE}`);
      expect(intelRoom).toBeUndefined();
    });

    it('should update room members via XMPP and verify via REST', async () => {
      // Update members via XMPP
      await xmppAdapter.updateRoomMembers('planning', [
        'commander.red',
        'commander.blue',
        'gamemaster',
      ]);

      // Verify via REST
      const room = await restAdapter.getRoom('planning');
      expect(room?.members).toEqual([
        `commander.red@${MOCK_DOMAIN}`,
        `commander.blue@${MOCK_DOMAIN}`,
        `gamemaster@${MOCK_DOMAIN}`,
      ]);
    });
  });

  describe('Room Metadata Synchronization', () => {
    it('should update room metadata via PubSub and verify via REST and XMPP', async () => {
      // First create observer users
      await restAdapter.createUser({ username: 'observer1', name: 'Observer 1' });
      await restAdapter.createUser({ username: 'observer2', name: 'Observer 2' });

      // Update room metadata via PubSub
      await pubsubAdapter.setRoomMetadata('all-hands', {
        allowedGroups: ['force-red', 'force-blue'],
        members: ['observer1', 'observer2'],
        formTemplates: ['contact', 'sitrep'],
        theme: { palette: { primary: { main: '#FF0000' } } } as Partial<Theme>,
        maxOccupants: 150,
      });

      // Verify via REST
      const restRoom = await restAdapter.getRoom('all-hands');
      expect(restRoom?.maxUsers).toBe(150);
      expect(restRoom?.members).toEqual([`observer1@${MOCK_DOMAIN}`, `observer2@${MOCK_DOMAIN}`]);

      // Verify via XMPP
      const xmppRoom = await xmppAdapter.getRoom('all-hands');
      // maxUsers and members are now in unified data layer, not DiscoInfo.x
      expect(xmppRoom).toBeDefined();

      // Verify observer1 can see the room via XMPP
      const observer1Rooms = await xmppAdapter.getUserRooms(`observer1@${MOCK_DOMAIN}`);
      const allHands = observer1Rooms.find((r) => r.jid === `all-hands@${MOCK_CONFERENCE}`);
      expect(allHands).toBeDefined();
    });

    it('should create a room via REST and access metadata via PubSub', async () => {
      // Create room via REST
      const newRoom = await restAdapter.createRoom({
        roomName: 'test-integration',
        naturalName: 'Integration Test Room',
        description: 'Room for integration testing',
        maxUsers: 30,
        members: [`commander.red@${MOCK_DOMAIN}`, `commander.blue@${MOCK_DOMAIN}`],
      });

      expect(newRoom.roomName).toBe('test-integration');

      // Get metadata via PubSub
      const metadata = await pubsubAdapter.getRoomMetadata('test-integration');
      expect(metadata).toBeDefined();
      expect(metadata?.description).toBe('Room for integration testing');
      expect(metadata?.members).toEqual(['commander.red', 'commander.blue']);
      expect(metadata?.maxOccupants).toBe(30);

      // Verify both commanders can see the room via XMPP
      const redRooms = await xmppAdapter.getUserRooms(`commander.red@${MOCK_DOMAIN}`);
      const blueRooms = await xmppAdapter.getUserRooms(`commander.blue@${MOCK_DOMAIN}`);

      expect(redRooms.some((r) => r.jid === `test-integration@${MOCK_CONFERENCE}`)).toBe(true);
      expect(blueRooms.some((r) => r.jid === `test-integration@${MOCK_CONFERENCE}`)).toBe(true);
    });
  });

  describe('User-Force Membership Synchronization', () => {
    it('should add a user to a force and verify room access', async () => {
      // Add a new player to force-red
      await addPlayerToForce(storage, 'new.player', 'force-red', 'Analyst');

      // Verify via REST
      const restUser = await restAdapter.getUser('new.player');
      expect(restUser?.properties?.sharedGroups).toEqual(['force-red']);

      // Verify via XMPP
      const xmppUser = await xmppAdapter.getUser('new.player');
      expect(xmppUser?.groups).toEqual(['force-red']);

      // Verify the new player can see force-red rooms
      const playerRooms = await xmppAdapter.getUserRooms(`new.player@${MOCK_DOMAIN}`);
      const redCommand = playerRooms.find((r) => r.jid === `red-command@${MOCK_CONFERENCE}`);
      expect(redCommand).toBeDefined();
      expect(redCommand?.info.identities?.[0]?.name).toBe('Red Command Center');
    });

    it('should create a user via REST and verify force membership', async () => {
      // Create user via REST with force membership
      const newUser = await restAdapter.createUser({
        username: 'integration.user',
        name: 'Integration User',
        email: 'integration@test.local',
        properties: {
          sharedGroups: ['force-blue', 'Game Masters'],
        },
      });

      expect(newUser.username).toBe('integration.user');

      // Verify force membership via REST groups
      const group = await restAdapter.getGroup('force-blue');
      expect(group?.members).toContain('integration.user');

      // Verify room access via XMPP
      const userRooms = await xmppAdapter.getUserRooms(`integration.user@${MOCK_DOMAIN}`);

      // Should see force-blue rooms
      const planning = userRooms.find((r) => r.jid === `planning@${MOCK_CONFERENCE}`);
      expect(planning).toBeDefined();

      // Should NOT see force-red rooms
      const redCommand = userRooms.find((r) => r.jid === `red-command@${MOCK_CONFERENCE}`);
      expect(redCommand).toBeUndefined();
    });
  });

  describe('Force Metadata Synchronization', () => {
    it('should update force metadata via PubSub and verify via REST', async () => {
      // Update force metadata via PubSub
      await pubsubAdapter.setForceMetadata('force-red', {
        color: '#FF0000',
        icon: 'flag',
        description: 'Updated Red Force',
        objectives: ['Objective 1', 'Objective 2', 'Objective 3'],
      });

      // Verify via REST (as group)
      const group = await restAdapter.getGroup('force-red');
      expect(group?.description).toBe('Updated Red Force');

      // Get force metadata back via PubSub
      const metadata = await pubsubAdapter.getForceMetadata('force-red');
      expect(metadata?.color).toBe('#FF0000');
      expect(metadata?.icon).toBe('flag');
      expect(metadata?.objectives).toEqual(['Objective 1', 'Objective 2', 'Objective 3']);
    });
  });

  describe('Complex Room Configuration Scenarios', () => {
    it('should handle room with both group and individual members', async () => {
      // Create a room with mixed access via REST
      await restAdapter.createRoom({
        roomName: 'mixed-access',
        naturalName: 'Mixed Access Room',
        members: [`gamemaster@${MOCK_DOMAIN}`, `analyst.red1@${MOCK_DOMAIN}`],
      });

      // Add group restrictions via PubSub
      await pubsubAdapter.setRoomMetadata('mixed-access', {
        allowedGroups: ['force-blue'],
        members: ['gamemaster', 'analyst.red1'], // Keep existing
      });

      // Verify force-blue members can access
      const blueRooms = await xmppAdapter.getUserRooms(`commander.blue@${MOCK_DOMAIN}`);
      expect(blueRooms.some((r) => r.jid === `mixed-access@${MOCK_CONFERENCE}`)).toBe(true);

      // Verify individual member can access
      const analystRooms = await xmppAdapter.getUserRooms(`analyst.red1@${MOCK_DOMAIN}`);
      expect(analystRooms.some((r) => r.jid === `mixed-access@${MOCK_CONFERENCE}`)).toBe(true);

      // Verify force-red commander (not individual member) cannot access
      const redRooms = await xmppAdapter.getUserRooms(`commander.red@${MOCK_DOMAIN}`);
      expect(redRooms.some((r) => r.jid === `mixed-access@${MOCK_CONFERENCE}`)).toBe(false);
    });

    it('should properly handle room deletion across adapters', async () => {
      // Delete room via REST
      await restAdapter.deleteRoom('planning');

      // Verify deletion via REST
      const restRoom = await restAdapter.getRoom('planning');
      expect(restRoom).toBeNull();

      // Verify deletion via XMPP
      const xmppRoom = await xmppAdapter.getRoom('planning');
      expect(xmppRoom).toBeNull();

      // Verify deletion via PubSub
      const metadata = await pubsubAdapter.getRoomMetadata('planning');
      expect(metadata).toBeNull();

      // Verify users no longer see the room
      const blueRooms = await xmppAdapter.getUserRooms(`commander.blue@${MOCK_DOMAIN}`);
      expect(blueRooms.some((r) => r.jid === `planning@${MOCK_CONFERENCE}`)).toBe(false);
    });
  });

  describe('Dynamic Wargame Modifications', () => {
    it('should handle dynamic room creation and access control', async () => {
      // Create a new room dynamically
      const newRoom = await createTestRoomInWargame(storage, 'dynamic-room', {
        name: 'Dynamic Operations Room',
        groupAccess: ['force-red'],
        individualAccess: ['gamemaster'],
        publicRoom: false,
      });

      expect(newRoom.id).toBe('dynamic-room');

      // Verify via all adapters
      const restRoom = await restAdapter.getRoom('dynamic-room');
      expect(restRoom?.naturalName).toBe('Dynamic Operations Room');

      const xmppRoom = await xmppAdapter.getRoom('dynamic-room');
      expect(xmppRoom?.info.identities?.[0]?.name).toBe('Dynamic Operations Room');

      const metadata = await pubsubAdapter.getRoomMetadata('dynamic-room');
      expect(metadata?.allowedGroups).toEqual(['force-red']);
      expect(metadata?.members).toEqual(['gamemaster']);

      // Verify access control
      const redRooms = await xmppAdapter.getUserRooms(`commander.red@${MOCK_DOMAIN}`);
      const gmRooms = await xmppAdapter.getUserRooms(`gamemaster@${MOCK_DOMAIN}`);
      const blueRooms = await xmppAdapter.getUserRooms(`commander.blue@${MOCK_DOMAIN}`);

      expect(redRooms.some((r) => r.jid === `dynamic-room@${MOCK_CONFERENCE}`)).toBe(true);
      expect(gmRooms.some((r) => r.jid === `dynamic-room@${MOCK_CONFERENCE}`)).toBe(true);
      expect(blueRooms.some((r) => r.jid === `dynamic-room@${MOCK_CONFERENCE}`)).toBe(false);
    });

    it('should maintain data integrity across multiple updates', async () => {
      const roomName = 'intel-room';

      // Perform multiple updates across different adapters
      await restAdapter.updateRoom(roomName, {
        naturalName: 'Updated Intel Room',
        maxUsers: 25,
      });

      await pubsubAdapter.setRoomMetadata(roomName, {
        formTemplates: ['intrep', 'sitrep', 'contact'],
        theme: { palette: { primary: { main: '#0000FF' } } } as Partial<Theme>,
      });

      await xmppAdapter.updateRoomMembers(roomName, [
        'analyst.red1',
        'analyst.blue1',
        'commander.red',
        'commander.blue',
      ]);

      // Verify all updates are properly reflected
      const restRoom = await restAdapter.getRoom(roomName);
      expect(restRoom?.naturalName).toBe('Updated Intel Room');
      expect(restRoom?.maxUsers).toBe(25);
      expect(restRoom?.members).toHaveLength(4);

      const metadata = await pubsubAdapter.getRoomMetadata(roomName);
      expect(metadata?.formTemplates).toEqual(['intrep', 'sitrep', 'contact']);
      expect(metadata?.theme?.palette?.primary?.main).toBe('#0000FF');
      expect(metadata?.members).toHaveLength(4);

      const xmppRoom = await xmppAdapter.getRoom(roomName);
      expect(xmppRoom?.info.identities?.[0]?.name).toBe('Updated Intel Room');
      // maxUsers and members are now in unified data layer, not DiscoInfo.x
    });
  });

  describe('Wargame Statistics Validation', () => {
    it('should maintain consistent counts across all adapters', async () => {
      const stats = getTestWargameStats();

      // Verify user counts
      const restUsers = await restAdapter.getAllUsers();
      expect(restUsers).toHaveLength(stats.userCount);

      const xmppUsers = await xmppAdapter.getAllUsers();
      expect(xmppUsers).toHaveLength(stats.userCount);

      // Verify room counts
      const restRooms = await restAdapter.getAllRooms();
      expect(restRooms).toHaveLength(stats.roomCount);

      const xmppRooms = await xmppAdapter.getAllRooms();
      expect(xmppRooms).toHaveLength(stats.roomCount);

      // Verify force/group counts
      const groups = await restAdapter.getAllGroups();
      const forceGroups = groups.filter((g) => g.name.startsWith('force-'));
      expect(forceGroups).toHaveLength(stats.forceCount);
    });
  });
});
