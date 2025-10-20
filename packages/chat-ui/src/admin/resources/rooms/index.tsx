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
  useGetList,
  Loading,
} from 'react-admin';
import { Box } from '@mui/material';

/**
 * Dynamic group selector - fetches current groups
 */
function GroupSelector(props: any) {
  const { data, isLoading } = useGetList('forces', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
  });

  if (isLoading) return <Loading />;

  const choices = data?.map((group) => ({
    id: group.name,
    name: group.name,
  })) || [];

  return (
    <SelectArrayInput
      {...props}
      choices={choices}
    />
  );
}

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

      <GroupSelector
        source="metadata.allowedGroups"
        label="Allowed Groups"
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

      <GroupSelector
        source="metadata.allowedGroups"
        label="Allowed Groups"
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
