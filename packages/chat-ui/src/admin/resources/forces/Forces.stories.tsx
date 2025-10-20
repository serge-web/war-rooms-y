/**
 * Storybook stories for Forces admin resource
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ForceList, ForceEdit, ForceCreate, ForceShow } from './index';
import { AdminContext } from 'react-admin';
import { createMemoryHistory } from 'history';

// Mock data provider
const mockDataProvider = {
  getList: async () => ({
    data: [
      {
        id: 'Red Force',
        name: 'Red Force',
        description: 'Red Force Group',
        members: ['alice', 'bob'],
        metadata: {
          color: '#F44336',
          icon: 'military-tech',
          objectives: ['Secure Area Alpha', 'Defend Position'],
        },
      },
      {
        id: 'Blue Force',
        name: 'Blue Force',
        description: 'Blue Force Group',
        members: ['charlie', 'diana'],
        metadata: {
          color: '#2196F3',
          icon: 'shield',
          objectives: ['Advance to Beta', 'Recon Area'],
        },
      },
      {
        id: 'Control',
        name: 'Control',
        description: 'Control Group',
        members: ['eve'],
        metadata: {
          color: '#4CAF50',
          icon: 'groups',
          objectives: ['Monitor Operations'],
        },
      },
    ],
    total: 3,
  }),
  getOne: async () => ({
    data: {
      id: 'Red Force',
      name: 'Red Force',
      description: 'Red Force Group',
      members: ['alice', 'bob'],
      metadata: {
        color: '#F44336',
        icon: 'military-tech',
        objectives: ['Secure Area Alpha', 'Defend Position'],
      },
    },
  }),
  getMany: async () => ({ data: [] }),
  getManyReference: async () => ({ data: [], total: 0 }),
  create: async (resource: string, params: any) => ({ data: { ...params.data, id: params.data.name } }),
  update: async (resource: string, params: any) => ({ data: params.data }),
  updateMany: async () => ({ data: [] }),
  delete: async () => ({ data: {} }),
  deleteMany: async () => ({ data: [] }),
};

const meta = {
  title: 'Admin/Forces',
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
 * Force List view - shows all forces in a datagrid
 */
export const List: StoryObj = {
  render: () => <ForceList />,
};

/**
 * Force Create view - form for creating a new force
 */
export const Create: StoryObj = {
  render: () => <ForceCreate />,
};

/**
 * Force Edit view - tabbed form for editing force details and members
 */
export const Edit: StoryObj = {
  render: () => <ForceEdit />,
};

/**
 * Force Show view - readonly display of force information
 */
export const Show: StoryObj = {
  render: () => <ForceShow />,
};
