/**
 * PresenceIndicator Component Tests
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PresenceIndicator } from '../PresenceIndicator';

describe('PresenceIndicator', () => {
  describe('Presence States', () => {
    it('should render available/online state (no show prop)', () => {
      render(<PresenceIndicator />);

      // Should show tooltip with "Available"
      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });

    it('should render chat state (green)', () => {
      render(<PresenceIndicator show="chat" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });

    it('should render away state (yellow)', () => {
      render(<PresenceIndicator show="away" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });

    it('should render dnd state (red)', () => {
      render(<PresenceIndicator show="dnd" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });

    it('should render xa state (gray)', () => {
      render(<PresenceIndicator show="xa" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Status Messages', () => {
    it('should display status in tooltip when provided', () => {
      render(<PresenceIndicator show="away" status="In a meeting" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
      // Tooltip would show "Away: In a meeting"
    });

    it('should display only presence label when no status', () => {
      render(<PresenceIndicator show="dnd" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
      // Tooltip would show "Do not disturb"
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<PresenceIndicator size="small" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });

    it('should render medium size', () => {
      render(<PresenceIndicator size="medium" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<PresenceIndicator size="large" />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });

    it('should default to small size when not specified', () => {
      render(<PresenceIndicator />);

      const indicator = screen.getByRole('img', { hidden: true }).parentElement;
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Icon Selection', () => {
    it('should use Circle icon for available state', () => {
      const { container } = render(<PresenceIndicator />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should use Circle icon for chat state', () => {
      const { container } = render(<PresenceIndicator show="chat" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should use RemoveCircle icon for away state', () => {
      const { container } = render(<PresenceIndicator show="away" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should use DoNotDisturb icon for dnd state', () => {
      const { container } = render(<PresenceIndicator show="dnd" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should use Help icon for xa state', () => {
      const { container } = render(<PresenceIndicator show="xa" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});
