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
  Divider,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  messagesAtomFamily,
  loadArchivedMessagesAtom,
  sortMessages,
  getMessageSender,
} from '@war-rooms/state';
import { useRoomsStore, type RoomsStore } from '@war-rooms/state';
import type { XMPPMessage } from '@war-rooms/backend-interface';

interface ChatRoomProps {
  roomJid: string;
}

export function ChatRoom({ roomJid }: ChatRoomProps) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for this room
  const messages = useAtomValue(messagesAtomFamily(roomJid));
  const loadArchived = useSetAtom(loadArchivedMessagesAtom);

  // Send message action from rooms store
  const sendMessage = useRoomsStore((state: RoomsStore) => state.sendMessage);

  // Load archived messages on mount
  useEffect(() => {
    void loadArchived({ roomJid, limit: 50 });
  }, [roomJid, loadArchived]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: 'background.paper',
        }}
      >
        <List>
          {sortedMessages.map((message: XMPPMessage, index: number) => (
            <React.Fragment key={message.id}>
              <ListItem sx={{ alignItems: 'flex-start', px: 0 }}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="subtitle2" component="span" color="text.primary">
                      {getMessageSender(message)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {message.delay?.stamp
                        ? new Date(message.delay.stamp).toLocaleTimeString()
                        : 'now'}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                  >
                    {message.body}
                  </Typography>
                </Box>
              </ListItem>
              {index < sortedMessages.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
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
        <Box sx={{ display: 'flex', gap: 1 }}>
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
    </Box>
  );
}
