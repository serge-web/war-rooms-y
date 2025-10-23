/**
 * Metadata State Store
 * Manages PubSub metadata (game, forces, rooms, forms) using Zustand
 */

import { create } from 'zustand';
import type {
  PubSubMetadata,
  GameMetadata,
  GameTheme,
  ForceMetadata,
  RoomExtension,
  FormSchema,
} from '@war-rooms/backend-interface';

// ============================================================================
// Store State
// ============================================================================

export interface MetadataStore {
  // State
  pubsub: PubSubMetadata | null;

  game: GameMetadata | null;
  gameTheme: GameTheme | null;
  forces: Map<string, ForceMetadata>;
  roomExtensions: Map<string, RoomExtension>;
  formSchemas: Map<string, FormSchema>;

  loading: {
    game: boolean;
    gameTheme: boolean;
    forces: boolean;
    roomExtensions: boolean;
    formSchemas: boolean;
  };

  // Actions
  setPubSub: (pubsub: PubSubMetadata) => void;

  // Game
  loadGame: () => Promise<void>;
  updateGame: (game: GameMetadata) => Promise<void>;

  // Game Theme
  loadGameTheme: () => Promise<void>;
  updateGameTheme: (theme: GameTheme) => Promise<void>;

  // Forces
  loadForces: () => Promise<void>;
  updateForce: (force: ForceMetadata) => Promise<void>;
  deleteForce: (forceId: string) => Promise<void>;

  // Room Extensions
  loadRoomExtensions: () => Promise<void>;
  getRoomExtension: (roomJid: string) => RoomExtension | undefined;
  updateRoomExtension: (extension: RoomExtension) => Promise<void>;

  // Form Schemas
  loadFormSchemas: () => Promise<void>;
  getFormSchema: (schemaId: string) => FormSchema | undefined;
  updateFormSchema: (schema: FormSchema) => Promise<void>;
  deleteFormSchema: (schemaId: string) => Promise<void>;

  // Subscriptions
  subscribeAll: () => Promise<void>;
  unsubscribeAll: () => Promise<void>;
}

// ============================================================================
// Store
// ============================================================================

