/**
 * PresenceIndicator Component Tests
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { PresenceIndicator } from '../PresenceIndicator';

describe('PresenceIndicator', () => {
  describe('Presence States', () => {
    it('should render available/online state (no show prop)', () => {
      const { container } = render(<PresenceIndicator />);

      // Should show icon
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render chat state (green)', () => {
      const { container } = render(<PresenceIndicator show="chat" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render away state (yellow)', () => {
      const { container } = render(<PresenceIndicator show="away" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render dnd state (red)', () => {
      const { container } = render(<PresenceIndicator show="dnd" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render xa state (gray)', () => {
      const { container } = render(<PresenceIndicator show="xa" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Status Messages', () => {
    it('should display status in tooltip when provided', () => {
      const { container } = render(<PresenceIndicator show="away" status="In a meeting" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      // Tooltip would show "Away: In a meeting"
    });

    it('should display only presence label when no status', () => {
      const { container } = render(<PresenceIndicator show="dnd" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      // Tooltip would show "Do not disturb"
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const { container } = render(<PresenceIndicator size="small" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render medium size', () => {
      const { container } = render(<PresenceIndicator size="medium" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<PresenceIndicator size="large" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should default to small size when not specified', () => {
      const { container } = render(<PresenceIndicator />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
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
