/**
 * Unread Message Tracking
 * Track last read timestamp per room to calculate unread counts
 */

import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import type { XMPPMessage } from '@war-rooms/backend-interface';
import { messagesAtomFamily } from './messages';

// ============================================================================
// Atoms
// ============================================================================

/**
 * Last read timestamp atom family - one per room JID
 * Stores ISO timestamp of when the room was last viewed
 */
export const lastReadAtomFamily = atomFamily((_roomJid: string) => atom<string | null>(null));

// ============================================================================
// Actions
// ============================================================================

/**
 * Mark a room as read (set last read timestamp to now)
 */
export const markRoomAsReadAtom = atom(null, (_get, set, roomJid: string) => {
  const lastReadAtom = lastReadAtomFamily(roomJid);
  set(lastReadAtom, new Date().toISOString());
});

// ============================================================================
// Derived Atoms
// ============================================================================

/**
 * Get unread count for a specific room
 */
export const unreadCountAtomFamily = atomFamily((roomJid: string) =>
  atom((get) => {
    const messages = get(messagesAtomFamily(roomJid));
    const lastRead = get(lastReadAtomFamily(roomJid));

    if (!lastRead) {
      // If never read, all messages are unread
      return messages.length;
    }

    // Count messages newer than last read timestamp (force rebuild)
    return messages.filter((msg: XMPPMessage) => {
      const timestamp = msg.delay?.timestamp;
      if (!timestamp) {
        return true; // No timestamp = treat as new
      }
      // Handle both Date objects and ISO string timestamps
      const msgTime = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
      return msgTime > lastRead;
    }).length;
  })
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate unread count from messages and last read timestamp
 */
export function calculateUnreadCount(messages: XMPPMessage[], lastRead: string | null): number {
  if (!lastRead) {
    return messages.length;
  }

  return messages.filter((msg: XMPPMessage) => {
    const msgTime = msg.delay?.timestamp?.toISOString() || new Date().toISOString();
    return msgTime > lastRead;
  }).length;
}
