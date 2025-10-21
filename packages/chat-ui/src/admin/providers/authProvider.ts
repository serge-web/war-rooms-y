/**
 * Re-export auth provider from backend-mock
 * This ensures both chat-ui and admin-ui use the same implementation
 */

export { createAuthProvider } from '@war-rooms/backend-mock';
