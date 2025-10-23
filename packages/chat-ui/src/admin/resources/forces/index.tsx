/**
 * Forces Resource (OpenFire Groups + PubSub metadata)
 */

import {
  List,
  Datagrid,
  TextField,
  Edit,
  TabbedForm,
  FormTab,
  TextInput,
  Create,
  Show,
  SimpleShowLayout,
  ArrayField,
  SingleFieldList,
  ChipField,
  ArrayInput,
  SimpleFormIterator,
  FunctionField,
  SimpleForm,
} from 'react-admin';
import { Box } from '@mui/material';
import { MembershipManager } from './MembershipManager';

export const ForceList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" label="Force Name" />
      <TextField source="description" label="Description" />
      <FunctionField
        label="Color"
        render={(record: Record<string, unknown>) => {
          const metadata = record.metadata as { color?: string } | undefined;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 1,
                  backgroundColor: metadata?.color || '#cccccc',
                  border: '1px solid rgba(0,0,0,0.2)',
                }}
              />
              <span>{metadata?.color || 'N/A'}</span>
            </Box>
          );
        }}
      />
      <FunctionField
        label="Objectives"
        render={(record: Record<string, unknown>) => {
          const metadata = record.metadata as { objectives?: unknown[] } | undefined;
          return <span>{metadata?.objectives?.length || 0} objectives</span>;
        }}
      />
    </Datagrid>
  </List>
);

export const ForceEdit = () => (
  <Edit>
    <TabbedForm>
      <FormTab label="General">
        <TextInput source="name" label="Force Name" disabled />
        <TextInput source="description" label="Description" multiline rows={3} />

        {/* Metadata Section */}
        <TextInput
          source="metadata.description"
          label="Force Description"
          multiline
          rows={2}
          helperText="Extended description for this force"
        />

        <TextInput
          source="metadata.color"
          label="Force Color"
          type="color"
          helperText="Primary color for this force (used in UI theming)"
        />

        <TextInput
          source="metadata.icon"
          label="Icon Name"
          placeholder="military-tech"
          helperText="Material UI icon name (e.g., groups, military-tech, shield)"
        />

        <ArrayInput source="metadata.objectives" label="Objectives">
          <SimpleFormIterator inline>
            <TextInput source="" label="Objective" helperText="" />
          </SimpleFormIterator>
        </ArrayInput>
      </FormTab>

      <FormTab label="Members">
        <MembershipManager />
      </FormTab>
    </TabbedForm>
  </Edit>
);

export const ForceCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Force Name" required />
      <TextInput source="description" label="Description" multiline rows={3} />

      {/* Metadata Section */}
      <TextInput
        source="metadata.description"
        label="Force Description"
        multiline
        rows={2}
        helperText="Extended description for this force"
      />

      <TextInput
        source="metadata.color"
        label="Force Color"
        type="color"
        defaultValue="#1976D2"
        helperText="Primary color for this force (used in UI theming)"
      />

      <TextInput
        source="metadata.icon"
        label="Icon Name"
        placeholder="military-tech"
        defaultValue="groups"
        helperText="Material UI icon name (e.g., groups, military-tech, shield)"
      />

      <ArrayInput source="metadata.objectives" label="Objectives">
        <SimpleFormIterator inline>
          <TextInput source="" label="Objective" helperText="" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Create>
);

export const ForceShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" label="Force Name" />
      <TextField source="description" label="Description" />

      {/* Metadata Display */}
      <FunctionField
        label="Color"
        render={(record: Record<string, unknown>) => {
          const metadata = record.metadata as { color?: string } | undefined;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  backgroundColor: metadata?.color || '#cccccc',
                  border: '1px solid rgba(0,0,0,0.2)',
                }}
              />
              <span>{metadata?.color || 'N/A'}</span>
            </Box>
          );
        }}
      />

      <TextField source="metadata.icon" label="Icon" />
      <TextField source="metadata.description" label="Force Description" />

      <ArrayField source="metadata.objectives" label="Objectives">
        <SingleFieldList>
          <ChipField source="id" />
        </SingleFieldList>
      </ArrayField>

      <ArrayField source="members" label="Members">
        <SingleFieldList>
          <ChipField source="id" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
);
