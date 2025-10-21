/**
 * Mock Data Seeder
 * Load fixtures into mock backend storage
 */

import type { Storage } from './storage';
import type { XMPPUser, XMPPRoom } from '@war-rooms/backend-interface';
import {
  MOCK_USERS,
  MOCK_FORCES,
  MOCK_GAME,
  MOCK_GAME_THEME,
  MOCK_ROOMS,
  MOCK_MESSAGES,
  MOCK_FORM_SCHEMAS,
} from './fixtures';
import { getBareJid } from './helpers';
import {
  xmppUserToRest,
  xmppRoomToRest,
  deriveRestGroupsFromRoster,
  extractUsername,
  extractRoomName,
} from './rest/transformers';

// ============================================================================
// Seed Operations
// ============================================================================

export interface SeedOptions {
  /** Clear existing data before seeding */
  clear?: boolean;

  /** Seed users (roster) */
  users?: boolean;

  /** Seed game metadata */
  game?: boolean;

  /** Seed forces */
  forces?: boolean;

  /** Seed rooms */
  rooms?: boolean;

  /** Seed messages */
  messages?: boolean;

  /** Seed form schemas */
  forms?: boolean;

  /** Seed REST representations (for admin-ui) */
  rest?: boolean;

  /** XMPP domain (required for REST seeding) */
  domain?: string;

  /** Conference service (required for REST room seeding) */
  conferenceService?: string;
}

export const DEFAULT_SEED_OPTIONS: SeedOptions = {
  clear: true,
  users: true,
  game: true,
  forces: true,
  rooms: true,
  messages: true,
  forms: true,
  rest: true,
  domain: 'wargame.local',
  conferenceService: 'conference.wargame.local',
};

// ============================================================================
// REST Seeding Functions (T020-T022)
// ============================================================================

/**
 * Seed REST users from XMPP roster
 * Transforms all users in roster/* to rest:user:* format
 *
 * @param storage Storage instance
 * @param _domain XMPP domain (not currently used, JIDs already in storage)
 */
export async function seedRestUsers(storage: Storage, _domain: string): Promise<void> {
  // Load all XMPP users from roster
  const xmppUsers = await storage.getAll<XMPPUser>('roster/');
  const usernames: string[] = [];

  // Transform each XMPP user to REST format
  for (const [key, xmppUser] of Object.entries(xmppUsers)) {
    const restUser = xmppUserToRest(xmppUser);
    // Key is like "roster/user1@wargame.local", extract JID part after "roster/"
    const jid = key.replace('roster/', '');
    const username = extractUsername(jid);

    // Store REST user
    await storage.setItem(`rest:user:${username}`, restUser);
    usernames.push(username);
  }

  // Store user list index
  await storage.setItem('rest:users:list', usernames);
}

/**
 * Seed REST groups from XMPP roster memberships
 * Derives groups from user.groups arrays across all roster entries
 *
 * @param storage Storage instance
 * @param _domain XMPP domain (not currently used)
 */
export async function seedRestGroups(storage: Storage, _domain: string): Promise<void> {
  // Load all XMPP users
  const xmppUsers = await storage.getAll<XMPPUser>('roster/');
  const userArray = Object.values(xmppUsers);

  // Derive groups using transformer
  const groups = deriveRestGroupsFromRoster(userArray);

  // Store each group
  for (const group of groups) {
    await storage.setItem(`rest:group:${group.name}`, group);
  }

  // Store group list index
  await storage.setItem(
    'rest:groups:list',
    groups.map((g) => g.name)
  );
}

/**
 * Seed REST rooms from XMPP room info
 * Transforms all rooms in rooms/* to rest:room:* format
 *
 * @param storage Storage instance
 * @param conferenceService MUC service domain
 */
export async function seedRestRooms(storage: Storage, conferenceService: string): Promise<void> {
  // Get all room JIDs
  const roomKeys = await storage.keys('rooms/');
  const roomJids = new Set<string>();

  // Extract unique room JIDs (keys are like "rooms/{jid}/info" or "rooms/{jid}/occupants/{nick}")
  for (const key of roomKeys) {
    const match = key.match(/^rooms\/([^/]+)/);
    if (match && match[1]) {
      roomJids.add(match[1]);
    }
  }

  const roomNames: string[] = [];

  // Transform each XMPP room to REST format
  for (const roomJid of roomJids) {
    // Try to load full room first (test format), then fall back to info only (production format)
    let xmppRoom = await storage.getItem<XMPPRoom>(`rooms/${roomJid}`);

    if (!xmppRoom) {
      const roomInfo = await storage.getItem<XMPPRoom['info']>(`rooms/${roomJid}/info`);
      if (!roomInfo) continue;

      // Reconstruct XMPPRoom structure for transformer
      xmppRoom = {
        jid: roomJid,
        info: roomInfo,
      };
    }

    const restRoom = xmppRoomToRest(xmppRoom, conferenceService);
    const roomName = extractRoomName(roomJid);

    // Store REST room
    await storage.setItem(`rest:room:${roomName}`, restRoom);
    roomNames.push(roomName);
  }

  // Store room list index
  await storage.setItem('rest:rooms:list', roomNames);
}

/**
 * Seed all REST representations from XMPP data (T023)
 * Master function that transforms entire XMPP dataset to REST format
 *
 * @param storage Storage instance
 * @param domain XMPP domain
 * @param conferenceService MUC service domain
 */
