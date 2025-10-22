/**
 * Mock Backend Helpers
 * Utilities for generating XMPP-compliant stanzas and IDs
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Message,
  Presence,
  MUCUserItem,
  XMPPUser,
} from '@war-rooms/backend-interface';

// ============================================================================
// JID Utilities
// ============================================================================

export function parseJid(jid: string): { local: string; domain: string; resource?: string } {
  const resourceSplit = jid.split('/');
  const bareJid = resourceSplit[0]!;
  const resource = resourceSplit[1];

  const domainSplit = bareJid.split('@');
  const local = domainSplit[0]!;
  const domain = domainSplit[1] || domainSplit[0]!; // Handle domain-only JIDs

  const result: { local: string; domain: string; resource?: string } = { local, domain };
  if (resource !== undefined) {
    result.resource = resource;
  }
  return result;
}

export function getBareJid(jid: string): string {
  return jid.split('/')[0]!;
}

export function getResource(jid: string): string | undefined {
  return jid.split('/')[1];
}

export function buildJid(local: string, domain: string, resource?: string): string {
  const bareJid = `${local}@${domain}`;
  return resource !== undefined ? `${bareJid}/${resource}` : bareJid;
}

// ============================================================================
// ID Generation
// ============================================================================

export function generateStanzaId(): string {
  return uuidv4();
}

export function generateMessageId(): string {
  return `msg_${uuidv4()}`;
}

// ============================================================================
// Timestamp Utilities
// ============================================================================

export function getISOTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// Stanza Factories
// ============================================================================

export function createPresenceStanza(
  from: string,
  options?: {
    type?: Presence['type'];
    show?: Presence['show'];
    status?: string;
    priority?: number;
  }
): Presence {
  const presence: Presence = { from };

  if (options?.type !== undefined) presence.type = options.type;
  if (options?.show !== undefined) presence.show = options.show;
  if (options?.status !== undefined) presence.status = options.status;
  if (options?.priority !== undefined) presence.priority = options.priority;

  return presence;
}

export function createMessageStanza(options: {
  from: string;
  to: string;
  type?: Message['type'];
  body?: string;
  subject?: string;
  thread?: string;
  id?: string;
}): Message {
  const message: Message = {
    id: options.id || generateMessageId(),
    from: options.from,
    to: options.to,
  };

  if (options.type !== undefined) message.type = options.type;
  if (options.body !== undefined) message.body = options.body;
  if (options.subject !== undefined) message.subject = options.subject;
  if (options.thread !== undefined) message.thread = options.thread;

  return message;
}

export function createRosterItem(
  jid: string,
  options?: {
    name?: string;
    subscription?: XMPPUser['subscription'];
    groups?: string[];
  }
): XMPPUser {
  const bareJid = getBareJid(jid);

  const item: XMPPUser = {
    jid,
    bare_jid: bareJid,
    subscription: options?.subscription || 'none',
    groups: options?.groups || [],
  };

  if (options?.name !== undefined) item.name = options.name;

  return item;
}

export function createOccupant(
  nick: string,
  options?: {
    jid?: string;
    affiliation?: MUCUserItem['affiliation'];
    role?: MUCUserItem['role'];
  }
): MUCUserItem {
  const occupant: MUCUserItem = {
    nick,
    affiliation: options?.affiliation || 'none',
    role: options?.role || 'participant',
  };

  if (options?.jid !== undefined) occupant.jid = options.jid;

  return occupant;
}

// ============================================================================
// Delay Utility
// ============================================================================

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
