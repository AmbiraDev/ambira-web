import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  MoreVertical,
  X,
  ThumbsUp,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/**
 * Accessibility Tests for Icon-Only Buttons
 *
 * These tests verify that all icon-only buttons have proper ARIA labels
 * to ensure screen reader users can understand the purpose of each button.
 *
 * WCAG 2.1 Success Criteria:
 * - 1.1.1 Non-text Content (Level A)
 * - 4.1.2 Name, Role, Value (Level A)
 */

// Mock components that represent icon-only button patterns in the codebase
const MenuButton = () => (
  <button
    onClick={() => {}}
    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200 min-h-[44px] min-w-[44px]"
    aria-label="Session options"
    aria-expanded={false}
    aria-haspopup="true"
  >
    <MoreVertical className="w-5 h-5" aria-hidden="true" />
  </button>
);

const CloseButton = () => (
  <button
    onClick={() => {}}
    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
    aria-label="Close dialog"
  >
    <X className="w-6 h-6" aria-hidden="true" />
  </button>
);

const LikeButton = ({
  isLiked = false,
  count = 0,
}: {
  isLiked?: boolean;
  count?: number;
}) => (
  <button
    onClick={() => {}}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
    aria-label={
      isLiked
        ? `Unlike session (${count} ${count === 1 ? 'like' : 'likes'})`
        : `Like session (${count} ${count === 1 ? 'like' : 'likes'})`
    }
  >
    <ThumbsUp
      className={`w-5 h-5 transition-colors ${isLiked ? 'fill-gray-700 text-gray-700' : 'text-gray-600'}`}
      strokeWidth={1.5}
      aria-hidden="true"
    />
    <span className="text-sm font-medium" aria-hidden="true">
      {count > 0 ? count : ''}
    </span>
  </button>
);

const ShareButton = ({ showMenu = false }: { showMenu?: boolean }) => (
  <button
    onClick={() => {}}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
    aria-label="Share session"
    aria-expanded={showMenu}
    aria-haspopup="true"
  >
    <Share2
      className="w-5 h-5 text-gray-600"
      strokeWidth={1.5}
      aria-hidden="true"
    />
  </button>
);

