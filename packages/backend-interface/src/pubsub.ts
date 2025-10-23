/**
 * PubSub Operations Interface
 * Higher-level typed operations for War Rooms metadata (XEP-0060 + XEP-0335 JSON)
 */

import type { Theme } from '@mui/material/styles';

// ============================================================================
// PubSub Node Structure
// ============================================================================

/**
 * Standard PubSub node paths for War Rooms metadata
 */
export const PUBSUB_NODES = {
  GAME: '/war-rooms/game',
  GAME_THEME: '/war-rooms/game/theme',
  FORCES: '/war-rooms/forces',
  ROOMS: '/war-rooms/rooms',
} as const;

// ============================================================================
// Game Metadata (XEP-0335 JSON Container)
// ============================================================================

export interface GameMetadata {
  /** Unique game instance ID */
  id: string;

  /** Game title/name */
  title: string;

  /** Game description */
  description?: string;

  /** ISO 8601 timestamp */
  startTime?: string;

  /** ISO 8601 timestamp */
  endTime?: string;

  /** Game state */
  status: 'setup' | 'active' | 'paused' | 'completed' | 'archived';

  /** Game master/facilitator JIDs */
  gameMasters: string[];

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  createdAt: string;

  /** Creator JID */
  createdBy: string;

  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Global game theme (applied to all rooms unless overridden)
 * Stored as Partial<Theme> from Material UI
 */
export type GameTheme = Partial<Theme>;

// ============================================================================
// Force Metadata (XEP-0335 JSON Container)
// ============================================================================

export interface ForceMetadata {
  /** Unique force ID */
  id: string;

  /** Force name (e.g., "Red Force", "Blue Force") */
  name: string;

  /** Force description */
  description?: string;

  /** Force color for UI (hex) */
  color?: string;

  /** Member JIDs */
  members: string[];

  /** Force commander JID */
  commander?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  createdAt: string;

  /** Creator JID */
  createdBy: string;
}

// ============================================================================
// Room Extension Metadata (XEP-0335 JSON Container)
// ============================================================================

export interface RoomExtension {
  /** Room JID this extension applies to */
  roomJid: string;

  /** Room type classification */
  type: 'standard' | 'all-hands' | 'private' | 'command';

  /** Room-specific theme override (Material UI Partial<Theme>) */
  theme?: Partial<Theme>;

  /** Form schema IDs allowed in this room */
  formSchemaIds?: string[];

  /** Force IDs with access restrictions */
  forceRestrictions?: string[];

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  createdAt: string;

  /** Creator JID */
  createdBy: string;

  /** Archive timestamp (for soft-delete) */
  archivedAt?: string;
}

// ============================================================================
// Form Schema Metadata (XEP-0335 JSON Container)
// ============================================================================

export interface FormSchema {
  /** Unique schema ID */
  id: string;

  /** Schema title */
  title: string;

  /** Schema description */
  description?: string;

  /** JSON Schema object (for RJSF) */
  schema: Record<string, unknown>;

  /** UI Schema object (for RJSF) */
  uiSchema?: Record<string, unknown>;

  /** Icon identifier */
  icon?: string;

  /** Tags/categories */
  tags?: string[];

  /** Creation timestamp */
  createdAt: string;

  /** Creator JID */
  createdBy: string;

  /** Last update timestamp */
  updatedAt?: string;
}

// ============================================================================
// PubSub Update Events
// ============================================================================

export interface PubSubUpdate<T> {
  /** Node path */
  node: string;

  /** Item ID */
  itemId: string;

  /** Payload */
  payload: T;

  /** Publisher JID */
  publisher?: string;

  /** Publication timestamp */
  timestamp: string;
}

// ============================================================================
// PubSub Metadata Operations Interface
// ============================================================================

export interface PubSubMetadata {
  // ===== Game Operations =====

  /**
   * Get current game metadata
   */
  getGame(): Promise<GameMetadata | null>;

  /**
   * Update game metadata
   */
  setGame(game: GameMetadata): Promise<void>;

  /**
   * Get global game theme
   */
  getGameTheme(): Promise<GameTheme | null>;

  /**
   * Update global game theme
   */
  setGameTheme(theme: GameTheme): Promise<void>;

  /**
   * Subscribe to game metadata updates
   */
  subscribeGame(callback: (update: PubSubUpdate<GameMetadata>) => void): Promise<void>;

  /**
   * Subscribe to game theme updates
   */
  subscribeGameTheme(callback: (update: PubSubUpdate<GameTheme>) => void): Promise<void>;

  // ===== Force Operations =====

  /**
   * Get all forces
   */
  getForces(): Promise<ForceMetadata[]>;

  /**
   * Get single force by ID
   */
  getForce(forceId: string): Promise<ForceMetadata | null>;

  /**
   * Create or update force
   */
  setForce(force: ForceMetadata): Promise<void>;

  /**
   * Delete force
   */
  deleteForce(forceId: string): Promise<void>;

  /**
   * Subscribe to force updates
   */
  subscribeForces(callback: (update: PubSubUpdate<ForceMetadata>) => void): Promise<void>;

  // ===== Room Extension Operations =====

  /**
   * Get all room extensions
   */
  getRoomExtensions(): Promise<RoomExtension[]>;

  /**
   * Get room extension for specific room
   */
  getRoomExtension(roomJid: string): Promise<RoomExtension | null>;

  /**
   * Create or update room extension
   */
  setRoomExtension(extension: RoomExtension): Promise<void>;

  /**
   * Delete room extension (soft-delete by setting archivedAt)
   */
  archiveRoomExtension(roomJid: string): Promise<void>;

  /**
   * Subscribe to room extension updates
   */
  subscribeRoomExtensions(callback: (update: PubSubUpdate<RoomExtension>) => void): Promise<void>;

  // ===== Form Schema Operations =====

  /**
   * Get all form schemas
   */
  getFormSchemas(): Promise<FormSchema[]>;

  /**
   * Get single form schema by ID
   */
  getFormSchema(schemaId: string): Promise<FormSchema | null>;

  /**
   * Create or update form schema
   */
  setFormSchema(schema: FormSchema): Promise<void>;

  /**
   * Delete form schema
   */
  deleteFormSchema(schemaId: string): Promise<void>;

  /**
   * Subscribe to form schema updates
   */
  subscribeFormSchemas(callback: (update: PubSubUpdate<FormSchema>) => void): Promise<void>;

  // ===== Cleanup =====

  /**
   * Unsubscribe from all PubSub nodes
   */
  unsubscribeAll(): Promise<void>;
}
