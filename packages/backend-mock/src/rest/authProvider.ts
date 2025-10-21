/**
 * React-Admin Auth Provider
 * Admin group verification via mock OpenFire REST API (Unified Storage)
 */

import type { AuthProvider } from 'react-admin';
import { MockOpenFireAPI } from './openfire-api';
import { createStorage } from '../storage';
import type { UnifiedUser } from '@war-rooms/backend-interface';

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

  // Store current user
  let currentUser: { username: string; isAdmin: boolean } | null = null;

  return {
    /**
     * Login - authenticate and verify admin group membership
     */
    async login(params: { username: string; password: string }): Promise<void> {
      const { username, password } = params;

      // Check if user exists via unified storage
      const unifiedUser = await storage.getItem<UnifiedUser>(`entities/users/${username}`);
      if (!unifiedUser) {
        throw new Error('Invalid credentials');
      }

      // Check password (in unified storage)
      if (unifiedUser.password !== password) {
        throw new Error('Invalid credentials');
      }

      // Check Game Masters group membership
      const isGameMaster = unifiedUser.groups?.includes('Game Masters') || unifiedUser.isGameMaster;

      if (!isGameMaster) {
        throw new Error('Unauthorized: Game Master access required');
      }

      // Store authenticated admin user
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
