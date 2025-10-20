/**
 * Entity Transformers
 * Bidirectional conversion between XMPP and REST representations
 *
 * DESIGN PRINCIPLE: XMPP is canonical format, REST is derived
 */

import type {
  XMPPUser,
  XMPPRoom,
  ForceMetadata,
  OpenFireUser,
  OpenFireGroup,
  OpenFireRoom,
} from '@war-rooms/backend-interface';

// ============================================================================
// JID Helper Utilities
// ============================================================================

/**
 * Extract username from XMPP JID
 * @example extractUsername("commander.red@wargame.local") => "commander.red"
 */
export function extractUsername(jid: string): string {
  const match = jid.match(/^([^@]+)@/);
  if (!match || !match[1]) {
    throw new Error(`Invalid JID format: ${jid}`);
  }
  return match[1];
}

/**
 * Build bare JID from username and domain
 * @example buildBareJid("analyst.blue1", "wargame.local") => "analyst.blue1@wargame.local"
 */
export function buildBareJid(username: string, domain: string): string {
  return `${username}@${domain}`;
}

/**
 * Extract room name from MUC JID
 * @example extractRoomName("red-command@conference.wargame.local") => "red-command"
 */
export function extractRoomName(roomJid: string): string {
  const match = roomJid.match(/^([^@]+)@/);
  if (!match || !match[1]) {
    throw new Error(`Invalid room JID format: ${roomJid}`);
  }
  return match[1];
}

/**
 * Build room JID from name and conference service
 * @example buildRoomJid("all-hands", "conference.wargame.local") => "all-hands@conference.wargame.local"
 */
export function buildRoomJid(roomName: string, conferenceService: string): string {
  return `${roomName}@${conferenceService}`;
}

// ============================================================================
// User Transformers
// ============================================================================

/**
 * Transform XMPP user to OpenFire REST representation
 */
export function xmppUserToRest(xmppUser: XMPPUser): Omit<OpenFireUser, 'password'> {
  const username = extractUsername(xmppUser.bare_jid);
  const name = xmppUser.vcard?.fn || xmppUser.name;
  const email = xmppUser.vcard?.email;

  const result: Omit<OpenFireUser, 'password'> = {
    username,
    properties: {
      sharedGroups: xmppUser.groups || [],
    },
  };

  if (name) result.name = name;
  if (email) result.email = email;

  return result;
}

/**
 * Transform OpenFire REST user to XMPP representation
 */
export function restUserToXmpp(restUser: OpenFireUser, domain: string): XMPPUser {
  const bareJid = buildBareJid(restUser.username, domain);

  const result: XMPPUser = {
    jid: bareJid,
    bare_jid: bareJid,
    name: restUser.name || restUser.username,
    subscription: 'both',
    groups: restUser.properties?.sharedGroups || [],
  };

  if (restUser.name || restUser.email) {
    result.vcard = {};
    if (restUser.name) result.vcard.fn = restUser.name;
    if (restUser.email) result.vcard.email = restUser.email;
  }

  return result;
}

// ============================================================================
// Room Transformers
// ============================================================================

/**
 * Transform XMPP room to OpenFire REST representation
 */
export function xmppRoomToRest(
  xmppRoom: XMPPRoom,
  _conferenceService: string
): OpenFireRoom {
  const roomName = extractRoomName(xmppRoom.jid);
  const config = xmppRoom.info.x || {};

  const result: OpenFireRoom = {
    roomName,
    naturalName: xmppRoom.info.identity.name,
    persistent: config['muc#roomconfig_persistentroom'] ?? true,
    publicRoom: config['muc#roomconfig_publicroom'] ?? true,
    membersOnly: config['muc#roomconfig_membersonly'] ?? false,
  };

  const description = config.description || config['muc#roomconfig_roomdesc'];
  if (description) result.description = description;
  if (config['muc#roomconfig_maxusers']) result.maxUsers = config['muc#roomconfig_maxusers'];
  if (config['muc#roomconfig_moderatedroom'] !== undefined) result.moderated = config['muc#roomconfig_moderatedroom'];
  if (config['muc#roomconfig_members']) result.members = config['muc#roomconfig_members'];
  if (config['muc#roomconfig_admins']) result.admins = config['muc#roomconfig_admins'];

  return result;
}

/**
 * Transform OpenFire REST room to XMPP representation
 */
export function restRoomToXmpp(
  restRoom: OpenFireRoom,
  conferenceService: string
): XMPPRoom {
  const roomJid = buildRoomJid(restRoom.roomName, conferenceService);

  const x: Record<string, unknown> = {};
  if (restRoom.description) x.description = restRoom.description;
  if (restRoom.persistent !== undefined) x['muc#roomconfig_persistentroom'] = restRoom.persistent;
  if (restRoom.publicRoom !== undefined) x['muc#roomconfig_publicroom'] = restRoom.publicRoom;
  if (restRoom.membersOnly !== undefined) x['muc#roomconfig_membersonly'] = restRoom.membersOnly;
  if (restRoom.maxUsers) x['muc#roomconfig_maxusers'] = restRoom.maxUsers;
  if (restRoom.moderated !== undefined) x['muc#roomconfig_moderatedroom'] = restRoom.moderated;
  if (restRoom.members) x['muc#roomconfig_members'] = restRoom.members;
  if (restRoom.admins) x['muc#roomconfig_admins'] = restRoom.admins;

  return {
    jid: roomJid,
    info: {
      identity: {
        category: 'conference',
        type: 'text',
        name: restRoom.naturalName,
      },
      features: ['http://jabber.org/protocol/muc'],
      ...(Object.keys(x).length > 0 && { x }),
    },
  };
}

// ============================================================================
// Group/Force Transformers
// ============================================================================

/**
 * Convert force metadata to OpenFire REST group
 */
export function forceToRestGroup(
  force: ForceMetadata,
  members: string[]
): OpenFireGroup {
  return {
    name: force.id,
    description: force.name,
    members,
    admins: [],
  };
}

/**
 * Derive REST groups from XMPP roster
 * Extracts all unique groups and their members
 */
export function deriveRestGroupsFromRoster(users: XMPPUser[]): OpenFireGroup[] {
  const groupMap = new Map<string, Set<string>>();
  
  // Build map of groups to members
  for (const user of users) {
    const username = extractUsername(user.bare_jid);
    
    for (const groupName of user.groups || []) {
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, new Set());
      }
      groupMap.get(groupName)!.add(username);
    }
  }
  
  // Convert to OpenFireGroup array
  return Array.from(groupMap.entries()).map(([name, memberSet]) => ({
    name,
    description: `Roster group: ${name}`,
    members: Array.from(memberSet),
    admins: [],
  }));
}
