/**
 * Rooms State Store
 * Manages MUC room state using Zustand
 */

import { create } from 'zustand';
import type {
  XMPPBackend,
  XMPPRoom,
  XMPPOccupant,
} from '@war-rooms/backend-interface';

// ============================================================================
// Store State
// ============================================================================

export interface RoomState {
  /** Room info */
  info: XMPPRoom;

  /** Current occupants */
  occupants: XMPPOccupant[];

  /** Whether user is joined */
  joined: boolean;

  /** User's nickname in this room */
  nickname?: string;

  /** Loading state */
  loading: boolean;
}

export interface RoomsStore {
  // State
  backend: XMPPBackend | null;
  rooms: Map<string, RoomState>;

  // Actions
  setBackend: (backend: XMPPBackend) => void;
  loadMyRooms: () => Promise<void>;
  joinRoom: (roomJid: string, nickname: string, password?: string) => Promise<void>;
  leaveRoom: (roomJid: string) => Promise<void>;
  loadRoomInfo: (roomJid: string) => Promise<void>;
  updateOccupants: (roomJid: string, occupants: XMPPOccupant[]) => void;
  sendMessage: (roomJid: string, body: string) => Promise<string>;
  setRoomSubject: (roomJid: string, subject: string) => Promise<void>;

  // Queries
  getRoom: (roomJid: string) => RoomState | undefined;
  getJoinedRooms: () => RoomState[];
}

// ============================================================================
// Store
// ============================================================================

export const useRoomsStore = create<RoomsStore>((set, get) => ({
  // Initial state
  backend: null,
  rooms: new Map(),

  // Actions
  setBackend: (backend: XMPPBackend) => {
    // Register room occupant update handler
    backend.on({
      onRoomOccupantUpdate: (roomJid, occupants) => {
        get().updateOccupants(roomJid, occupants);
      },
    });

    set({ backend });
  },

  loadMyRooms: async () => {
    const { backend, rooms } = get();

    if (!backend) {
      throw new Error('Backend not initialized');
    }

    try {
      const myRooms = await backend.getMyRooms();

      // Add all assigned rooms to state (not joined, just discovered)
      for (const xmppRoom of myRooms) {
        rooms.set(xmppRoom.jid, {
          info: xmppRoom,
          occupants: xmppRoom.occupants || [],
          joined: false,
          loading: false,
        });
      }

      set({ rooms: new Map(rooms) });
    } catch (error) {
      console.error('[RoomsStore] Load my rooms failed:', error);
      throw error;
    }
  },

  joinRoom: async (roomJid: string, nickname: string, password?: string) => {
    const { backend, rooms } = get();

    if (!backend) {
      throw new Error('Backend not initialized');
    }

    // Set loading state
    const existingRoom = rooms.get(roomJid);
    if (existingRoom) {
      rooms.set(roomJid, { ...existingRoom, loading: true });
      set({ rooms: new Map(rooms) });
    }

    try {
      await backend.joinRoom(roomJid, nickname, password);

      // Load room info
      const info = await backend.getRoomInfo(roomJid);
      const occupants = await backend.getRoomOccupants(roomJid);

      rooms.set(roomJid, {
        info,
        occupants,
        joined: true,
        nickname,
        loading: false,
      });

      set({ rooms: new Map(rooms) });
    } catch (error) {
      console.error('[RoomsStore] Join room failed:', error);

      // Clear loading state
      if (existingRoom) {
        rooms.set(roomJid, { ...existingRoom, loading: false });
        set({ rooms: new Map(rooms) });
      }

      throw error;
    }
  },

  leaveRoom: async (roomJid: string) => {
    const { backend, rooms } = get();

    if (!backend) {
      throw new Error('Backend not initialized');
    }

    try {
      await backend.leaveRoom(roomJid);

      const room = rooms.get(roomJid);
      if (room) {
        const updatedRoom: RoomState = {
          ...room,
          joined: false,
        };
        delete updatedRoom.nickname;
        rooms.set(roomJid, updatedRoom);
        set({ rooms: new Map(rooms) });
      }
    } catch (error) {
      console.error('[RoomsStore] Leave room failed:', error);
      throw error;
    }
  },

  loadRoomInfo: async (roomJid: string) => {
    const { backend, rooms } = get();

    if (!backend) {
      throw new Error('Backend not initialized');
    }

    const existingRoom = rooms.get(roomJid);
    if (existingRoom) {
      rooms.set(roomJid, { ...existingRoom, loading: true });
      set({ rooms: new Map(rooms) });
    }

    try {
      const info = await backend.getRoomInfo(roomJid);
      const occupants = await backend.getRoomOccupants(roomJid);

      const room = rooms.get(roomJid);
      const newRoom: RoomState = {
        info,
        occupants,
        joined: room?.joined || false,
        loading: false,
      };
      if (room?.nickname !== undefined) {
        newRoom.nickname = room.nickname;
      }
      rooms.set(roomJid, newRoom);

      set({ rooms: new Map(rooms) });
    } catch (error) {
      console.error('[RoomsStore] Load room info failed:', error);

      if (existingRoom) {
        rooms.set(roomJid, { ...existingRoom, loading: false });
        set({ rooms: new Map(rooms) });
      }

      throw error;
    }
  },

  updateOccupants: (roomJid: string, occupants: XMPPOccupant[]) => {
    const { rooms } = get();
    const room = rooms.get(roomJid);

    if (room) {
      rooms.set(roomJid, {
        ...room,
        occupants,
      });
      set({ rooms: new Map(rooms) });
    }
  },

  sendMessage: async (roomJid: string, body: string) => {
    const { backend } = get();

    if (!backend) {
      throw new Error('Backend not initialized');
    }

    try {
      return await backend.sendGroupchatMessage(roomJid, body);
    } catch (error) {
      console.error('[RoomsStore] Send message failed:', error);
      throw error;
    }
  },

  setRoomSubject: async (roomJid: string, subject: string) => {
    const { backend } = get();

    if (!backend) {
      throw new Error('Backend not initialized');
    }

    try {
      await backend.setRoomSubject(roomJid, subject);
    } catch (error) {
      console.error('[RoomsStore] Set subject failed:', error);
      throw error;
    }
  },

  // Queries
  getRoom: (roomJid: string) => {
    return get().rooms.get(roomJid);
  },

  getJoinedRooms: () => {
    const { rooms } = get();
    return Array.from(rooms.values()).filter((room: RoomState) => room.joined);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectRoom = (roomJid: string) => (state: RoomsStore) =>
  state.rooms.get(roomJid);

export const selectRoomOccupants = (roomJid: string) => (state: RoomsStore) =>
  state.rooms.get(roomJid)?.occupants || [];

export const selectIsJoined = (roomJid: string) => (state: RoomsStore) =>
  state.rooms.get(roomJid)?.joined || false;

export const selectJoinedRooms = (state: RoomsStore) =>
  Array.from(state.rooms.values()).filter((room) => room.joined);

export const selectAllRooms = (state: RoomsStore) =>
  Array.from(state.rooms.values());
