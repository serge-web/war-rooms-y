/**
 * React-Admin Auth Provider
 * Admin group verification via mock OpenFire REST API
 */

import type { AuthProvider } from 'react-admin';
import { MockOpenFireAPI } from './openfire-api';
import { createStorage } from '../storage';
import { seedRestUsers } from './seed-rest';

// ============================================================================
// Auth Provider Implementation
// ============================================================================

export function createAuthProvider(namespace = 'war-rooms'): AuthProvider {
  // Initialize storage and API (unified namespace)
  const storage = createStorage({
    backend: 'localStorage',
    namespace,
  });

  const restApi = new MockOpenFireAPI(storage);

  // Auto-seed Game Masters passwords on first run
  (async () => {
    const gameMastersGroup = await restApi.getGroup('Game Masters');
    if (gameMastersGroup) {
      console.log('[Admin Auth] Seeding Game Masters passwords...');
      await seedRestUsers(storage);
      console.log('[Admin Auth] Passwords added for Game Masters');
    }
  })();

  // Store current user
  let currentUser: { username: string; isAdmin: boolean } | null = null;

  return {
    /**
     * Login - authenticate and verify admin group membership
     */
    async login(params: { username: string; password: string }): Promise<void> {
      const { username, password } = params;

      // 1. Check if user exists and password matches
      const user = await restApi.getUser(username);
      if (!user) {
        throw new Error('Invalid credentials 3');
      }
      console.log('user', user);

      // In mock, we need to check stored password
      // (In real OpenFire, XMPP auth would handle this)
      const storedUser = await storage.getItem<{ password?: string }>(`rest:user:${username}`);
      if (storedUser?.password !== password) {
        throw new Error('Invalid credentials 4');
      }

      // 2. Check Game Masters group membership
      const sharedGroups = user.properties?.sharedGroups || [];
      const isGameMaster = sharedGroups.includes('Game Masters');

      if (!isGameMaster) {
        throw new Error('Unauthorized: Game Master access required');
      }

      // 3. Store authenticated admin user
      currentUser = { username, isAdmin: true };
      localStorage.setItem('admin-auth', JSON.stringify(currentUser));
    },

    /**
     * Logout - clear authentication
     */
    async logout(): Promise<void> {
      currentUser = null;
      localStorage.removeItem('admin-auth');
    },

    /**
     * Check auth - verify user is still authenticated
     */
    async checkAuth(): Promise<void> {
      const stored = localStorage.getItem('admin-auth');
      if (!stored) {
        throw new Error('Not authenticated');
      }

      try {
        currentUser = JSON.parse(stored);
        if (!currentUser?.isAdmin) {
          throw new Error('Not an admin');
        }
      } catch {
        throw new Error('Invalid auth data');
      }
    },

    /**
     * Check error - handle auth errors from data provider
     */
    async checkError(error: { status?: number; message?: string }): Promise<void> {
      const status = error.status;

      if (status === 401 || status === 403) {
        currentUser = null;
        localStorage.removeItem('admin-auth');
        throw new Error('Authentication required');
      }
    },

    /**
     * Get permissions - return admin flag
     */
    async getPermissions(): Promise<string> {
      return 'admin';
    },

    /**
     * Get identity - return current user info
     */
    async getIdentity(): Promise<{ id: string; fullName: string; avatar?: string }> {
      const stored = localStorage.getItem('admin-auth');
      if (!stored) {
        throw new Error('Not authenticated');
      }

      const auth = JSON.parse(stored);
      const user = await restApi.getUser(auth.username);

      return {
        id: auth.username,
        fullName: user?.name || auth.username,
      };
    },
  };
}
