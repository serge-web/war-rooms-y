/**
 * ChatRoom Component Integration Tests
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import type { XMPPMessage, XMPPOccupant } from '@war-rooms/backend-interface';
import { messagesAtomFamily, useRoomsStore } from '@war-rooms/state';
import { ChatRoom } from '../ChatRoom';

// Mock the state stores and atoms that require backend
jest.mock('@war-rooms/state', () => ({
  ...jest.requireActual('@war-rooms/state'),
  useRoomsStore: jest.fn(),
  loadArchivedMessagesAtom: { read: jest.fn(), write: jest.fn() },
  markRoomAsReadAtom: { read: jest.fn(), write: jest.fn() },
}));

// Test wrapper to hydrate atoms
function TestProvider({
  roomJid,
  messages,
  children,
}: {
  roomJid: string;
  messages: XMPPMessage[];
  children: React.ReactNode;
}) {
  useHydrateAtoms([[messagesAtomFamily(roomJid), messages]]);
  return <>{children}</>;
}

describe('ChatRoom', () => {
  const roomJid = 'test-room@conference.example.com';

  // Mock scrollIntoView (not available in jsdom)
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  const mockMessages: XMPPMessage[] = [
    {
      id: 'msg-1',
      from: `${roomJid}/Alice`,
      to: roomJid,
      type: 'groupchat',
      body: 'Hello everyone!',
      delay: { timestamp: new Date('2025-01-20T10:00:00.000Z') },
    },
    {
      id: 'msg-2',
      from: `${roomJid}/Bob`,
      to: roomJid,
      type: 'groupchat',
      body: 'Hi Alice!',
      delay: { timestamp: new Date('2025-01-20T10:01:00.000Z') },
    },
  ];

  const mockOccupants: XMPPOccupant[] = [
    {
      nick: 'Alice',
      jid: 'alice@example.com',
      affiliation: 'owner',
      role: 'moderator',
    },
    {
      nick: 'Bob',
      jid: 'bob@example.com',
      affiliation: 'member',
      role: 'participant',
    },
  ];

  const mockSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useRoomsStore
    (useRoomsStore as unknown as jest.Mock).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        // Create mock state with rooms map
        const roomsMap = new Map();
        roomsMap.set(roomJid, {
          jid: roomJid,
          name: 'Test Room',
          occupants: mockOccupants,
        });

        const mockState = {
          sendMessage: mockSendMessage,
          rooms: roomsMap,
        };

        const selectorFn = selector as (state: typeof mockState) => unknown;
        return selectorFn(mockState);
      }
      return mockOccupants;
    });
  });

  describe('Message Display', () => {
    it('should render all messages', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={mockMessages}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      expect(screen.getByText('Hi Alice!')).toBeInTheDocument();
    });

    it('should display sender nicknames', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={mockMessages}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should display timestamps', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={mockMessages}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      // Check for time display (format may vary by locale)
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });

    it('should show messages in chronological order', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={mockMessages}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems[0]).toHaveTextContent('Hello everyone!');
      expect(listItems[1]).toHaveTextContent('Hi Alice!');
    });
  });

  describe('Message Input', () => {
    it('should render message input field', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      expect(screen.getByLabelText('Send')).toBeInTheDocument();
    });

    it('should disable send button when input is empty', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const sendButton = screen.getByLabelText('Send');
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when text is entered', async () => {
      const user = userEvent.setup();

      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test message');

      const sendButton = screen.getByLabelText('Send');
      expect(sendButton).not.toBeDisabled();
    });

    it('should call sendMessage when send button clicked', async () => {
      const user = userEvent.setup();

      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test message');

      const sendButton = screen.getByLabelText('Send');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(roomJid, 'Test message');
      });
    });

    it('should clear input after sending message', async () => {
      mockSendMessage.mockResolvedValue('msg-id');
      const user = userEvent.setup();

      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      await user.type(input, 'Test message');
      expect(input.value).toBe('Test message');

      const sendButton = screen.getByLabelText('Send');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should send message when Enter key pressed', async () => {
      const user = userEvent.setup();

      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test message{Enter}');

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(roomJid, 'Test message');
      });
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();

      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, '   {Enter}'); // Only whitespace

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Participant List', () => {
    it('should render participants button', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      expect(screen.getByLabelText('Show participants')).toBeInTheDocument();
    });

    it('should show participant count badge', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('2'); // mockOccupants has 2 people
    });

    it('should toggle participants drawer when button clicked', async () => {
      const user = userEvent.setup();

      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const button = screen.getByLabelText('Show participants');

      // Drawer should be closed initially
      expect(screen.queryByText('Participants')).not.toBeInTheDocument();

      // Click to open
      await user.click(button);

      // Drawer should now be open
      await waitFor(() => {
        expect(screen.getByText(/Participants \(2\)/)).toBeInTheDocument();
      });
    });

    it('should display all occupants in drawer', async () => {
      const user = userEvent.setup();

      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const button = screen.getByLabelText('Show participants');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should handle empty message list', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      // Should not crash, should show empty list
      const list = container.querySelector('.MuiList-root');
      expect(list).toBeInTheDocument();
    });

    it('should handle zero occupants', () => {
      (useRoomsStore as unknown as jest.Mock).mockImplementation((selector: unknown) => {
        if (typeof selector === 'function') {
          const roomsMap = new Map();
          roomsMap.set(roomJid, {
            jid: roomJid,
            name: 'Test Room',
            occupants: [],
          });
          const mockState = {
            sendMessage: mockSendMessage,
            rooms: roomsMap,
          };
          const selectorFn = selector as (state: typeof mockState) => unknown;
          return selectorFn(mockState);
        }
        return [];
      });

      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const badge = container.querySelector('.MuiBadge-badge');
      // Badge should be invisible when count is 0
      expect(badge).toHaveClass('MuiBadge-invisible');
    });
  });

  describe('Multiline Messages', () => {
    it('should support multiline input', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const input = screen.getByPlaceholderText('Type a message...');
      // MUI TextField with multiline renders a textarea
      expect(input.tagName).toBe('TEXTAREA');
    });

    it('should preserve line breaks in message body', () => {
      const multilineMessage: XMPPMessage = {
        id: 'msg-multi',
        from: `${roomJid}/Alice`,
        to: roomJid,
        type: 'groupchat',
        body: 'Line 1\nLine 2\nLine 3',
        delay: { timestamp: new Date('2025-01-20T10:00:00.000Z') },
      };

      render(
        <Provider>
          <TestProvider roomJid={roomJid} messages={[multilineMessage]}>
            <ChatRoom roomJid={roomJid} />
          </TestProvider>
        </Provider>
      );

      const messageBody = screen.getByText(/Line 1/);
      expect(messageBody).toBeInTheDocument();
      expect(messageBody.textContent).toContain('Line 1');
      expect(messageBody.textContent).toContain('Line 2');
      expect(messageBody.textContent).toContain('Line 3');
    });
  });
});
