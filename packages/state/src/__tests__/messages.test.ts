/**
 * Messages State Tests
 * Unit tests for message atom operations
 */

import { createStore } from 'jotai';
import {
  messagesAtomFamily,
  addMessageAtom,
  setRoomMessagesAtom,
  clearRoomMessagesAtom,
  sortMessages,
  getMessageSender,
} from '../messages';
import type { XMPPMessage } from '@war-rooms/backend-interface';

describe('Messages State', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('messagesAtomFamily', () => {
    it('should initialize with empty array', () => {
      const roomJid = 'test@conference.local';
      const messagesAtom = messagesAtomFamily(roomJid);
      const messages = store.get(messagesAtom);

      expect(messages).toEqual([]);
    });

    it('should maintain separate state per room', () => {
      const room1Jid = 'room1@conference.local';
      const room2Jid = 'room2@conference.local';

      const room1Atom = messagesAtomFamily(room1Jid);
      const room2Atom = messagesAtomFamily(room2Jid);

      const message1: XMPPMessage = {
        id: 'msg-1',
        from: `${room1Jid}/user1`,
        to: room1Jid,
        type: 'groupchat',
        body: 'Room 1 message',
      };

      store.set(addMessageAtom, { roomJid: room1Jid, message: message1 });

      expect(store.get(room1Atom)).toHaveLength(1);
      expect(store.get(room2Atom)).toHaveLength(0);
    });
  });

  describe('addMessageAtom', () => {
    it('should add message to room', () => {
      const roomJid = 'test@conference.local';
      const message: XMPPMessage = {
        id: 'msg-1',
        from: `${roomJid}/user`,
        to: roomJid,
        type: 'groupchat',
        body: 'Test message',
      };

      store.set(addMessageAtom, { roomJid, message });

      const messagesAtom = messagesAtomFamily(roomJid);
      const messages = store.get(messagesAtom);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });

    it('should not add duplicate messages', () => {
      const roomJid = 'test@conference.local';
      const message: XMPPMessage = {
        id: 'msg-1',
        from: `${roomJid}/user`,
        to: roomJid,
        type: 'groupchat',
        body: 'Test message',
      };

      store.set(addMessageAtom, { roomJid, message });
      store.set(addMessageAtom, { roomJid, message }); // Try to add same message again

      const messagesAtom = messagesAtomFamily(roomJid);
      const messages = store.get(messagesAtom);

      expect(messages).toHaveLength(1);
    });
  });

  describe('setRoomMessagesAtom', () => {
    it('should replace all messages for room', () => {
      const roomJid = 'test@conference.local';
      const messages: XMPPMessage[] = [
        {
          id: 'msg-1',
          from: `${roomJid}/user1`,
          to: roomJid,
          type: 'groupchat',
          body: 'Message 1',
        },
        {
          id: 'msg-2',
          from: `${roomJid}/user2`,
          to: roomJid,
          type: 'groupchat',
          body: 'Message 2',
        },
      ];

      store.set(setRoomMessagesAtom, { roomJid, messages });

      const messagesAtom = messagesAtomFamily(roomJid);
      const storedMessages = store.get(messagesAtom);

      expect(storedMessages).toEqual(messages);
      expect(storedMessages).toHaveLength(2);
    });
  });

  describe('clearRoomMessagesAtom', () => {
    it('should clear all messages for room', () => {
      const roomJid = 'test@conference.local';
      const message: XMPPMessage = {
        id: 'msg-1',
        from: `${roomJid}/user`,
        to: roomJid,
        type: 'groupchat',
        body: 'Test message',
      };

      store.set(addMessageAtom, { roomJid, message });
      store.set(clearRoomMessagesAtom, roomJid);

      const messagesAtom = messagesAtomFamily(roomJid);
      const messages = store.get(messagesAtom);

      expect(messages).toEqual([]);
    });
  });

  describe('sortMessages', () => {
    it('should sort messages by timestamp', () => {
      const messages: XMPPMessage[] = [
        {
          id: 'msg-3',
          from: 'room@conference.local/user',
          to: 'room@conference.local',
          type: 'groupchat',
          body: 'Third',
          delay: { timestamp: new Date('2025-01-01T12:00:00.000Z') },
        },
        {
          id: 'msg-1',
          from: 'room@conference.local/user',
          to: 'room@conference.local',
          type: 'groupchat',
          body: 'First',
          delay: { timestamp: new Date('2025-01-01T10:00:00.000Z') },
        },
        {
          id: 'msg-2',
          from: 'room@conference.local/user',
          to: 'room@conference.local',
          type: 'groupchat',
          body: 'Second',
          delay: { timestamp: new Date('2025-01-01T11:00:00.000Z') },
        },
      ];

      const sorted = sortMessages(messages);

      expect(sorted[0]!.id).toBe('msg-1');
      expect(sorted[1]!.id).toBe('msg-2');
      expect(sorted[2]!.id).toBe('msg-3');
    });
  });

  describe('getMessageSender', () => {
    it('should extract nickname from groupchat message', () => {
      const message: XMPPMessage = {
        id: 'msg-1',
        from: 'room@conference.local/Commander',
        to: 'room@conference.local',
        type: 'groupchat',
        body: 'Test',
      };

      const sender = getMessageSender(message);
      expect(sender).toBe('Commander');
    });

    it('should return full JID for direct message', () => {
      const message: XMPPMessage = {
        id: 'msg-1',
        from: 'user@domain.local',
        to: 'recipient@domain.local',
        type: 'chat',
        body: 'Test',
      };

      const sender = getMessageSender(message);
      expect(sender).toBe('user@domain.local');
    });
  });
});
