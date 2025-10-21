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
  ArrayInput,
  SimpleFormIterator,
  AutocompleteArrayInput,
  useGetList,
  Loading,
} from 'react-admin';

/**
 * Dynamic group selector with search - fetches current groups
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
    <AutocompleteArrayInput
      {...props}
      choices={choices}
      filterToQuery={(searchText: string) => ({ name: searchText })}
    />
  );
}

/**
 * Dynamic user selector with search - fetches current users
 */
function UserSelector(props: any) {
  const { data, isLoading } = useGetList('users', {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'username', order: 'ASC' },
  });

  if (isLoading) return <Loading />;

  const choices = data?.map((user) => ({
    id: user.username,
    name: `${user.name || user.username} (${user.username})`,
  })) || [];

  return (
    <AutocompleteArrayInput
      {...props}
      choices={choices}
      filterToQuery={(searchText: string) => ({ username: searchText })}
    />
  );
}

export const RoomList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="roomName" label="Room Name" />
      <TextField source="naturalName" label="Display Name" />
      <TextField source="description" label="Description" />
      <BooleanField source="publicRoom" label="Public" />
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
      <NumberInput source="maxUsers" label="Max Users" defaultValue={50} />
      <BooleanInput source="publicRoom" label="Public Room" defaultValue={false} />
      <BooleanInput source="membersOnly" label="Members Only" defaultValue={true} />

      <GroupSelector
        source="metadata.allowedGroups"
        label="Allowed Groups"
        helperText="Groups allowed to access this room"
      />

      <UserSelector
        source="metadata.members"
        label="Room Members"
        helperText="Individual users allowed to access this room"
      />

      <ArrayInput source="metadata.formTemplates" label="Form Templates">
        <SimpleFormIterator inline>
          <TextInput source="" label="Template ID" helperText="" placeholder="sitrep" />
        </SimpleFormIterator>
      </ArrayInput>

      <TextInput
        source="metadata.theme.palette.primary.main"
        label="Primary Theme Color"
        type="color"
        defaultValue="#1976D2"
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
      <NumberInput source="maxUsers" label="Max Users" defaultValue={50} />
      <BooleanInput source="publicRoom" label="Public Room" defaultValue={false} />
      <BooleanInput source="membersOnly" label="Members Only" defaultValue={true} />

      <GroupSelector
        source="metadata.allowedGroups"
        label="Allowed Groups"
        helperText="Groups allowed to access this room"
      />

      <UserSelector
        source="metadata.members"
        label="Room Members"
        helperText="Individual users allowed to access this room"
      />

      <ArrayInput source="metadata.formTemplates" label="Form Templates">
        <SimpleFormIterator inline>
          <TextInput source="" label="Template ID" helperText="" placeholder="sitrep" />
        </SimpleFormIterator>
      </ArrayInput>

      <TextInput
        source="metadata.theme.palette.primary.main"
        label="Primary Theme Color"
        type="color"
        defaultValue="#1976D2"
        helperText="Primary color for this room's theme"
      />
    </SimpleForm>
  </Create>
);

