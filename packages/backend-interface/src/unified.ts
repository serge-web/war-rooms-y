/**
 * Unified Data Model
 * Single source of truth for all entities, with protocol-specific projections
 */

import type { Theme } from '@mui/material/styles';

// ============================================================================
// Unified Room Entity
// ============================================================================

/**
 * Complete room data model that contains all fields needed by:
 * - XMPP protocol (MUC configuration)
 * - REST API (OpenFire representation)
 * - PubSub metadata (wargaming extensions)
 */
export interface UnifiedRoom {
  // Core Identity
  /** Room ID (e.g., 'red-command') - used as storage key */
  id: string;

  /** Full JID (e.g., 'red-command@conference.wargame.local') */
  jid: string;

  // Display Information
  /** Natural room name for display */
  name: string;

  /** Room description */
  description?: string;

  // XMPP Protocol Fields
  xmpp: {
    /** Room persists when empty */
    persistent: boolean;

    /** Room appears in public listings */
    publicRoom: boolean;

    /** Only members can join */
    membersOnly: boolean;

    /** Messages are moderated */
    moderated: boolean;

    /** Maximum occupants */
    maxUsers?: number;

    /** Current room subject/topic */
    subject?: string;

    /** Password for room entry */
    password?: string;

    /** Allow occupants to change subject */
    changeSubject?: boolean;
  };

  // Wargaming Extensions (PubSub metadata)
  wargaming: {
    /** Room classification */
    type: 'standard' | 'all-hands' | 'private' | 'command';

    /** Group/Force IDs with access (e.g., ['force-red', 'force-blue']) */
    groupMembers?: string[];

    /** Individual usernames with access (e.g., ['commander.red']) */
    individualMembers?: string[];

    /** Form template IDs allowed in this room */
    formTemplates?: string[];

    /** Room-specific theme override */
    theme?: Partial<Theme>;
  };

  // Audit Fields
  /** ISO 8601 timestamp */
  createdAt: string;

  /** Creator JID */
  createdBy: string;

  /** ISO 8601 timestamp */
  modifiedAt?: string;

  /** Modifier JID */
  modifiedBy?: string;
}

// ============================================================================
// Unified Force Entity
// ============================================================================

/**
 * Complete force/group data model
 */
export interface UnifiedForce {
  // Core Identity
  /** Force ID (e.g., 'force-red') - used as storage key */
  id: string;

  /** Display name */
  name: string;

  /** Force description */
  description?: string;

  // Visual Identity
  /** Force color (hex) */
  color: string;

  /** Material icon name */
  icon: string;

  // Membership
  /** Usernames of force members */
  members: string[];

  /** Usernames of force admins */
  admins?: string[];

  // Wargaming Data
  /** Strategic objectives */
  objectives?: string[];

  /** Force-specific metadata */
  metadata?: Record<string, unknown>;

  // Audit Fields
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

// ============================================================================
// Unified User Entity
// ============================================================================

/**
 * Complete user data model
 */
export interface UnifiedUser {
  // Core Identity
  /** Username (e.g., 'commander.red') - used as storage key */
  username: string;

  /** Full JID when connected */
  jid?: string;

  // Profile
  /** Display name */
  name?: string;

  /** Email address */
  email?: string;

  /** Password (only stored in mock, never returned) */
  password?: string;

  // Organization
  /** Force/group memberships */
  groups: string[];

  /** Is user a game master */
  isGameMaster?: boolean;

  // vCard Data
  vcard?: {
    /** Full name */
    fn?: string;

    /** Nickname */
    nickname?: string;

    /** Photo (base64 or URL) */
    photo?: string;

    /** Organization */
    org?: string;

    /** Title/role */
    title?: string;
  };

  // Presence
  presence?: {
    show?: 'away' | 'chat' | 'dnd' | 'xa';
    status?: string;
    priority?: number;
  };

  // Audit Fields
  createdAt: string;
  createdBy?: string;
  modifiedAt?: string;
  lastSeen?: string;
}

// ============================================================================
// Unified Form Template Entity
// ============================================================================

/**
 * Form template for structured messaging
 */
export interface UnifiedFormTemplate {
  /** Template ID (e.g., 'sitrep') */
  id: string;

  /** Display name */
  name: string;

  /** Template description */
  description?: string;

  /** JSON Schema for form structure */
  schema: object;

  /** UI Schema for form rendering */
  uiSchema?: object;

  /** Template category */
  category?: string;

  /** Forces that can use this template */
  allowedForces?: string[];

  // Audit Fields
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  version?: number;
}

// ============================================================================
// Storage Keys
// ============================================================================

export const UNIFIED_KEYS = {
  ROOM: (id: string) => `entities/rooms/${id}`,
  FORCE: (id: string) => `entities/forces/${id}`,
  USER: (username: string) => `entities/users/${username}`,
  TEMPLATE: (id: string) => `entities/templates/${id}`,

  // List indices
  ROOMS_LIST: 'entities/rooms/_index',
  FORCES_LIST: 'entities/forces/_index',
  USERS_LIST: 'entities/users/_index',
  TEMPLATES_LIST: 'entities/templates/_index',
};
