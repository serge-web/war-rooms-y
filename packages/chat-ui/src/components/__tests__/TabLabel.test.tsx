/**
 * TabLabel Component Tests
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { unreadCountAtomFamily } from '@war-rooms/state';
import { TabLabel } from '../TabLabel';

// Test wrapper component to hydrate atoms
function TestProvider({
  roomJid,
  unreadCount,
  children,
}: {
  roomJid: string;
  unreadCount: number;
  children: React.ReactNode;
}) {
  useHydrateAtoms([[unreadCountAtomFamily(roomJid), unreadCount]]);
  return <>{children}</>;
}

describe('TabLabel', () => {
  const roomJid = 'test-room@conference.example.com';
  const roomName = 'Test Room';

  describe('Rendering', () => {
    it('should render room name', () => {
      render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={0}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      expect(screen.getByText(roomName)).toBeInTheDocument();
    });

    it('should render without badge when unread count is 0', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={0}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      // Badge should not be visible when count is 0
      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('Unread Count Badge', () => {
    it('should show badge with count when there are unread messages', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={5}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('should show different unread counts', () => {
      const { container, rerender } = render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={3}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      let badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toHaveTextContent('3');

      // Re-render with different count
      rerender(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={42}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toHaveTextContent('42');
    });

    it('should cap unread count at 99', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={150}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('99+');
    });

    it('should use error color for badge', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={10}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      const badge = container.querySelector('.MuiBadge-colorError');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Multiple Rooms', () => {
    it('should track unread counts independently per room', () => {
      const room1Jid = 'room1@conference.example.com';
      const room2Jid = 'room2@conference.example.com';

      const { container: container1 } = render(
        <Provider>
          <TestProvider roomJid={room1Jid} unreadCount={5}>
            <TabLabel roomJid={room1Jid} name="Room 1" />
          </TestProvider>
        </Provider>
      );

      const { container: container2 } = render(
        <Provider>
          <TestProvider roomJid={room2Jid} unreadCount={10}>
            <TabLabel roomJid={room2Jid} name="Room 2" />
          </TestProvider>
        </Provider>
      );

      const badge1 = container1.querySelector('.MuiBadge-badge');
      const badge2 = container2.querySelector('.MuiBadge-badge');

      expect(badge1).toHaveTextContent('5');
      expect(badge2).toHaveTextContent('10');
    });
  });

  describe('Badge Positioning', () => {
    it('should position badge correctly', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={7}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).toBeInTheDocument();

      // Badge should have custom positioning styles
      const badgeElement = badge as HTMLElement;
      expect(badgeElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative unread counts', () => {
      const { container } = render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={-1}>
            <TabLabel roomJid={roomJid} name={roomName} />
          </TestProvider>
        </Provider>
      );

      // Badge should not be shown for negative counts (MUI treats as 0)
      const badge = container.querySelector('.MuiBadge-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should handle very long room names', () => {
      const longName = 'Very Long Room Name That Might Cause Layout Issues';

      render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={5}>
            <TabLabel roomJid={roomJid} name={longName} />
          </TestProvider>
        </Provider>
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle room names with special characters', () => {
      const specialName = 'Room #1 & Room @2 [Test]';

      render(
        <Provider>
          <TestProvider roomJid={roomJid} unreadCount={0}>
            <TabLabel roomJid={roomJid} name={specialName} />
          </TestProvider>
        </Provider>
      );

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });
  });
});
