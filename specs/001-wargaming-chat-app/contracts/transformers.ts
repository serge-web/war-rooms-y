/**
 * Entity Transformation Contracts
 * Bidirectional conversion between XMPP and REST representations
 * 
 * DESIGN PRINCIPLE: XMPP is canonical format, REST is derived
 */

import type {
  XMPPUser,
  XMPPRoom,
  ForceMetadata,
  RoomExtension,
} from '@war-rooms/backend-interface';

import type {
  OpenFireUser,
  OpenFireGroup,
  OpenFireRoom,
} from '@war-rooms/backend-mock';

// ============================================================================
// User Transformers
// ============================================================================

/**
 * Transform XMPP user to OpenFire REST representation
 * 
 * @param xmppUser - Canonical XMPP user from fixtures
 * @returns OpenFire REST user (without password)
 * 
 * @example
 * ```ts
 * const xmpp = {
 *   bare_jid: "commander.red@wargame.local",
 *   name: "Red Force Commander",
 *   groups: ["Red Force", "Commanders"],
 *   vcard: { fn: "Commander Red", email: "red@example.com" }
 * };
 * const rest = xmppUserToRest(xmpp);
 * // => { username: "commander.red", name: "Commander Red", 
 * //      email: "red@example.com", properties: { sharedGroups: [...] }}
 * ```
 */
export function xmppUserToRest(xmppUser: XMPPUser): Omit<OpenFireUser, 'password'>;

/**
 * Transform OpenFire REST user to XMPP representation
 * 
 * @param restUser - OpenFire user from REST API
 * @param domain - XMPP domain for JID construction
 * @returns XMPP user with reconstructed JID
 * 
 * @example
 * ```ts
 * const rest = {
 *   username: "commander.blue",
 *   name: "Commander Blue",
 *   properties: { sharedGroups: ["Blue Force"] }
 * };
 * const xmpp = restUserToXmpp(rest, "wargame.local");
 * // => { bare_jid: "commander.blue@wargame.local", ... }
 * ```
 */
export function restUserToXmpp(restUser: OpenFireUser, domain: string): XMPPUser;

// ============================================================================
// Group/Force Transformers
// ============================================================================

/**
 * Extract OpenFire group from XMPP roster groups + force metadata
 * 
 * @param force - Force metadata from PubSub
 * @param members - Usernames of group members (from user transforms)
 * @returns OpenFire group representation
 * 
 * @example
 * ```ts
 * const force = {
 *   id: "force-red",
 *   name: "Red Force",
 *   description: "Eastern coalition forces"
 * };
 * const group = forceToRestGroup(force, ["commander.red", "analyst.red1"]);
 * // => { name: "force-red", description: "Red Force", members: [...] }
 * ```
 */
export function forceToRestGroup(
  force: ForceMetadata,
  members: string[]
): OpenFireGroup;

/**
 * Derive roster groups from OpenFire groups
 * 
 * @param users - Collection of XMPP users
 * @returns Map of group names to OpenFire groups
 * 
 * @example
 * ```ts
 * const users = [
 *   { bare_jid: "user1@domain", groups: ["Red Force", "Commanders"] },
 *   { bare_jid: "user2@domain", groups: ["Red Force", "Analysts"] }
 * ];
 * const groups = deriveRestGroupsFromRoster(users);
 * // => [
 * //   { name: "Red Force", members: ["user1", "user2"] },
 * //   { name: "Commanders", members: ["user1"] },
 * //   { name: "Analysts", members: ["user2"] }
 * // ]
 * ```
 */
export function deriveRestGroupsFromRoster(users: XMPPUser[]): OpenFireGroup[];

// ============================================================================
// Room Transformers
// ============================================================================

/**
 * Transform XMPP room to OpenFire REST representation
 * 
 * @param xmppRoom - Canonical XMPP room from fixtures
 * @param conferenceService - MUC conference service domain
 * @returns OpenFire REST room
 * 
 * Transformation rules:
 * - roomName ← parse JID before "@"
 * - naturalName ← info.identity.name
 * - membersOnly ← true if forceRestrictions defined
 * - members ← derived from users in allowed forces
 * 
 * @example
 * ```ts
 * const xmpp = {
 *   jid: "red-command@conference.wargame.local",
 *   info: { identity: { name: "Red Force Command" } },
 *   extension: { 
 *     type: "command",
 *     forceRestrictions: ["force-red"]
 *   }
 * };
 * const rest = xmppRoomToRest(xmpp, "conference.wargame.local");
 * // => { roomName: "red-command", naturalName: "Red Force Command",
 * //      membersOnly: true, ... }
 * ```
 */
