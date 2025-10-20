/**
 * OpenFire REST API Types
 * Type definitions for OpenFire REST API v1.12.0
 *
 * These types represent the REST protocol view of entities.
 * The canonical source is XMPP types - these are derived via transformers.
 */

// ============================================================================
// User Types
// ============================================================================

/**
 * OpenFire REST API User
 *
 * Maps to XMPPUser via transformers:
 * - username ← parse bare_jid before "@"
 * - name ← vcard.fn
 * - email ← vcard.email
 * - properties.sharedGroups ↔ groups
 */
export interface OpenFireUser {
  username: string;
  name?: string;
  email?: string;
  password?: string; // Only for creation/update
  properties?: {
    sharedGroups?: string[];
    [key: string]: unknown;
  };
}

// ============================================================================
// Group Types
// ============================================================================

/**
 * OpenFire REST API Group
 *
 * Maps to ForceMetadata + roster groups:
 * - name ↔ Force.id
 * - description ↔ Force.description
 * - members derived from Users with this group
 */
export interface OpenFireGroup {
  name: string;
  description?: string;
  members?: string[]; // Usernames
  admins?: string[]; // Usernames
}

// ============================================================================
// Room Types
// ============================================================================

/**
 * OpenFire REST API Room (MUC)
 *
 * Maps to XMPPRoom via transformers:
 * - roomName ← parse jid before "@"
 * - naturalName ↔ info.identity.name
 * - membersOnly ← forceRestrictions present
 * - members derived from users in allowed forces
 */
export interface OpenFireRoom {
  roomName: string;
  naturalName: string;
  description?: string;
  subject?: string;
  creationDate?: string;
  modificationDate?: string;
  maxUsers?: number;
  persistent?: boolean;
  publicRoom?: boolean;
  registrationEnabled?: boolean;
  canAnyoneDiscoverJID?: boolean;
  canOccupantsChangeSubject?: boolean;
  canOccupantsInvite?: boolean;
  canChangeNickname?: boolean;
  logEnabled?: boolean;
  loginRestrictedToNickname?: boolean;
  membersOnly?: boolean;
  moderated?: boolean;
  broadcastPresenceRoles?: string[];
  owners?: string[]; // JIDs
  admins?: string[]; // JIDs
  members?: string[]; // JIDs
  outcasts?: string[]; // JIDs
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  startIndex?: number;
  count?: number;
  search?: string;
}

// ============================================================================
// Re-exports from backend-mock
// ============================================================================

/**
 * These types are defined in backend-mock since they're implementation-specific.
 * Re-exported here for convenience.
 */
export type { OpenFireUser as RestUser } from './rest';
export type { OpenFireGroup as RestGroup } from './rest';
export type { OpenFireRoom as RestRoom } from './rest';
