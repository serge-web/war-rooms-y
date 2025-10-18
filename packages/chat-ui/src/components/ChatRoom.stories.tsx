import type { Meta, StoryObj } from '@storybook/react';
import { Provider, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { ChatRoom } from './ChatRoom';
import { BackendProvider } from '../providers/BackendProvider';
import { ThemeProvider } from '../providers/ThemeProvider';
import { useRoomsStore, setRoomMessagesAtom, type RoomsStore } from '@war-rooms/state';
import type { XMPPMessage } from '@war-rooms/backend-interface';

// Mock room data setup component
function MockRoomSetup({ roomJid, children }: { roomJid: string; children: React.ReactNode }) {
  const setMessages = useSetAtom(setRoomMessagesAtom);
  const loadMyRooms = useRoomsStore((state: RoomsStore) => state.loadMyRooms);

  useEffect(() => {
    // Set up mock room
    const setup = async () => {
      try {
        await loadMyRooms();

        // Add mock messages
        const mockMessages: XMPPMessage[] = [
          {
            id: 'msg-1',
            from: `${roomJid}/Commander`,
            to: roomJid,
            type: 'groupchat',
            body: 'All units, prepare for mission briefing.',
            delay: { stamp: new Date(Date.now() - 300000).toISOString() },
          },
          {
            id: 'msg-2',
            from: `${roomJid}/Analyst`,
            to: roomJid,
            type: 'groupchat',
            body: 'Intel report ready for review.',
            delay: { stamp: new Date(Date.now() - 200000).toISOString() },
          },
          {
            id: 'msg-3',
            from: `${roomJid}/Operator`,
            to: roomJid,
            type: 'groupchat',
            body: 'Standing by for orders.',
            delay: { stamp: new Date(Date.now() - 100000).toISOString() },
          },
        ];

        setMessages({ roomJid, messages: mockMessages });
      } catch (error) {
        console.error('Failed to set up mock room:', error);
      }
    };

    void setup();
  }, [roomJid, setMessages, loadMyRooms]);

  return <>{children}</>;
}

const meta = {
  title: 'Components/ChatRoom',
  component: ChatRoom,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => (
      <Provider>
        <BackendProvider>
          <ThemeProvider>
            <MockRoomSetup roomJid={context.args.roomJid}>
              <div style={{ height: '600px' }}>
                <Story />
              </div>
            </MockRoomSetup>
          </ThemeProvider>
        </BackendProvider>
      </Provider>
    ),
  ],
} satisfies Meta<typeof ChatRoom>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RedCommand: Story = {
  args: {
    roomJid: 'red-command@conference.wargame.local',
  },
};

export const AllHands: Story = {
  args: {
    roomJid: 'all-hands@conference.wargame.local',
  },
};

export const EmptyRoom: Story = {
  args: {
    roomJid: 'empty-room@conference.wargame.local',
  },
  decorators: [
    (Story) => (
      <Provider>
        <BackendProvider>
          <ThemeProvider>
            <div style={{ height: '600px' }}>
              <Story />
            </div>
          </ThemeProvider>
        </BackendProvider>
      </Provider>
    ),
  ],
};