export async function seedRestFromXmpp(
  storage: Storage,
  domain: string,
  conferenceService: string
): Promise<void> {
  await seedRestUsers(storage, domain);
  await seedRestGroups(storage, domain);
  await seedRestRooms(storage, conferenceService);
}

// ============================================================================
// XMPP Seeding (Original)
// ============================================================================

/**
 * Seed mock backend with fixture data
 */
export async function seedMockData(
  storage: Storage,
  options: SeedOptions = DEFAULT_SEED_OPTIONS
): Promise<void> {
  const opts = { ...DEFAULT_SEED_OPTIONS, ...options };

  // Clear existing data if requested
  if (opts.clear) {
    await storage.clear();
  }

  // Seed users (roster)
  if (opts.users) {
    for (const user of MOCK_USERS) {
      const bareJid = getBareJid(user.jid);
      await storage.setItem(`roster/${bareJid}`, user);
    }
  }

  // Seed game metadata
  if (opts.game) {
    await storage.setItem('pubsub/nodes//war-rooms/game/items/current', {
      id: 'current',
      payload: MOCK_GAME,
      publishedAt: MOCK_GAME.createdAt,
      publisher: MOCK_GAME.createdBy,
    });

    await storage.setItem('pubsub/nodes//war-rooms/game/theme/items/current', {
      id: 'current',
      payload: MOCK_GAME_THEME,
      publishedAt: MOCK_GAME.createdAt,
      publisher: MOCK_GAME.createdBy,
    });
  }

  // Seed forces
  if (opts.forces) {
    for (const force of MOCK_FORCES) {
      await storage.setItem(`pubsub/nodes//war-rooms/forces/items/${force.id}`, {
        id: force.id,
        payload: force,
        publishedAt: force.createdAt,
        publisher: force.createdBy,
      });
    }
  }

  // Seed rooms
  if (opts.rooms) {
    for (const room of MOCK_ROOMS) {
      // Store room info
      await storage.setItem(`rooms/${room.jid}/info`, room.info);

      // Store room extension if present (for XMPP)
      if (room.extension) {
        const itemId = room.extension.roomJid.replace(/@/g, '_at_').replace(/\//g, '_slash_');
        await storage.setItem(`pubsub/nodes//war-rooms/rooms/items/${itemId}`, {
          id: itemId,
          payload: room.extension,
          publishedAt: room.extension.createdAt,
          publisher: room.extension.createdBy,
        });

        // Also create RoomMetadata for admin UI (convert forceRestrictions -> allowedGroups)
        const roomName = room.jid.split('@')[0];
        if (roomName) {
          const metadata: any = {};

          if (room.extension.forceRestrictions) {
            metadata.allowedGroups = room.extension.forceRestrictions;
          }
          if (room.extension.formSchemaIds) {
            metadata.formTemplates = room.extension.formSchemaIds;
          }
          if (room.extension.theme) {
            metadata.theme = room.extension.theme;
          }

          if (Object.keys(metadata).length > 0) {
            await storage.setItem(`pubsub:room:${roomName}`, metadata);
          }
        }
      }

      // Seed initial occupants with presence for demonstration
      if (room.jid.includes('all-hands')) {
        await storage.setItem(`rooms/${room.jid}/occupants/GM`, {
          nick: 'GM',
          jid: 'gamemaster@wargame.local/web',
          affiliation: 'owner',
          role: 'moderator',
          presence: { show: 'chat', status: 'Available for questions' },
        });
        await storage.setItem(`rooms/${room.jid}/occupants/RedCmd`, {
          nick: 'RedCmd',
          jid: 'commander.red@wargame.local/web',
          affiliation: 'member',
          role: 'participant',
          presence: { show: 'away', status: 'In briefing' },
        });
        await storage.setItem(`rooms/${room.jid}/occupants/BlueCmd`, {
          nick: 'BlueCmd',
          jid: 'commander.blue@wargame.local/web',
          affiliation: 'member',
          role: 'participant',
          presence: { status: 'Online' },
        });
      }
    }
  }

  // Seed messages
  if (opts.messages) {
    for (const message of MOCK_MESSAGES) {
      // Determine if it's a groupchat or direct message
      if (message.type === 'groupchat') {
        const roomJid = message.to;
        await storage.setItem(`archive/rooms/${roomJid}/${message.id}`, message);
      } else {
        await storage.setItem(`archive/direct/${message.id}`, message);
      }
    }
  }

  // Seed form schemas
  if (opts.forms) {
    for (const schema of MOCK_FORM_SCHEMAS) {
      await storage.setItem(`pubsub/nodes//war-rooms/forms/items/${schema.id}`, {
        id: schema.id,
        payload: schema,
        publishedAt: schema.createdAt,
        publisher: schema.createdBy,
      });
    }
  }

  // Seed REST representations (T024)
  if (opts.rest && opts.domain && opts.conferenceService) {
    await seedRestFromXmpp(storage, opts.domain, opts.conferenceService);
  }
}

/**
 * Convenience function to seed all fixture data (T025)
 * Now supports unified REST seeding via options.rest
 */
export async function seedAll(storage: Storage, options?: SeedOptions): Promise<void> {
  await seedMockData(storage, { ...DEFAULT_SEED_OPTIONS, ...options });
}

/**
 * Convenience function to clear all data
 */
export async function clearAll(storage: Storage): Promise<void> {
  await storage.clear();
}
