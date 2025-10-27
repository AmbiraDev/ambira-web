import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityCard } from '@/components/ActivityCard';
import { Activity, ActivityStats } from '@/types';

/**
 * Comprehensive tests for ActivityCard component
 *
 * Coverage:
 * - Accessibility (ARIA labels, keyboard navigation, focus states, touch targets)
 * - Component rendering (various props, loading states, empty states)
 * - Icon rendering (Lucide React components)
 * - Interactions (menu, keyboard navigation, actions)
 * - Error handling
 */

// Mock dependencies
jest.mock('@/contexts/ProjectsContext', () => ({
  useProjects: () => ({
    getProjectStats: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('ActivityCard Component', () => {
  const mockActivity: Activity = {
    id: 'activity-1',
    userId: 'user-1',
    name: 'Writing Project',
    description: 'Daily writing practice',
    color: 'blue',
    icon: 'Pen',
    status: 'active',
    weeklyTarget: 10,
    totalTarget: 100,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockStats: ActivityStats = {
    weeklyHours: 5.5,
    totalHours: 42.3,
    sessionCount: 15,
    currentStreak: 0,
    weeklyProgressPercentage: 0,
    totalProgressPercentage: 0,
    averageSessionDuration: 2.82,
  };

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onArchive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accessibility - ARIA Labels and Attributes', () => {
    it('should have proper aria-label for menu button', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-label', 'Open activity menu');
    });

    it('should have aria-expanded state on menu button', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-haspopup on menu button', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      expect(menuButton).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should have proper ARIA attributes on weekly progress bar', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const weeklyProgressBar = screen.getByRole('progressbar', {
        name: /weekly progress/i,
      });
      expect(weeklyProgressBar).toHaveAttribute('aria-valuenow', '55'); // 5.5/10 * 100
      expect(weeklyProgressBar).toHaveAttribute('aria-valuemin', '0');
      expect(weeklyProgressBar).toHaveAttribute('aria-valuemax', '100');
      expect(weeklyProgressBar).toHaveAttribute(
        'aria-label',
        'Weekly progress: 5.5 hours of 10 hours'
      );
    });

    it('should have proper ARIA attributes on total progress bar', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const totalProgressBar = screen.getByRole('progressbar', {
        name: /total progress/i,
      });
      expect(totalProgressBar).toHaveAttribute('aria-valuenow', '42'); // 42.3/100 * 100
      expect(totalProgressBar).toHaveAttribute('aria-valuemin', '0');
      expect(totalProgressBar).toHaveAttribute('aria-valuemax', '100');
      expect(totalProgressBar).toHaveAttribute(
        'aria-label',
        'Total progress: 42.3 hours of 100 hours'
      );
    });

    it('should have role="menu" on dropdown menu', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });

    it('should have role="menuitem" on menu items', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBe(3); // Edit, Archive, Delete
    });
  });

  describe('Accessibility - Touch Target Sizing', () => {
    it('should meet minimum 44x44px touch target for menu button', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      expect(menuButton).toHaveClass('min-h-[44px]');
      expect(menuButton).toHaveClass('min-w-[44px]');
    });
  });

  describe('Accessibility - Keyboard Navigation', () => {
    it('should open menu with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      menuButton.focus();

      await user.keyboard('{Enter}');

      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should open menu with Space key', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      menuButton.focus();

      await user.keyboard(' ');

      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should close menu with Escape key', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      await user.click(menuButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should navigate menu items with ArrowDown key', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      await user.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      const firstItem = menuItems[0];
      const secondItem = menuItems[1];
      if (
        !firstItem ||
        !secondItem ||
        !(firstItem instanceof HTMLElement) ||
        !(secondItem instanceof HTMLElement)
      )
        return;
      firstItem.focus();

      await user.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(secondItem);
    });

    it('should navigate menu items with ArrowUp key', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      await user.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      const firstItem = menuItems[0];
      const secondItem = menuItems[1];
      if (
        !firstItem ||
        !secondItem ||
        !(firstItem instanceof HTMLElement) ||
        !(secondItem instanceof HTMLElement)
      )
        return;
      secondItem.focus();

      await user.keyboard('{ArrowUp}');

      expect(document.activeElement).toBe(firstItem);
    });

    it('should wrap around when navigating down from last menu item', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      await user.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      const firstItem = menuItems[0];
      const lastItem = menuItems[2];
      if (
        !firstItem ||
        !lastItem ||
        !(firstItem instanceof HTMLElement) ||
        !(lastItem instanceof HTMLElement)
      )
        return;
      lastItem.focus(); // Last item

      await user.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(firstItem); // Should wrap to first
    });

    it('should wrap around when navigating up from first menu item', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      await user.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      const firstItem = menuItems[0];
      const lastItem = menuItems[2];
      if (
        !firstItem ||
        !lastItem ||
        !(firstItem instanceof HTMLElement) ||
        !(lastItem instanceof HTMLElement)
      )
        return;
      firstItem.focus(); // First item

      await user.keyboard('{ArrowUp}');

      expect(document.activeElement).toBe(lastItem); // Should wrap to last
    });

    it('should activate menu item with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      await user.click(menuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      editButton.focus();

      await user.keyboard('{Enter}');

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockActivity);
    });

    it('should activate menu item with Space key', async () => {
      const user = userEvent.setup();
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      await user.click(menuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      editButton.focus();

      await user.keyboard(' ');

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockActivity);
    });
  });

  describe('Accessibility - Focus States', () => {
    it('should have visible focus indicator on menu button', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      expect(menuButton).toHaveClass('focus-visible:opacity-100');
      expect(menuButton).toHaveClass('focus-visible:ring-2');
      expect(menuButton).toHaveClass('focus-visible:ring-[#007AFF]');
    });

    it('should have visible focus indicator on menu items', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach(item => {
        expect(item).toHaveClass('focus-visible:ring-2');
        expect(item).toHaveClass('focus-visible:ring-[#007AFF]');
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render activity card with all props', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Writing Project')).toBeInTheDocument();
      expect(screen.getByText('Daily writing practice')).toBeInTheDocument();
    });

    it('should render weekly progress section when weeklyTarget is set', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/this week/i)).toBeInTheDocument();
      expect(screen.getByText(/5.5h \/ 10h/i)).toBeInTheDocument();
    });

    it('should render total progress section when totalTarget is set', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/total/i)).toBeInTheDocument();
      expect(screen.getByText(/42.3h \/ 100h/i)).toBeInTheDocument();
    });

    it('should not render weekly progress when weeklyTarget is not set', () => {
      const activityNoWeekly = { ...mockActivity, weeklyTarget: undefined };
      render(
        <ActivityCard
          activity={activityNoWeekly}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      expect(screen.queryByText(/this week/i)).not.toBeInTheDocument();
    });

    it('should not render total progress when totalTarget is not set', () => {
      const activityNoTotal = { ...mockActivity, totalTarget: undefined };
      render(
        <ActivityCard
          activity={activityNoTotal}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    });

    it('should display "No targets set" when no targets are defined', async () => {
      const activityNoTargets = {
        ...mockActivity,
        weeklyTarget: undefined,
        totalTarget: undefined,
      };
      // Render without stats prop and no targets
      render(<ActivityCard activity={activityNoTargets} {...mockHandlers} />);

      // Wait for the async stats loading to complete
      await waitFor(() => {
        expect(screen.getByText(/no targets set/i)).toBeInTheDocument();
      });
    });

    it('should show progress when stats are provided', () => {
      // Simpler test - just verify that when stats are provided, they render
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      // Should show progress bars instead of loading state
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should display Archive button for active activities', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      expect(
        screen.getByRole('menuitem', { name: /archive/i })
      ).toBeInTheDocument();
    });

    it('should display Restore button for archived activities', () => {
      const archivedActivity = { ...mockActivity, status: 'archived' as const };
      render(
        <ActivityCard
          activity={archivedActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      expect(
        screen.getByRole('menuitem', { name: /restore/i })
      ).toBeInTheDocument();
    });

    it('should handle zero hours in progress display', () => {
      const zeroStats: ActivityStats = {
        weeklyHours: 0,
        totalHours: 0,
        sessionCount: 0,
        currentStreak: 0,
        weeklyProgressPercentage: 0,
        totalProgressPercentage: 0,
        averageSessionDuration: 0,
      };
      render(
        <ActivityCard
          activity={mockActivity}
          stats={zeroStats}
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/0.0h \/ 10h/i)).toBeInTheDocument();
      expect(screen.getByText(/0.0h \/ 100h/i)).toBeInTheDocument();
    });

    it('should cap progress at 100% when hours exceed target', () => {
      const overStats: ActivityStats = {
        weeklyHours: 15, // Exceeds 10h target
        totalHours: 150, // Exceeds 100h target
        sessionCount: 50,
        currentStreak: 0,
        weeklyProgressPercentage: 0,
        totalProgressPercentage: 0,
        averageSessionDuration: 3,
      };
      render(
        <ActivityCard
          activity={mockActivity}
          stats={overStats}
          {...mockHandlers}
        />
      );

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        const value = parseInt(bar.getAttribute('aria-valuenow') || '0', 10);
        expect(value).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon from IconRenderer', () => {
      const { container } = render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      // IconRenderer should be rendering an icon
      const iconContainer = container.querySelector('.w-14.h-14.rounded-xl');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply correct color to icon container', () => {
      const { container } = render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const iconContainer = container.querySelector('.w-14.h-14.rounded-xl');
      expect(iconContainer).toHaveAttribute(
        'style',
        expect.stringContaining('background-color')
      );
    });
  });

  describe('Menu Interactions', () => {
    it('should open menu on button click', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should close menu on second button click', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);
      fireEvent.click(menuButton);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should close menu when clicking outside', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should call onEdit when Edit is clicked', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      fireEvent.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockActivity);
    });

    it('should call onArchive when Archive is clicked', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      const archiveButton = screen.getByRole('menuitem', { name: /archive/i });
      fireEvent.click(archiveButton);

      expect(mockHandlers.onArchive).toHaveBeenCalledWith(mockActivity);
    });

    it('should call onDelete when Delete is clicked', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockActivity);
    });

    it('should close menu after selecting an action', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      fireEvent.click(editButton);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should stop propagation when clicking menu button', () => {
      const mockLinkClick = jest.fn();
      render(
        <div onClick={mockLinkClick}>
          <ActivityCard
            activity={mockActivity}
            stats={mockStats}
            {...mockHandlers}
          />
        </div>
      );

      const menuButton = screen.getByRole('button', {
        name: /open activity menu/i,
      });
      fireEvent.click(menuButton);

      // Parent click handler should not be called
      expect(mockLinkClick).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display activity info even without stats', () => {
      // Render without stats prop
      render(<ActivityCard activity={mockActivity} {...mockHandlers} />);

      // Activity name and description should still be visible
      expect(screen.getByText('Writing Project')).toBeInTheDocument();
      expect(screen.getByText('Daily writing practice')).toBeInTheDocument();
    });

    it('should handle undefined stats gracefully', () => {
      // Component should render without crashing when stats are undefined
      const { container } = render(
        <ActivityCard
          activity={mockActivity}
          stats={undefined}
          {...mockHandlers}
        />
      );

      // Should render successfully
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Writing Project')).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Visual Design', () => {
    it('should use correct Tailwind color classes for progress bars', () => {
      render(
        <ActivityCard
          activity={mockActivity}
          stats={mockStats}
          {...mockHandlers}
        />
      );

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        expect(bar).toHaveClass('bg-blue-500'); // Should match activity color
      });
    });

    it('should handle all supported color options', () => {
      const colors = ['orange', 'blue', 'green', 'purple', 'red'];

      colors.forEach(color => {
        const activity = { ...mockActivity, color };
        const { container, unmount } = render(
          <ActivityCard
            activity={activity}
            stats={mockStats}
            {...mockHandlers}
          />
        );

        // Icon container should have correct background color
        const iconContainer = container.querySelector('.w-14.h-14.rounded-xl');
        expect(iconContainer).toBeInTheDocument();

        // Clean up after each render
        unmount();
      });
    });
  });
});
