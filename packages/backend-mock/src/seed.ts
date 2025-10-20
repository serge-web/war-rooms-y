/**
 * Mock Data Seeder
 * Load fixtures into mock backend storage
 */

import type { Storage } from './storage';
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
}

export const DEFAULT_SEED_OPTIONS: SeedOptions = {
  clear: true,
  users: true,
  game: true,
  forces: true,
  rooms: true,
  messages: true,
  forms: true,
};

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
    console.info(`[MockSeed] Seeded ${MOCK_USERS.length} users`);
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

    console.info('[MockSeed] Seeded game metadata and theme');
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
    console.info(`[MockSeed] Seeded ${MOCK_FORCES.length} forces`);
  }

  // Seed rooms
  if (opts.rooms) {
    for (const room of MOCK_ROOMS) {
      // Store room info
      await storage.setItem(`rooms/${room.jid}/info`, room.info);

      // Store room extension if present
      if (room.extension) {
        const itemId = room.extension.roomJid.replace(/@/g, '_at_').replace(/\//g, '_slash_');
        await storage.setItem(`pubsub/nodes//war-rooms/rooms/items/${itemId}`, {
          id: itemId,
          payload: room.extension,
          publishedAt: room.extension.createdAt,
          publisher: room.extension.createdBy,
        });
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
    console.info(`[MockSeed] Seeded ${MOCK_ROOMS.length} rooms with occupants`);
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
    console.info(`[MockSeed] Seeded ${MOCK_MESSAGES.length} messages`);
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
    console.info(`[MockSeed] Seeded ${MOCK_FORM_SCHEMAS.length} form schemas`);
  }

  console.info('[MockSeed] Seeding complete');
}

/**
 * Convenience function to seed all fixture data
 */
export async function seedAll(storage: Storage): Promise<void> {
  await seedMockData(storage, DEFAULT_SEED_OPTIONS);
}

/**
 * Convenience function to clear all data
 */
export async function clearAll(storage: Storage): Promise<void> {
  await storage.clear();
  console.info('[MockSeed] Cleared all data');
}