export const useMetadataStore = create<MetadataStore>((set, get) => ({
  // Initial state
  pubsub: null,
  game: null,
  gameTheme: null,
  forces: new Map(),
  roomExtensions: new Map(),
  formSchemas: new Map(),
  loading: {
    game: false,
    gameTheme: false,
    forces: false,
    roomExtensions: false,
    formSchemas: false,
  },

  // Actions
  setPubSub: (pubsub: PubSubMetadata) => {
    set({ pubsub });
  },

  // Game
  loadGame: async () => {
    const { pubsub } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    set((state) => ({ loading: { ...state.loading, game: true } }));

    try {
      const game = await pubsub.getGame();
      set({ game });
    } catch (error) {
      console.error('[MetadataStore] Load game failed:', error);
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, game: false } }));
    }
  },

  updateGame: async (game: GameMetadata) => {
    const { pubsub } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    try {
      await pubsub.setGame(game);
      set({ game });
    } catch (error) {
      console.error('[MetadataStore] Update game failed:', error);
      throw error;
    }
  },

  // Game Theme
  loadGameTheme: async () => {
    const { pubsub } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    set((state) => ({ loading: { ...state.loading, gameTheme: true } }));

    try {
      const gameTheme = await pubsub.getGameTheme();
      set({ gameTheme });
    } catch (error) {
      console.error('[MetadataStore] Load game theme failed:', error);
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, gameTheme: false } }));
    }
  },

  updateGameTheme: async (theme: GameTheme) => {
    const { pubsub } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    try {
      await pubsub.setGameTheme(theme);
      set({ gameTheme: theme });
    } catch (error) {
      console.error('[MetadataStore] Update game theme failed:', error);
      throw error;
    }
  },

  // Forces
  loadForces: async () => {
    const { pubsub } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    set((state) => ({ loading: { ...state.loading, forces: true } }));

    try {
      const forcesList = await pubsub.getForces();
      const forces = new Map(forcesList.map((f) => [f.id, f]));
      set({ forces });
    } catch (error) {
      console.error('[MetadataStore] Load forces failed:', error);
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, forces: false } }));
    }
  },

  updateForce: async (force: ForceMetadata) => {
    const { pubsub, forces } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    try {
      await pubsub.setForce(force);
      forces.set(force.id, force);
      set({ forces: new Map(forces) });
    } catch (error) {
      console.error('[MetadataStore] Update force failed:', error);
      throw error;
    }
  },

  deleteForce: async (forceId: string) => {
    const { pubsub, forces } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    try {
      await pubsub.deleteForce(forceId);
      forces.delete(forceId);
      set({ forces: new Map(forces) });
    } catch (error) {
      console.error('[MetadataStore] Delete force failed:', error);
      throw error;
    }
  },

  // Room Extensions
  loadRoomExtensions: async () => {
    const { pubsub } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    set((state) => ({ loading: { ...state.loading, roomExtensions: true } }));

    try {
      const extensionsList = await pubsub.getRoomExtensions();
      const roomExtensions = new Map(extensionsList.map((ext) => [ext.roomJid, ext]));
      set({ roomExtensions });
    } catch (error) {
      console.error('[MetadataStore] Load room extensions failed:', error);
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, roomExtensions: false } }));
    }
  },

  getRoomExtension: (roomJid: string) => {
    return get().roomExtensions.get(roomJid);
  },

  updateRoomExtension: async (extension: RoomExtension) => {
    const { pubsub, roomExtensions } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    try {
      await pubsub.setRoomExtension(extension);
      roomExtensions.set(extension.roomJid, extension);
      set({ roomExtensions: new Map(roomExtensions) });
    } catch (error) {
      console.error('[MetadataStore] Update room extension failed:', error);
      throw error;
    }
  },

  // Form Schemas
  loadFormSchemas: async () => {
    const { pubsub } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    set((state) => ({ loading: { ...state.loading, formSchemas: true } }));

    try {
      const schemasList = await pubsub.getFormSchemas();
      const formSchemas = new Map(schemasList.map((s) => [s.id, s]));
      set({ formSchemas });
    } catch (error) {
      console.error('[MetadataStore] Load form schemas failed:', error);
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, formSchemas: false } }));
    }
  },

  getFormSchema: (schemaId: string) => {
    return get().formSchemas.get(schemaId);
  },

  updateFormSchema: async (schema: FormSchema) => {
    const { pubsub, formSchemas } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    try {
      await pubsub.setFormSchema(schema);
      formSchemas.set(schema.id, schema);
      set({ formSchemas: new Map(formSchemas) });
    } catch (error) {
      console.error('[MetadataStore] Update form schema failed:', error);
      throw error;
    }
  },

  deleteFormSchema: async (schemaId: string) => {
    const { pubsub, formSchemas } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    try {
      await pubsub.deleteFormSchema(schemaId);
      formSchemas.delete(schemaId);
      set({ formSchemas: new Map(formSchemas) });
    } catch (error) {
      console.error('[MetadataStore] Delete form schema failed:', error);
      throw error;
    }
  },

  // Subscriptions
  subscribeAll: async () => {
    const { pubsub } = get();
    if (!pubsub) throw new Error('PubSub not initialized');

    try {
      // Subscribe to game metadata updates
      await pubsub.subscribeGame((update) => {
        set({ game: update.payload });
      });

      await pubsub.subscribeGameTheme((update) => {
        set({ gameTheme: update.payload });
      });

      await pubsub.subscribeForces((update) => {
        const { forces } = get();
        forces.set(update.payload.id, update.payload);
        set({ forces: new Map(forces) });
      });

      await pubsub.subscribeRoomExtensions((update) => {
        const { roomExtensions } = get();
        roomExtensions.set(update.payload.roomJid, update.payload);
        set({ roomExtensions: new Map(roomExtensions) });
      });

      await pubsub.subscribeFormSchemas((update) => {
        const { formSchemas } = get();
        formSchemas.set(update.payload.id, update.payload);
        set({ formSchemas: new Map(formSchemas) });
      });
    } catch (error) {
      console.error('[MetadataStore] Subscribe all failed:', error);
      throw error;
    }
  },

  unsubscribeAll: async () => {
    const { pubsub } = get();
    if (!pubsub) return;

    try {
      await pubsub.unsubscribeAll();
    } catch (error) {
      console.error('[MetadataStore] Unsubscribe all failed:', error);
      throw error;
    }
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectGame = (state: MetadataStore) => state.game;
export const selectGameTheme = (state: MetadataStore) => state.gameTheme;

export const selectForces = (state: MetadataStore) => Array.from(state.forces.values());

export const selectForce = (forceId: string) => (state: MetadataStore) => state.forces.get(forceId);

export const selectRoomExtensions = (state: MetadataStore) =>
  Array.from(state.roomExtensions.values());

export const selectRoomExtension = (roomJid: string) => (state: MetadataStore) =>
  state.roomExtensions.get(roomJid);

export const selectFormSchemas = (state: MetadataStore) => Array.from(state.formSchemas.values());

export const selectFormSchema = (schemaId: string) => (state: MetadataStore) =>
  state.formSchemas.get(schemaId);
