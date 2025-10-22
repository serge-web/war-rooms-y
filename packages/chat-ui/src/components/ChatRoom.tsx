/**
 * Chat Room Component
 * Display messages and send new messages in a room
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Drawer,
  Badge,
} from '@mui/material';
import { Send as SendIcon, People as PeopleIcon } from '@mui/icons-material';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  messagesAtomFamily,
  loadArchivedMessagesAtom,
  sortMessages,
  getMessageSender,
  markRoomAsReadAtom,
  isOwnMessage,
} from '@war-rooms/state';
import { useRoomsStore, selectRoomOccupants, selectRoom, type RoomsStore } from '@war-rooms/state';
import type { XMPPMessage } from '@war-rooms/backend-interface';
import { ParticipantList } from './ParticipantList';

interface ChatRoomProps {
  roomJid: string;
}

export function ChatRoom({ roomJid }: ChatRoomProps) {
  const [messageText, setMessageText] = useState('');
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for this room
  const messages = useAtomValue(messagesAtomFamily(roomJid));
  const loadArchived = useSetAtom(loadArchivedMessagesAtom);
  const markAsRead = useSetAtom(markRoomAsReadAtom);

  // Get room occupants and current user's nickname
  const occupants = useRoomsStore(selectRoomOccupants(roomJid));
  const currentNickname = useRoomsStore(selectRoom(roomJid))?.nickname;

  // Send message action from rooms store
  const sendMessage = useRoomsStore((state: RoomsStore) => state.sendMessage);

  // Load archived messages on mount
  useEffect(() => {
    void loadArchived({ roomJid, limit: 50 });
  }, [roomJid, loadArchived]);

  // Auto-scroll to bottom when new messages arrive and mark as read
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Mark room as read when component is mounted (user is viewing this room)
    if (messages.length > 0) {
      markAsRead(roomJid);
    }
  }, [messages, roomJid, markAsRead]);

  // Subscribe to new messages (in real app, this would be via backend event handler)
  // For now, the backend will trigger the message handler which updates the atom

  const handleSend = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage(roomJid, messageText);

      // Note: In the mock backend, the message is automatically added via onMessage handler
      // But for immediate feedback, we could add it to the atom here too

      setMessageText('');
    } catch (err) {
      console.error('[ChatRoom] Send message failed:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const sortedMessages = sortMessages(messages);

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 2,
          bgcolor: 'background.paper',
        }}
      >
        <List sx={{ py: 1 }}>
          {sortedMessages.map((message: XMPPMessage) => {
            const isOwn = isOwnMessage(message, currentNickname);
            const sender = getMessageSender(message);
            const timestamp = message.delay?.stamp
              ? new Date(message.delay.stamp).toLocaleTimeString()
              : 'now';

            return (
              <ListItem
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  px: 1,
                  py: 0.5,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    minWidth: '20%',
                    ml: isOwn ? 8 : 0,
                    mr: isOwn ? 0 : 8,
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isOwn ? 'primary.main' : 'background.default',
                      color: isOwn ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'baseline',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          opacity: isOwn ? 0.9 : 1,
                        }}
                      >
                        {sender}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: isOwn ? 0.7 : 0.6,
                          fontSize: '0.7rem',
                        }}
                      >
                        {timestamp}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {message.body}
                    </Typography>
                  </Paper>
                </Box>
              </ListItem>
            );
          })}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 0,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            color={participantsOpen ? 'primary' : 'default'}
            onClick={() => setParticipantsOpen(!participantsOpen)}
            aria-label="Show participants"
            size="small"
          >
            <Badge badgeContent={occupants.length} color="primary" max={99}>
              <PeopleIcon />
            </Badge>
          </IconButton>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
          />
          <IconButton
            color="primary"
            onClick={() => {
              void handleSend();
            }}
            disabled={!messageText.trim()}
            aria-label="Send"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Participants Drawer */}
      <Drawer
        anchor="right"
        open={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        variant="temporary"
        ModalProps={{
          container: document.body,
          style: { position: 'absolute' },
        }}
        sx={{
          position: 'absolute',
          '& .MuiDrawer-paper': {
            position: 'absolute',
            width: 250,
            height: '100%',
            borderLeft: 1,
            borderColor: 'divider',
          },
        }}
      >
        <ParticipantList occupants={occupants} />
      </Drawer>
    </Box>
  );
}
