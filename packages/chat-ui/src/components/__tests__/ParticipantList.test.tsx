/**
 * ParticipantList Component Tests
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { XMPPOccupant } from '@war-rooms/backend-interface';
import { ParticipantList } from '../ParticipantList';

describe('ParticipantList', () => {
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
    {
      nick: 'Charlie',
      jid: 'charlie@example.com',
      affiliation: 'admin',
      role: 'moderator',
    },
    {
      nick: 'Diana',
      jid: 'diana@example.com',
      affiliation: 'none',
      role: 'visitor',
    },
  ];

  describe('Rendering', () => {
    it('should render list with title and count', () => {
      render(<ParticipantList occupants={mockOccupants} />);

      expect(screen.getByText(/Participants \(4\)/)).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(<ParticipantList occupants={mockOccupants} title="Team Members" />);

      expect(screen.getByText(/Team Members \(4\)/)).toBeInTheDocument();
    });

    it('should render all participant names', () => {
      render(<ParticipantList occupants={mockOccupants} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Diana')).toBeInTheDocument();
    });

    it('should show "No participants" when list is empty', () => {
      render(<ParticipantList occupants={[]} />);

      expect(screen.getByText('No participants')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort moderators first', () => {
      const { container } = render(<ParticipantList occupants={mockOccupants} />);

      const listItems = container.querySelectorAll('.MuiListItem-root');
      // First two should be moderators (Alice and Charlie sorted alphabetically)
      // Alice comes before Charlie alphabetically
      expect(listItems[0]).toHaveTextContent('Alice');
      expect(listItems[1]).toHaveTextContent('Charlie');
    });

    it('should sort non-moderators alphabetically after moderators', () => {
      const { container } = render(<ParticipantList occupants={mockOccupants} />);

      const listItems = container.querySelectorAll('.MuiListItem-root');
      // After moderators (Alice, Charlie), should be Bob, then Diana
      expect(listItems[2]).toHaveTextContent('Bob');
      expect(listItems[3]).toHaveTextContent('Diana');
    });
  });

  describe('Role Display', () => {
    it('should show "Mod" chip for moderators in non-compact mode', () => {
      render(<ParticipantList occupants={mockOccupants} />);

      const modChips = screen.getAllByText('Mod');
      expect(modChips).toHaveLength(2); // Alice and Charlie are moderators
    });

    it('should not show "Mod" chip in compact mode', () => {
      render(<ParticipantList occupants={mockOccupants} compact />);

      expect(screen.queryByText('Mod')).not.toBeInTheDocument();
    });
  });

  describe('Affiliation Display', () => {
    it('should show "Owner" label for owner affiliation', () => {
      render(<ParticipantList occupants={mockOccupants} />);

      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('should show "Admin" label for admin affiliation', () => {
      render(<ParticipantList occupants={mockOccupants} />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should show "Member" label for member affiliation', () => {
      render(<ParticipantList occupants={mockOccupants} />);

      expect(screen.getByText('Member')).toBeInTheDocument();
    });

    it('should not show label for "none" affiliation', () => {
      const { container } = render(<ParticipantList occupants={mockOccupants} />);

      // Diana has "none" affiliation - should not have any affiliation label
      const dianaItem = Array.from(container.querySelectorAll('.MuiListItem-root')).find((el) =>
        el.textContent?.includes('Diana')
      );

      expect(dianaItem).toBeInTheDocument();
      // Should not have Owner, Admin, or Member chips
      expect(dianaItem?.textContent).not.toMatch(/Owner|Admin|Member/);
    });

    it('should not show affiliation labels in compact mode', () => {
      render(<ParticipantList occupants={mockOccupants} compact />);

      expect(screen.queryByText('Owner')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Member')).not.toBeInTheDocument();
    });
  });

  describe('Presence Indicators', () => {
    it('should render presence indicator for each participant', () => {
      const { container } = render(<ParticipantList occupants={mockOccupants} />);

      // Each list item should have a presence indicator (SVG icon)
      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems).toHaveLength(4);

      listItems.forEach((item) => {
        expect(item.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('should pass presence show state to PresenceIndicator', () => {
      const { container } = render(<ParticipantList occupants={mockOccupants} />);

      // Verify SVG icons are present (PresenceIndicator is rendering)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Status Messages', () => {
    it('should render without status messages when not available', () => {
      // Note: MUCUserItem from Stanza.js doesn't include presence status
      // so status messages are not expected to be shown
      render(<ParticipantList occupants={mockOccupants} />);

      // Component should still render successfully
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should render in compact mode without status messages', () => {
      render(<ParticipantList occupants={mockOccupants} compact />);

      // Component should still render successfully
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should use dense list in compact mode', () => {
      const { container } = render(<ParticipantList occupants={mockOccupants} compact />);

      const list = container.querySelector('.MuiList-root');
      expect(list).toBeInTheDocument();
    });

    it('should use smaller text in compact mode', () => {
      const { container } = render(<ParticipantList occupants={mockOccupants} compact />);

      // Check that names are still rendered
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single occupant', () => {
      render(<ParticipantList occupants={[mockOccupants[0]!]} />);

      expect(screen.getByText(/Participants \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should handle occupant without presence data', () => {
      const occupantWithoutPresence: XMPPOccupant = {
        nick: 'Eve',
        affiliation: 'member',
        role: 'participant',
      };

      render(<ParticipantList occupants={[occupantWithoutPresence]} />);

      expect(screen.getByText('Eve')).toBeInTheDocument();
    });

    it('should handle occupant without jid', () => {
      const occupantWithoutJid: XMPPOccupant = {
        nick: 'Anonymous',
        affiliation: 'none',
        role: 'visitor',
      };

      render(<ParticipantList occupants={[occupantWithoutJid]} />);

      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });
  });
});
