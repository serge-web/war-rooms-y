/**
 * REST API Seed Data
 * Default admin users for OpenFire REST API
 */

import type { Storage } from '../storage';
import { MockOpenFireAPI } from './openfire-api';

/**
 * Seed default admin users into REST API storage
 */
export async function seedRestUsers(storage: Storage): Promise<void> {
  const api = new MockOpenFireAPI(storage);

  // Create 'admins' group first
  await api.createGroup({
    name: 'admins',
    description: 'System administrators',
    members: [],
    admins: [],
  });

  // Create default admin user
  await api.createUser({
    username: 'admin',
    name: 'System Administrator',
    email: 'admin@wargame.local',
    password: 'admin', // Default password
    properties: {
      sharedGroups: ['admins'],
    },
  });

  // Create gamemaster user (also admin)
  await api.createUser({
    username: 'gamemaster',
    name: 'Game Master',
    email: 'gm@wargame.local',
    password: 'gamemaster',
    properties: {
      sharedGroups: ['admins'],
    },
  });
}
