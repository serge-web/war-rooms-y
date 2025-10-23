/**
 * State Package
 * Zustand stores and Jotai atoms for War Rooms Y
 */

// Connection store
export {
  useConnectionStore,
  selectConnectionState,
  selectJid,
  selectBareJid,
  selectIsConnected,
  selectIsConnecting,
} from './connection';
export type { ConnectionStore } from './connection';

// Rooms store
export {
  useRoomsStore,
  selectRoom,
  selectRoomOccupants,
  selectIsJoined,
  selectJoinedRooms,
  selectAllRooms,
} from './rooms';
export type { RoomsStore, RoomState } from './rooms';

// Messages atoms
export {
  messagesAtomFamily,
  messagesLoadingAtomFamily,
  messageBackendAtom,
  getRoomMessagesAtom,
  getRoomLoadingAtom,
  addMessageAtom,
  setRoomMessagesAtom,
  clearRoomMessagesAtom,
  loadArchivedMessagesAtom,
  sortMessages,
  getMessageSender,
  isOwnMessage,
} from './messages';

// Metadata store
export {
  useMetadataStore,
  selectGame,
  selectGameTheme,
  selectForces,
  selectForce,
  selectRoomExtensions,
  selectRoomExtension,
  selectFormSchemas,
  selectFormSchema,
} from './metadata';
export type { MetadataStore } from './metadata';

// Unread tracking
export {
  lastReadAtomFamily,
  markRoomAsReadAtom,
  unreadCountAtomFamily,
  calculateUnreadCount,
} from './unread';
