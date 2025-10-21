/**
 * Storybook stories for Rooms admin resource
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RoomList, RoomEdit, RoomCreate } from './index';
import { AdminContext } from 'react-admin';
import { createMemoryHistory } from 'history';

// Mock data provider with rooms and forces
const mockDataProvider = {
  getList: async (resource: string) => {
    if (resource === 'rooms') {
      return {
        data: [
          {
            id: 'operations',
            roomName: 'operations',
            naturalName: 'Operations Room',
            description: 'Main operations coordination',
            persistent: true,
            publicRoom: false,
            membersOnly: true,
            moderated: false,
            maxUsers: 50,
            metadata: {
              allowedGroups: ['Red Force', 'Blue Force', 'Control'],
              formTemplates: ['sitrep', 'contact'],
              theme: {
                palette: {
                  primary: {
                    main: '#1976D2',
                  },
                },
              },
            },
          },
          {
            id: 'intel',
            roomName: 'intel',
            naturalName: 'Intelligence Room',
            description: 'Intelligence sharing',
            persistent: true,
            publicRoom: false,
            membersOnly: true,
            moderated: true,
            maxUsers: 30,
            metadata: {
              allowedGroups: ['Control'],
              formTemplates: ['intrep'],
              theme: {
                palette: {
                  primary: {
                    main: '#F44336',
                  },
                },
              },
            },
          },
        ],
        total: 2,
      };
    }
    // Return forces for the GroupSelector
    if (resource === 'forces') {
      return {
        data: [
          { id: 'Red Force', name: 'Red Force' },
          { id: 'Blue Force', name: 'Blue Force' },
          { id: 'Control', name: 'Control' },
        ],
        total: 3,
      };
    }
    return { data: [], total: 0 };
  },
  getOne: async () => ({
    data: {
      id: 'operations',
      roomName: 'operations',
      naturalName: 'Operations Room',
      description: 'Main operations coordination',
      persistent: true,
      publicRoom: false,
      membersOnly: true,
      moderated: false,
      maxUsers: 50,
      subject: 'Current operations status',
      metadata: {
        description: 'Extended operations room description',
        allowedGroups: ['Red Force', 'Blue Force', 'Control'],
        formTemplates: ['sitrep', 'contact'],
        theme: {
          palette: {
            primary: {
              main: '#1976D2',
            },
          },
        },
      },
    },
  }),
  getMany: async () => ({ data: [] }),
  getManyReference: async () => ({ data: [], total: 0 }),
  create: async (resource: string, params: any) => ({ data: { ...params.data, id: params.data.roomName } }),
  update: async (resource: string, params: any) => ({ data: params.data }),
  updateMany: async () => ({ data: [] }),
  delete: async () => ({ data: {} }),
  deleteMany: async () => ({ data: [] }),
};

const meta = {
  title: 'Admin/Rooms',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const history = createMemoryHistory();
      return (
        <AdminContext dataProvider={mockDataProvider} history={history}>
          <Story />
        </AdminContext>
      );
    },
  ],
} satisfies Meta;

export default meta;

/**
 * Room List view - shows all rooms in a datagrid
 */
export const List: StoryObj = {
  render: () => <RoomList />,
};

/**
 * Room Create view - form for creating a new room
 */
export const Create: StoryObj = {
  render: () => <RoomCreate />,
};

/**
 * Room Edit view - form for editing room configuration and metadata
 */
export const Edit: StoryObj = {
  render: () => <RoomEdit />,
};

