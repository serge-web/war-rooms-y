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
} from 'react-admin';

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
      <TextInput source="metadata.description" label="Extended Description" multiline rows={2} />
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
      <TextInput source="metadata.description" label="Extended Description" multiline rows={2} />
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
      <TextField source="metadata.description" label="Extended Description" />
    </SimpleShowLayout>
  </Show>
);
