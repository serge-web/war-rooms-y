/**
 * React-Admin Data Provider
 * Hybrid REST/PubSub provider for OpenFire mock backend
 */

import type {
  DataProvider,
  GetListParams,
  GetListResult,
  GetOneParams,
  GetOneResult,
  GetManyParams,
  GetManyResult,
  CreateParams,
  CreateResult,
  UpdateParams,
  UpdateResult,
  DeleteParams,
  DeleteResult,
} from 'react-admin';

import {
  MockOpenFireAPI,
  MockPubSubMetadataREST,
  createStorage,
  type OpenFireUser,
  type OpenFireGroup,
  type OpenFireRoom,
  type ForceMetadata,
  type RoomMetadata,
  type GameOverview,
} from '@war-rooms/backend-mock';

// ============================================================================
// Resource Types
// ============================================================================

type ForceRecord = OpenFireGroup & { id: string; metadata?: ForceMetadata };
type RoomRecord = OpenFireRoom & { id: string; metadata?: RoomMetadata };
type UserRecord = OpenFireUser & { id: string };

// ============================================================================
// Data Provider Implementation
// ============================================================================

export function createDataProvider(): DataProvider {
  // Initialize storage and APIs
  const storage = createStorage({
    backend: 'localStorage',
    namespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
  });

  const restApi = new MockOpenFireAPI(storage);
  const pubsubApi = new MockPubSubMetadataREST(storage);

  // Configuration
  const DOMAIN = import.meta.env.VITE_MOCK_DOMAIN || 'wargame.local';
  const CONFERENCE_SERVICE = import.meta.env.VITE_MOCK_CONFERENCE || 'conference.wargame.local';

  /**
   * Sync REST room data to XMPP storage
   * Converts usernames to JIDs for XMPP compatibility
   */
  async function syncRoomToXmpp(roomName: string, members?: string[]): Promise<void> {
    const roomJid = `${roomName}@${CONFERENCE_SERVICE}`;
    const roomInfoKey = `rooms/${roomJid}/info`;

    // Get existing room info
    const existingInfo = await storage.getItem<any>(roomInfoKey);
    if (!existingInfo) return;

    // Convert usernames to JIDs
    const memberJids = members?.map(username => `${username}@${DOMAIN}`) || [];

    // Update room info with member JIDs (using MUC standard field name)
    const updatedInfo = {
      ...existingInfo,
      x: {
        ...existingInfo.x,
        'muc#roomconfig_members': memberJids,
      },
    };

    await storage.setItem(roomInfoKey, updatedInfo);
  }

  return {
    // ========================================================================
    // Overview Resource (single record)
    // ========================================================================

    async getList(resource: string, params: GetListParams): Promise<GetListResult> {
      if (resource === 'overview') {
        const overview = await pubsubApi.getGameOverview();
        if (!overview) {
          return { data: [], total: 0 };
        }
        return {
          data: [{ ...overview, id: 'game-overview' }],
          total: 1,
        };
      }

      // ======================================================================
      // Forces Resource (Groups + PubSub metadata)
      // ======================================================================

      if (resource === 'forces') {
        const groups = await restApi.getGroups();
        const data: ForceRecord[] = [];

        for (const group of groups) {
          const metadata = await pubsubApi.getForceMetadata(group.name);
          data.push({
            ...group,
            id: group.name,
            ...(metadata ? { metadata } : {}),
          });
        }

        return { data, total: data.length };
      }

      // ======================================================================
      // Rooms Resource (MUC + PubSub metadata)
      // ======================================================================

      if (resource === 'rooms') {
        const rooms = await restApi.getRooms();
        const data: RoomRecord[] = [];

        for (const room of rooms) {
          const metadata = await pubsubApi.getRoomMetadata(room.roomName);
          data.push({
            ...room,
            id: room.roomName,
            ...(metadata ? { metadata } : {}),
          });
        }

        return { data, total: data.length };
      }

      // ======================================================================
      // Users Resource (for reference)
      // ======================================================================

      if (resource === 'users') {
        // Transform react-admin pagination to PaginationParams
        const pagination = params.pagination
          ? {
              startIndex: (params.pagination.page - 1) * params.pagination.perPage,
              count: params.pagination.perPage,
            }
          : undefined;

        const users = await restApi.getUsers(pagination);
        const data: UserRecord[] = users.map((u) => ({ ...u, id: u.username }));
        return { data, total: data.length };
      }

      // ======================================================================
      // Templates Resource (placeholder)
      // ======================================================================

      if (resource === 'templates') {
        return { data: [], total: 0 };
      }

      throw new Error(`Unknown resource: ${resource}`);
    },

    async getOne(resource: string, params: GetOneParams): Promise<GetOneResult> {
      if (resource === 'overview') {
        const overview = await pubsubApi.getGameOverview();
        if (!overview) {
          throw new Error('Game overview not found');
        }
        return { data: { ...overview, id: 'game-overview' } };
      }

      if (resource === 'forces') {
        const group = await restApi.getGroup(params.id as string);
        if (!group) {
          throw new Error(`Force ${params.id} not found`);
        }
        const metadata = await pubsubApi.getForceMetadata(group.name);
        return {
          data: {
            ...group,
            id: group.name,
            metadata: metadata || undefined,
          },
        };
      }

      if (resource === 'rooms') {
        const room = await restApi.getRoom(params.id as string);
        if (!room) {
          throw new Error(`Room ${params.id} not found`);
        }
        const metadata = await pubsubApi.getRoomMetadata(room.roomName);
        return {
          data: {
            ...room,
            id: room.roomName,
            metadata: metadata || undefined,
          },
        };
      }

      if (resource === 'users') {
        const user = await restApi.getUser(params.id as string);
        if (!user) {
          throw new Error(`User ${params.id} not found`);
        }
        return { data: { ...user, id: user.username } };
      }

      throw new Error(`Unknown resource: ${resource}`);
    },

    async getMany(resource: string, params: GetManyParams): Promise<GetManyResult> {
      // Simple implementation - fetch all and filter
      const listResult = await this.getList(resource, {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'id', order: 'ASC' },
        filter: {},
      });

      const data = listResult.data.filter((item) => params.ids.includes(item.id));
      return { data };
    },

    getManyReference: async () => {
      throw new Error('getManyReference not implemented');
    },

    async create(resource: string, params: CreateParams): Promise<CreateResult> {
      if (resource === 'overview') {
        await pubsubApi.setGameOverview(params.data as GameOverview);
        return { data: { ...params.data, id: 'game-overview' } };
      }

      if (resource === 'forces') {
        const { metadata, ...groupData } = params.data;
        const group = await restApi.createGroup(groupData as OpenFireGroup);

        if (metadata) {
          await pubsubApi.setForceMetadata(group.name, metadata as ForceMetadata);
        }

        return {
          data: {
            ...group,
            id: group.name,
            metadata,
          },
        };
      }

      if (resource === 'rooms') {
        const { metadata, ...roomData } = params.data;

        // Sync metadata.members to room.members (for XMPP room membership)
        if (metadata?.members) {
          roomData.members = metadata.members;
        }

        const room = await restApi.createRoom(roomData as OpenFireRoom);

        if (metadata) {
          await pubsubApi.setRoomMetadata(room.roomName, metadata as RoomMetadata);
        }

        // Sync to XMPP storage for chat-ui
        await syncRoomToXmpp(room.roomName, metadata?.members);

        return {
          data: {
            ...room,
            id: room.roomName,
            metadata,
          },
        };
      }

      if (resource === 'users') {
        const user = await restApi.createUser(params.data as OpenFireUser);
        return { data: { ...user, id: user.username } };
      }

      throw new Error(`Unknown resource: ${resource}`);
    },

    async update(resource: string, params: UpdateParams): Promise<UpdateResult> {
      if (resource === 'overview') {
        await pubsubApi.setGameOverview(params.data as GameOverview);
        return { data: { ...params.data, id: 'game-overview' } };
      }

      if (resource === 'forces') {
        const { metadata, id, ...groupData } = params.data;
        const group = await restApi.updateGroup(params.id as string, groupData as Partial<OpenFireGroup>);

        if (metadata) {
          await pubsubApi.setForceMetadata(group.name, metadata as ForceMetadata);
        }

        return {
          data: {
            ...group,
            id: group.name,
            metadata,
          },
        };
      }

      if (resource === 'rooms') {
        const { metadata, id, ...roomData } = params.data;

        // Sync metadata.members to room.members (for XMPP room membership)
        if (metadata?.members) {
          roomData.members = metadata.members;
        }

        const room = await restApi.updateRoom(params.id as string, roomData as Partial<OpenFireRoom>);

        if (metadata) {
          await pubsubApi.setRoomMetadata(room.roomName, metadata as RoomMetadata);
        }

        // Sync to XMPP storage for chat-ui
        await syncRoomToXmpp(room.roomName, metadata?.members);

        return {
          data: {
            ...room,
            id: room.roomName,
            metadata,
          },
        };
      }

      if (resource === 'users') {
        const { id, ...userData } = params.data;
        const user = await restApi.updateUser(params.id as string, userData as Partial<OpenFireUser>);
        return { data: { ...user, id: user.username } };
      }

      throw new Error(`Unknown resource: ${resource}`);
    },

    updateMany: async () => {
      throw new Error('updateMany not implemented');
    },

    async delete(resource: string, params: DeleteParams): Promise<DeleteResult> {
      if (resource === 'overview') {
        await pubsubApi.deleteGameOverview();
        return { data: { id: 'game-overview' } };
      }

      if (resource === 'forces') {
        await pubsubApi.deleteForceMetadata(params.id as string);
        await restApi.deleteGroup(params.id as string);
        return { data: { id: params.id } };
      }

      if (resource === 'rooms') {
        await pubsubApi.deleteRoomMetadata(params.id as string);
        await restApi.deleteRoom(params.id as string);
        return { data: { id: params.id } };
      }

      if (resource === 'users') {
        await restApi.deleteUser(params.id as string);
        return { data: { id: params.id } };
      }

      throw new Error(`Unknown resource: ${resource}`);
    },

    deleteMany: async () => {
      throw new Error('deleteMany not implemented');
    },
  };
}
