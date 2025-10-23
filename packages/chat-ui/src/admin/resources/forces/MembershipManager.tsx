/**
 * Group Membership Management Component
 * Add/remove users to/from forces via REST API
 */

import { useState } from 'react';
import { useRecordContext, useDataProvider, useNotify, useRefresh } from 'react-admin';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, PersonAdd as AddIcon } from '@mui/icons-material';

export function MembershipManager() {
  const record = useRecordContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const [newMember, setNewMember] = useState('');
  const [adding, setAdding] = useState(false);

  if (!record) return null;

  const members = record.members || [];
  const groupName = record.name;

  const handleAddMember = async () => {
    if (!newMember.trim()) return;

    setAdding(true);
    try {
      // In a real implementation, this would call a custom endpoint
      // For now, we'll update the group record directly
      await dataProvider.update('forces', {
        id: groupName,
        data: { members: [...members, newMember.trim()] },
        previousData: record,
      });

      notify(`Added ${newMember} to ${groupName}`, { type: 'success' });
      setNewMember('');
      refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      notify(`Error: ${message}`, { type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (username: string) => {
    try {
      const updatedMembers = members.filter((m: string) => m !== username);

      await dataProvider.update('forces', {
        id: groupName,
        data: { members: updatedMembers },
        previousData: record,
      });

      notify(`Removed ${username} from ${groupName}`, { type: 'success' });
      refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      notify(`Error: ${message}`, { type: 'error' });
    }
  };

  return (
    <Card>
      <CardHeader
        title="Group Membership"
        subheader={`${members.length} member${members.length !== 1 ? 's' : ''}`}
      />
      <CardContent>
        {/* Add Member Form */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
          <TextField
            label="Username"
            placeholder="Enter username"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            size="small"
            fullWidth
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                void handleAddMember();
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => void handleAddMember()}
            disabled={adding || !newMember.trim()}
          >
            Add
          </Button>
        </Box>

        {/* Members List */}
        {members.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No members yet. Add a user above to get started.
          </Typography>
        ) : (
          <List dense>
            {members.map((username: string) => (
              <ListItem key={username}>
                <ListItemText primary={username} secondary={`Member of ${groupName}`} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="remove"
                    onClick={() => void handleRemoveMember(username)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
