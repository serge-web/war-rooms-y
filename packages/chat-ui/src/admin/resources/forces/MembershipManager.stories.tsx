/**
 * Storybook stories for MembershipManager component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MembershipManager } from './MembershipManager';
import { RecordContextProvider, DataProviderContext } from 'react-admin';
import { fn } from '@storybook/test';

const meta = {
  title: 'Admin/MembershipManager',
  component: MembershipManager,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MembershipManager>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data provider
const mockDataProvider = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: fn(async (resource: string, params: any) => {
    console.log('Update called:', resource, params);
    return { data: params.data };
  }),
  getOne: fn(),
  getList: fn(),
  getMany: fn(),
  getManyReference: fn(),
  create: fn(),
  delete: fn(),
  deleteMany: fn(),
  updateMany: fn(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WithProviders = ({ record, children }: any) => (
  <DataProviderContext.Provider value={mockDataProvider}>
    <RecordContextProvider value={record}>{children}</RecordContextProvider>
  </DataProviderContext.Provider>
);

/**
 * Empty group - no members yet
 */
export const EmptyGroup: Story = {
  render: () => (
    <WithProviders
      record={{
        name: 'Red Force',
        description: 'Red Force Group',
        members: [],
      }}
    >
      <MembershipManager />
    </WithProviders>
  ),
};

/**
 * Group with members
 */
export const WithMembers: Story = {
  render: () => (
    <WithProviders
      record={{
        name: 'Blue Force',
        description: 'Blue Force Group',
        members: ['alice', 'bob', 'charlie'],
      }}
    >
      <MembershipManager />
    </WithProviders>
  ),
};

/**
 * Large group with many members
 */
export const LargeGroup: Story = {
  render: () => (
    <WithProviders
      record={{
        name: 'Control',
        description: 'Control Group',
        members: [
          'user1',
          'user2',
          'user3',
          'user4',
          'user5',
          'user6',
          'user7',
          'user8',
          'user9',
          'user10',
        ],
      }}
    >
      <MembershipManager />
    </WithProviders>
  ),
};

/**
 * Single member group
 */
export const SingleMember: Story = {
  render: () => (
    <WithProviders
      record={{
        name: 'Admins',
        description: 'System Administrators',
        members: ['admin'],
      }}
    >
      <MembershipManager />
    </WithProviders>
  ),
};
