/**
 * Messages State
 * Per-room message atoms using Jotai for efficient updates
 */

import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import type { XMPPMessage, XMPPBackend } from '@war-rooms/backend-interface';

// ============================================================================
// Message Atoms (per room)
// ============================================================================

/**
 * Messages atom family - one atom per room JID
 */
export const messagesAtomFamily = atomFamily((_roomJid: string) => atom<XMPPMessage[]>([]));

/**
 * Loading state atom family - one per room JID
 */
export const messagesLoadingAtomFamily = atomFamily((_roomJid: string) => atom<boolean>(false));

// ============================================================================
// Global Message Handler Atom
// ============================================================================

/**
 * Backend reference for message operations
 */
export const messageBackendAtom = atom<{ backend: XMPPBackend } | null>(null);

// ============================================================================
// Derived Atoms
// ============================================================================

/**
 * Get messages for a specific room
 */
export const getRoomMessagesAtom = (roomJid: string) =>
  atom((get) => get(messagesAtomFamily(roomJid)));

/**
 * Get loading state for a specific room
 */
export const getRoomLoadingAtom = (roomJid: string) =>
  atom((get) => get(messagesLoadingAtomFamily(roomJid)));

// ============================================================================
// Actions (Write-only atoms)
// ============================================================================

/**
 * Add a message to a room
 */
export const addMessageAtom = atom(
  null,
  (get, set, { roomJid, message }: { roomJid: string; message: XMPPMessage }) => {
    const messagesAtom = messagesAtomFamily(roomJid);
    const currentMessages = get(messagesAtom);

    // Avoid duplicates
    if (currentMessages.some((m) => m.id === message.id)) {
      return;
    }

    set(messagesAtom, [...currentMessages, message]);
  }
);

/**
 * Set all messages for a room (e.g., after MAM query)
 */
export const setRoomMessagesAtom = atom(
  null,
  (_get, set, { roomJid, messages }: { roomJid: string; messages: XMPPMessage[] }) => {
    const messagesAtom = messagesAtomFamily(roomJid);
    set(messagesAtom, messages);
  }
);

/**
 * Clear messages for a room
 */
export const clearRoomMessagesAtom = atom(null, (_get, set, roomJid: string) => {
  const messagesAtom = messagesAtomFamily(roomJid);
  set(messagesAtom, []);
});

/**
 * Load archived messages for a room
 */
export const loadArchivedMessagesAtom = atom(
  null,
  async (get, set, { roomJid, limit }: { roomJid: string; limit?: number }) => {
    const backendRef = get(messageBackendAtom);

    if (!backendRef?.backend) {
      throw new Error('Backend not initialized');
    }

    const loadingAtom = messagesLoadingAtomFamily(roomJid);
    set(loadingAtom, true);

    try {
      const result = await backendRef.backend.queryArchive(
        roomJid,
        limit !== undefined ? { paging: { max: limit } } : {}
      );
      const messagesAtom = messagesAtomFamily(roomJid);
      // Extract messages from MAMResult items
      const messages = (result.results || [])
        .map((r) => r.item.message)
        .filter((m): m is NonNullable<typeof m> => m !== undefined);
      set(messagesAtom, messages);
    } catch (error) {
      console.error('[Messages] Load archived messages failed:', error);
      throw error;
    } finally {
      set(loadingAtom, false);
    }
  }
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sort messages by timestamp
 */
export function sortMessages(messages: XMPPMessage[]): XMPPMessage[] {
  return [...messages].sort((a, b) => {
    // Handle both Date objects and ISO timestamp strings
    const getTime = (msg: XMPPMessage): number => {
      const timestamp = msg.delay?.timestamp;

      if (!timestamp) {
        return Date.now();
      }

      if (timestamp instanceof Date) {
        return timestamp.getTime();
      }

      // Handle string timestamps (ISO format from storage)
      if (typeof timestamp === 'string') {
        return new Date(timestamp).getTime();
      }

      // Fallback
      return Date.now();
    };

    return getTime(a) - getTime(b);
  });
}

/**
 * Get message sender nickname (from room JID format: room@conference/nickname)
 */
export function getMessageSender(message: XMPPMessage): string {
  if (!message.from) return 'Unknown';

  if (message.type === 'groupchat') {
    const parts = message.from.split('/');
    return parts[1] || 'Unknown';
  }
  return message.from;
}

/**
 * Check if message is from current user
 */
export function isOwnMessage(message: XMPPMessage, currentNickname?: string): boolean {
  if (!currentNickname) return false;
  const sender = getMessageSender(message);
  return sender === currentNickname;
}