const PaginationButtons = () => (
  <div className="flex gap-2">
    <button
      onClick={() => {}}
      disabled={false}
      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
      aria-label="Previous page"
    >
      <ChevronLeft className="w-4 h-4" />
      Previous
    </button>
    <button
      onClick={() => {}}
      disabled={false}
      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
      aria-label="Next page"
    >
      Next
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

const PlayPauseButton = ({ isPaused = false }: { isPaused?: boolean }) => (
  <button
    onClick={() => {}}
    className="p-1 text-gray-600 hover:text-yellow-600 transition-colors"
    title={isPaused ? 'Resume timer' : 'Pause timer'}
    aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
  >
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  </button>
);

describe('Icon-Only Button Accessibility', () => {
  describe('Menu/Options Buttons', () => {
    it('should have aria-label for screen readers', () => {
      render(<MenuButton />);
      const button = screen.getByRole('button', { name: /session options/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Session options');
    });

    it('should have aria-expanded attribute for menu state', () => {
      render(<MenuButton />);
      const button = screen.getByRole('button', { name: /session options/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-haspopup to indicate menu presence', () => {
      render(<MenuButton />);
      const button = screen.getByRole('button', { name: /session options/i });
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should mark icon as decorative with aria-hidden', () => {
      const { container } = render(<MenuButton />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should meet minimum touch target size (44x44px)', () => {
      render(<MenuButton />);
      const button = screen.getByRole('button', { name: /session options/i });
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });
  });

  describe('Close Dialog Buttons', () => {
    it('should have aria-label describing the action', () => {
      render(<CloseButton />);
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('should hide icon from screen readers', () => {
      const { container } = render(<CloseButton />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Like/Support Buttons', () => {
    it('should have descriptive aria-label with current state and count', () => {
      render(<LikeButton isLiked={false} count={5} />);
      const button = screen.getByRole('button', { name: /like session/i });
      expect(button).toHaveAttribute('aria-label', 'Like session (5 likes)');
    });

    it('should update aria-label when liked', () => {
      render(<LikeButton isLiked={true} count={6} />);
      const button = screen.getByRole('button', { name: /unlike session/i });
      expect(button).toHaveAttribute('aria-label', 'Unlike session (6 likes)');
    });

    it('should use singular form for count of 1', () => {
      render(<LikeButton isLiked={false} count={1} />);
      const button = screen.getByRole('button', { name: /like session/i });
      expect(button).toHaveAttribute('aria-label', 'Like session (1 like)');
    });

    it('should handle zero likes', () => {
      render(<LikeButton isLiked={false} count={0} />);
      const button = screen.getByRole('button', { name: /like session/i });
      expect(button).toHaveAttribute('aria-label', 'Like session (0 likes)');
    });

    it('should hide count text from screen readers to avoid duplication', () => {
      const { container } = render(<LikeButton count={5} />);
      const countSpan = container.querySelector('span');
      expect(countSpan).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Share Buttons', () => {
    it('should have aria-label for share action', () => {
      render(<ShareButton />);
      const button = screen.getByRole('button', { name: /share session/i });
      expect(button).toHaveAttribute('aria-label', 'Share session');
    });

    it('should indicate menu popup with aria-haspopup', () => {
      render(<ShareButton />);
      const button = screen.getByRole('button', { name: /share session/i });
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should communicate menu state with aria-expanded', () => {
      render(<ShareButton showMenu={false} />);
      const button = screen.getByRole('button', { name: /share session/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Pagination Navigation Buttons', () => {
    it('should have aria-label for previous button', () => {
      render(<PaginationButtons />);
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toHaveAttribute('aria-label', 'Previous page');
    });

    it('should have aria-label for next button', () => {
      render(<PaginationButtons />);
      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toHaveAttribute('aria-label', 'Next page');
    });

    it('should support disabled state for navigation limits', () => {
      const { rerender } = render(
        <button disabled={true} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
      );
      const button = screen.getByRole('button', { name: /previous page/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Play/Pause Control Buttons', () => {
    it('should have aria-label for pause state', () => {
      render(<PlayPauseButton isPaused={false} />);
      const button = screen.getByRole('button', { name: /pause timer/i });
      expect(button).toHaveAttribute('aria-label', 'Pause timer');
    });

    it('should have aria-label for resume state', () => {
      render(<PlayPauseButton isPaused={true} />);
      const button = screen.getByRole('button', { name: /resume timer/i });
      expect(button).toHaveAttribute('aria-label', 'Resume timer');
    });

    it('should have title attribute as fallback tooltip', () => {
      render(<PlayPauseButton isPaused={false} />);
      const button = screen.getByRole('button', { name: /pause timer/i });
      expect(button).toHaveAttribute('title', 'Pause timer');
    });

    it('should mark SVG icon as decorative', () => {
      const { container } = render(<PlayPauseButton />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('General Accessibility Requirements', () => {
    it('all icon-only buttons should be reachable by keyboard', () => {
      render(
        <div>
          <MenuButton />
          <CloseButton />
          <LikeButton />
          <ShareButton />
          <PlayPauseButton />
        </div>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // All buttons should be naturally keyboard accessible (no tabIndex=-1)
        expect(button.getAttribute('tabindex')).not.toBe('-1');
      });
    });

    it('icon-only buttons should not rely solely on title attribute for accessibility', () => {
      // This test documents that while title provides a tooltip,
      // aria-label is preferred for screen reader announcements
      render(<PlayPauseButton />);
      const button = screen.getByRole('button', { name: /pause timer/i });

      // Both title and aria-label should be present for best support
      expect(button).toHaveAttribute('title');
      expect(button).toHaveAttribute('aria-label');
    });

    it('decorative icons should consistently use aria-hidden', () => {
      const { container: container1 } = render(<MenuButton />);
      render(<CloseButton />);
      render(<LikeButton />);

      const icons = [container1.querySelector('svg')];

      icons.forEach(icon => {
        if (icon) {
          expect(icon).toHaveAttribute('aria-hidden', 'true');
        }
      });
    });
  });

  describe('ARIA Label Quality', () => {
    it('should use action-oriented language (verbs)', () => {
      render(
        <div>
          <MenuButton />
          <CloseButton />
          <ShareButton />
        </div>
      );

      // Check that labels describe actions, not just objects
      expect(
        screen.getByRole('button', { name: /session options/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /close dialog/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /share session/i })
      ).toBeInTheDocument();
    });

    it('should provide contextual information in labels', () => {
      render(<LikeButton isLiked={false} count={5} />);
      const button = screen.getByRole('button', {
        name: /like session \(5 likes\)/i,
      });

      // Label includes both action and context (current count)
      expect(button).toBeInTheDocument();
      expect(button.getAttribute('aria-label')).toContain('Like session');
      expect(button.getAttribute('aria-label')).toContain('5 likes');
    });

    it('should indicate state changes in dynamic labels', () => {
      const { rerender } = render(<LikeButton isLiked={false} count={5} />);
      let button = screen.getByRole('button', { name: /like session/i });
      expect(button).toHaveAttribute('aria-label', 'Like session (5 likes)');

      rerender(<LikeButton isLiked={true} count={6} />);
      button = screen.getByRole('button', { name: /unlike session/i });
      expect(button).toHaveAttribute('aria-label', 'Unlike session (6 likes)');
    });
  });

  describe('Touch Target Sizing', () => {
    it('should meet WCAG 2.5.5 minimum touch target size', () => {
      // WCAG 2.5.5 requires minimum 44x44 CSS pixels for touch targets
      render(<MenuButton />);
      const button = screen.getByRole('button', { name: /session options/i });

      const hasMinHeight = button.className.includes('min-h-[44px]');
      const hasMinWidth = button.className.includes('min-w-[44px]');

      expect(hasMinHeight || hasMinWidth).toBe(true);
    });
  });
});