export function xmppRoomToRest(
  xmppRoom: XMPPRoom,
  conferenceService: string
): OpenFireRoom;

/**
 * Transform OpenFire REST room to XMPP representation
 * 
 * @param restRoom - OpenFire room from REST API
 * @param conferenceService - MUC conference service domain
 * @returns XMPP room with reconstructed JID
 * 
 * @example
 * ```ts
 * const rest = {
 *   roomName: "blue-operations",
 *   naturalName: "Blue Operations Center",
 *   membersOnly: true,
 *   members: ["commander.blue@wargame.local"]
 * };
 * const xmpp = restRoomToXmpp(rest, "conference.wargame.local");
 * // => { jid: "blue-operations@conference.wargame.local", ... }
 * ```
 */
export function restRoomToXmpp(
  restRoom: OpenFireRoom,
  conferenceService: string
): XMPPRoom;

// ============================================================================
// Validation & Round-Trip Testing
// ============================================================================

/**
 * Validate XMPP → REST → XMPP round-trip preserves core fields
 * 
 * Used in tests to ensure no data loss during transformation
 * 
 * @param original - Original XMPP entity
 * @param roundTrip - Result after REST transformation and back
 * @returns Validation errors (empty if valid)
 * 
 * @example
 * ```ts
 * const original = MOCK_USERS[0];
 * const rest = xmppUserToRest(original);
 * const roundTrip = restUserToXmpp(rest, MOCK_DOMAIN);
 * const errors = validateRoundTrip(original, roundTrip);
 * expect(errors).toEqual([]);
 * ```
 */
export function validateUserRoundTrip(
  original: XMPPUser,
  roundTrip: XMPPUser
): string[];

export function validateRoomRoundTrip(
  original: XMPPRoom,
  roundTrip: XMPPRoom
): string[];

// ============================================================================
// Helper Utilities
// ============================================================================

/**
 * Extract username from XMPP JID
 * 
 * @param jid - Full or bare JID
 * @returns Username portion (before "@")
 * 
 * @example
 * ```ts
 * extractUsername("commander.red@wargame.local") // => "commander.red"
 * extractUsername("user@domain/resource")        // => "user"
 * ```
 */
export function extractUsername(jid: string): string;

/**
 * Build bare JID from username and domain
 * 
 * @param username - Local part of JID
 * @param domain - XMPP domain
 * @returns Bare JID (username@domain)
 * 
 * @example
 * ```ts
 * buildBareJid("analyst.blue1", "wargame.local")
 * // => "analyst.blue1@wargame.local"
 * ```
 */
export function buildBareJid(username: string, domain: string): string;

/**
 * Extract room name from MUC JID
 * 
 * @param roomJid - Full room JID
 * @returns Room name (before "@")
 * 
 * @example
 * ```ts
 * extractRoomName("red-command@conference.wargame.local")
 * // => "red-command"
 * ```
 */
export function extractRoomName(roomJid: string): string;

/**
 * Build room JID from name and conference service
 * 
 * @param roomName - Room name
 * @param conferenceService - Conference domain
 * @returns Full room JID
 * 
 * @example
 * ```ts
 * buildRoomJid("all-hands", "conference.wargame.local")
 * // => "all-hands@conference.wargame.local"
 * ```
 */
export function buildRoomJid(roomName: string, conferenceService: string): string;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if user has required XMPP fields
 */
export function isValidXmppUser(user: unknown): user is XMPPUser;

/**
 * Check if user has required REST fields
 */
export function isValidRestUser(user: unknown): user is OpenFireUser;

/**
 * Check if room has required XMPP fields
 */
export function isValidXmppRoom(room: unknown): room is XMPPRoom;

/**
 * Check if room has required REST fields
 */
export function isValidRestRoom(room: unknown): room is OpenFireRoom;
