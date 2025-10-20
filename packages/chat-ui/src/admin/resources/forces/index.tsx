/**
 * Forces Resource (OpenFire Groups + PubSub metadata)
 */

import {
  List,
  Datagrid,
  TextField,
  Edit,
  SimpleForm,
  TextInput,
  Create,
  Show,
  SimpleShowLayout,
  ArrayField,
  SingleFieldList,
  ChipField,
} from 'react-admin';

export const ForceList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" label="Force Name" />
      <TextField source="description" label="Description" />
      <TextField source="metadata.color" label="Color" />
    </Datagrid>
  </List>
);

export const ForceEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Force Name" disabled />
      <TextInput source="description" label="Description" multiline rows={3} />
      <TextInput source="metadata.color" label="Color (hex)" placeholder="#FF0000" />
      <TextInput source="metadata.icon" label="Icon" placeholder="military-tech" />
      <TextInput source="metadata.description" label="Force Description" multiline rows={2} />
    </SimpleForm>
  </Edit>
);

export const ForceCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Force Name" required />
      <TextInput source="description" label="Description" multiline rows={3} />
      <TextInput source="metadata.color" label="Color (hex)" placeholder="#FF0000" defaultValue="#1976D2" />
      <TextInput source="metadata.icon" label="Icon" placeholder="military-tech" defaultValue="groups" />
      <TextInput source="metadata.description" label="Force Description" multiline rows={2} />
    </SimpleForm>
  </Create>
);

export const ForceShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" label="Force Name" />
      <TextField source="description" label="Description" />
      <TextField source="metadata.color" label="Color" />
      <TextField source="metadata.icon" label="Icon" />
      <TextField source="metadata.description" label="Force Description" />
      <ArrayField source="members" label="Members">
        <SingleFieldList>
          <ChipField source="id" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
);
