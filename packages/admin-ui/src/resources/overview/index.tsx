/**
 * Overview Resource (single game record)
 */

import { Edit, SimpleForm, TextInput, NumberInput, SelectInput, Show, SimpleShowLayout, TextField, NumberField } from 'react-admin';

export const OverviewEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" label="Game Title" required />
      <TextInput source="description" label="Description" multiline rows={3} />
      <TextInput source="scenario" label="Scenario" />
      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: 'setup', name: 'Setup' },
          { id: 'active', name: 'Active' },
          { id: 'paused', name: 'Paused' },
          { id: 'completed', name: 'Completed' },
        ]}
        required
      />
      <NumberInput source="currentTurn" label="Current Turn" required />
      <TextInput source="gameTime" label="Game Time (ISO 8601)" />
      <TextInput source="startTime" label="Start Time (ISO 8601)" />
    </SimpleForm>
  </Edit>
);

export const OverviewShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="title" label="Game Title" />
      <TextField source="description" label="Description" />
      <TextField source="scenario" label="Scenario" />
      <TextField source="status" label="Status" />
      <NumberField source="currentTurn" label="Current Turn" />
      <TextField source="gameTime" label="Game Time" />
      <TextField source="startTime" label="Start Time" />
    </SimpleShowLayout>
  </Show>
);
