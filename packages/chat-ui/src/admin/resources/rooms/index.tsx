/**
 * Rooms Resource (MUC + PubSub metadata)
 */

import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  Edit,
  SimpleForm,
  TextInput,
  BooleanInput,
  NumberInput,
  Create,
  Show,
  SimpleShowLayout,
  ArrayInput,
  SimpleFormIterator,
  SelectArrayInput,
  FunctionField,
} from 'react-admin';
import { Box } from '@mui/material';

export const RoomList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="roomName" label="Room Name" />
      <TextField source="naturalName" label="Display Name" />
      <TextField source="description" label="Description" />
      <BooleanField source="persistent" label="Persistent" />
      <BooleanField source="membersOnly" label="Members Only" />
    </Datagrid>
  </List>
);

export const RoomEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="roomName" label="Room Name" disabled />
      <TextInput source="naturalName" label="Display Name" required />
      <TextInput source="description" label="Description" multiline rows={3} />
      <TextInput source="subject" label="Subject" />
      <NumberInput source="maxUsers" label="Max Users" defaultValue={50} />
      <BooleanInput source="persistent" label="Persistent" defaultValue={true} />
      <BooleanInput source="publicRoom" label="Public Room" defaultValue={false} />
      <BooleanInput source="membersOnly" label="Members Only" defaultValue={true} />
      <BooleanInput source="moderated" label="Moderated" defaultValue={false} />

      {/* Metadata Section */}
      <TextInput
        source="metadata.description"
        label="Extended Description"
        multiline
        rows={2}
        helperText="Additional room description visible in metadata"
      />

      <SelectArrayInput
        source="metadata.allowedGroups"
        label="Allowed Groups"
        choices={[
          { id: 'admins', name: 'Admins' },
          { id: 'Red Force', name: 'Red Force' },
          { id: 'Blue Force', name: 'Blue Force' },
          { id: 'Control', name: 'Control' },
        ]}
        helperText="Groups allowed to access this room"
      />

      <ArrayInput source="metadata.formTemplates" label="Form Templates">
        <SimpleFormIterator inline>
          <TextInput source="" label="Template ID" helperText="" placeholder="sitrep" />
        </SimpleFormIterator>
      </ArrayInput>

      <TextInput
        source="metadata.theme.palette.primary.main"
        label="Primary Theme Color"
        placeholder="#1976D2"
        helperText="Primary color for this room's theme"
      />
    </SimpleForm>
  </Edit>
);

export const RoomCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="roomName" label="Room Name" required />
      <TextInput source="naturalName" label="Display Name" required />
      <TextInput source="description" label="Description" multiline rows={3} />
      <TextInput source="subject" label="Subject" />
      <NumberInput source="maxUsers" label="Max Users" defaultValue={50} />
      <BooleanInput source="persistent" label="Persistent" defaultValue={true} />
      <BooleanInput source="publicRoom" label="Public Room" defaultValue={false} />
      <BooleanInput source="membersOnly" label="Members Only" defaultValue={true} />
      <BooleanInput source="moderated" label="Moderated" defaultValue={false} />

      {/* Metadata Section */}
      <TextInput
        source="metadata.description"
        label="Extended Description"
        multiline
        rows={2}
        helperText="Additional room description visible in metadata"
      />

      <SelectArrayInput
        source="metadata.allowedGroups"
        label="Allowed Groups"
        choices={[
          { id: 'admins', name: 'Admins' },
          { id: 'Red Force', name: 'Red Force' },
          { id: 'Blue Force', name: 'Blue Force' },
          { id: 'Control', name: 'Control' },
        ]}
        helperText="Groups allowed to access this room"
      />

      <ArrayInput source="metadata.formTemplates" label="Form Templates">
        <SimpleFormIterator inline>
          <TextInput source="" label="Template ID" helperText="" placeholder="sitrep" />
        </SimpleFormIterator>
      </ArrayInput>

      <TextInput
        source="metadata.theme.palette.primary.main"
        label="Primary Theme Color"
        placeholder="#1976D2"
        defaultValue="#1976D2"
        helperText="Primary color for this room's theme"
      />
    </SimpleForm>
  </Create>
);

export const RoomShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="roomName" label="Room Name" />
      <TextField source="naturalName" label="Display Name" />
      <TextField source="description" label="Description" />
      <TextField source="subject" label="Subject" />
      <TextField source="maxUsers" label="Max Users" />
      <BooleanField source="persistent" label="Persistent" />
      <BooleanField source="publicRoom" label="Public Room" />
      <BooleanField source="membersOnly" label="Members Only" />
      <BooleanField source="moderated" label="Moderated" />

      {/* Metadata Display */}
      <TextField source="metadata.description" label="Extended Description" />

      <FunctionField
        label="Allowed Groups"
        render={(record: any) => (
          <span>{record.metadata?.allowedGroups?.join(', ') || 'N/A'}</span>
        )}
      />

      <FunctionField
        label="Form Templates"
        render={(record: any) => (
          <span>{record.metadata?.formTemplates?.join(', ') || 'N/A'}</span>
        )}
      />

      <FunctionField
        label="Theme Color"
        render={(record: any) => {
          const color = record.metadata?.theme?.palette?.primary?.main;
          return color ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  backgroundColor: color,
                  border: '1px solid rgba(0,0,0,0.2)',
                }}
              />
              <span>{color}</span>
            </Box>
          ) : (
            <span>N/A</span>
          );
        }}
      />
    </SimpleShowLayout>
  </Show>
);
