/**
 * REST API Seed Data
 * Default admin users for OpenFire REST API
 */

import type { Storage } from '../storage';
import { MockOpenFireAPI } from './openfire-api';

/**
 * Seed passwords for Game Masters group members
 * Adds login credentials to existing users in the "Game Masters" group
 */
export async function seedRestUsers(storage: Storage): Promise<void> {
  const api = new MockOpenFireAPI(storage);

  // Get all users in "Game Masters" group
  const gameMastersGroup = await api.getGroup('Game Masters');
  if (!gameMastersGroup) {
    console.warn('⚠️  Game Masters group not found - skipping admin password seeding');
    return;
  }

  const gameMasters = gameMastersGroup.members || [];

  // Add passwords to each Game Master user
  for (const username of gameMasters) {
    const user = await api.getUser(username);
    if (user) {
      // Update existing user with password (use username as default password)
      await api.updateUser(username, {
        password: username, // Default: username as password
      });
      console.info(`✅ Added password for Game Master: ${username}`);
    }
  }
}
