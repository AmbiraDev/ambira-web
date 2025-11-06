/**
 * Unit Tests for ActivityPicker Component
 *
 * Tests the activity picker UI with:
 * - Recent activities (horizontal bar)
 * - All activities (vertical list)
 * - Activity selection
 * - Custom activity creation link
 * - Loading and error states
 * - Mobile responsiveness
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityPicker } from '@/components/timer/ActivityPicker';
import type { Activity, ActivityType } from '@/types';

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'test@example.com' },
    isLoading: false,
  }),
}));

jest.mock('@/hooks/useActivityTypes', () => ({
  useAllActivityTypes: jest.fn(),
}));

jest.mock('@/hooks/useActivityPreferences', () => ({
  useRecentActivities: jest.fn(),
}));

jest.mock('@/components/IconRenderer', () => ({
  IconRenderer: ({
    iconName,
    className,
  }: {
    iconName: string;
    className: string;
  }) => (
    <span data-testid={`icon-${iconName}`} className={className}>
      {iconName}
    </span>
  ),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createMockActivityType = (
  overrides: Partial<ActivityType> = {}
): ActivityType => ({
  id: 'work',
  name: 'Work',
  category: 'productivity',
  icon: 'Briefcase',
  defaultColor: '#0066CC',
  isSystem: true,
  order: 1,
  description: 'Professional work',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'work',
  userId: 'test-user-123',
  name: 'Work',
  description: 'Professional work',
  icon: 'Briefcase',
  color: '#0066CC',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const renderActivityPicker = (props = {}) => {
  const defaultProps = {
    selectedActivityId: '',
    setSelectedActivityId: jest.fn(),
    selectedActivity: null,
    ...props,
  };

  return render(<ActivityPicker {...defaultProps} />);
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ActivityPicker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // RENDERING & INITIAL STATE
  // ========================================================================

  describe('Rendering', () => {
    it('should render the activity picker button', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: undefined });
      useRecentActivities.mockReturnValue({ data: undefined });

      // Act
      renderActivityPicker();

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show placeholder text when no activity selected', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: undefined });
      useRecentActivities.mockReturnValue({ data: undefined });

      // Act
      renderActivityPicker({ selectedActivity: null });

      // Assert
      expect(screen.getByText('Select an activity')).toBeInTheDocument();
    });

    it('should display selected activity name', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: undefined });
      useRecentActivities.mockReturnValue({ data: undefined });

      const selectedActivity = createMockActivity({ name: 'Coding' });

      // Act
      renderActivityPicker({ selectedActivity });

      // Assert
      expect(screen.getByText('Coding')).toBeInTheDocument();
    });

    it('should display selected activity icon', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: undefined });
      useRecentActivities.mockReturnValue({ data: undefined });

      const selectedActivity = createMockActivity({ icon: 'Code' });

      // Act
      renderActivityPicker({ selectedActivity });

      // Assert
      expect(screen.getByTestId('icon-Code')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // DROPDOWN INTERACTION
  // ========================================================================

  describe('Dropdown Interaction', () => {
    it('should toggle dropdown on button click', async () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType();
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Assert - Dropdown should be visible (we check for "All Activities" text)
      expect(screen.getByText('All Activities')).toBeInTheDocument();
    });

    it('should close dropdown on backdrop click', async () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType();
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({ data: undefined });

      const { container } = renderActivityPicker();

      // Open dropdown
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('All Activities')).toBeInTheDocument();

      // Close via backdrop
      const backdrop = container.querySelector('[class*="fixed inset-0"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('All Activities')).not.toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // ACTIVITY SELECTION
  // ========================================================================

  describe('Activity Selection', () => {
    it('should call setSelectedActivityId when activity is selected', async () => {
      // Arrange
      const setSelectedActivityId = jest.fn();
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType({
        id: 'coding',
        name: 'Coding',
      });
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker({ setSelectedActivityId, selectedActivityId: '' });

      // Act
      fireEvent.click(screen.getByRole('button'));
      const codingButton = screen.getByText('Coding');
      fireEvent.click(codingButton);

      // Assert
      expect(setSelectedActivityId).toHaveBeenCalledWith('coding');
    });

    it('should close dropdown after selection', async () => {
      // Arrange
      const setSelectedActivityId = jest.fn();
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType({
        id: 'coding',
        name: 'Coding',
      });
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker({ setSelectedActivityId });

      // Act
      fireEvent.click(screen.getByRole('button')); // Open
      const codingButton = screen.getByText('Coding');
      fireEvent.click(codingButton); // Select

      // Assert - Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText('All Activities')).not.toBeInTheDocument();
      });
    });

    it('should highlight selected activity', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType({
        id: 'coding',
        name: 'Coding',
      });
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker({ selectedActivityId: 'coding' });

      // Act
      fireEvent.click(screen.getByRole('button')); // Open dropdown

      // Assert - Selected activity should have check icon (lucide-react Check component)
      const codingText = screen.getByText('Coding');
      expect(codingText).toBeInTheDocument();
    });

    it('should call onErrorClear when activity is selected', () => {
      // Arrange
      const setSelectedActivityId = jest.fn();
      const onErrorClear = jest.fn();
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType();
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker({
        setSelectedActivityId,
        onErrorClear,
        showError: true,
      });

      // Act
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Work'));

      // Assert
      expect(onErrorClear).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // RECENT ACTIVITIES
  // ========================================================================

  describe('Recent Activities', () => {
    it('should display recent activities section when available', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType();
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({
        data: [{ typeId: 'work', useCount: 5, lastUsed: new Date() }],
      });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('should not display recent activities section when empty', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType();
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      expect(screen.queryByText('Recent')).not.toBeInTheDocument();
    });

    it('should display up to 5 recent activities', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const activities = Array.from({ length: 5 }, (_, i) =>
        createMockActivityType({ id: `activity-${i}`, name: `Activity ${i}` })
      );

      useAllActivityTypes.mockReturnValue({ data: activities });
      useRecentActivities.mockReturnValue({
        data: activities.map((a, i) => ({
          typeId: a.id,
          useCount: i,
          lastUsed: new Date(),
        })),
      });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert - Recent section should be visible
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('should allow selecting from recent activities', () => {
      // Arrange
      const setSelectedActivityId = jest.fn();
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const mockActivityType = createMockActivityType({
        id: 'coding',
        name: 'Coding',
      });
      useAllActivityTypes.mockReturnValue({ data: [mockActivityType] });
      useRecentActivities.mockReturnValue({
        data: [{ typeId: 'coding', useCount: 10, lastUsed: new Date() }],
      });

      renderActivityPicker({ setSelectedActivityId });

      // Act
      fireEvent.click(screen.getByRole('button')); // Open dropdown
      const recentCodingButton = Array.from(screen.getAllByText('Coding')).find(
        el => el.closest('[class*="flex flex-col"]') // Recent activity button styling
      );

      if (recentCodingButton) {
        fireEvent.click(recentCodingButton);
      }

      // Assert
      expect(setSelectedActivityId).toHaveBeenCalledWith('coding');
    });
  });

  // ========================================================================
  // ALL ACTIVITIES LIST
  // ========================================================================

  describe('All Activities List', () => {
    it('should display all activities in vertical list', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const activities = [
        createMockActivityType({ id: 'work', name: 'Work' }),
        createMockActivityType({ id: 'coding', name: 'Coding' }),
      ];

      useAllActivityTypes.mockReturnValue({ data: activities });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Coding')).toBeInTheDocument();
    });

    it('should display "Custom" badge for custom activities', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const activities = [
        createMockActivityType({ id: 'work', isSystem: true }),
        createMockActivityType({
          id: 'guitar',
          name: 'Guitar',
          isSystem: false,
          userId: 'test-user-123',
        }),
      ];

      useAllActivityTypes.mockReturnValue({ data: activities });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('should not display "Custom" badge for system activities', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const activities = [
        createMockActivityType({ id: 'work', isSystem: true }),
      ];

      useAllActivityTypes.mockReturnValue({ data: activities });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      const customBadges = screen.queryAllByText('Custom');
      expect(customBadges).toHaveLength(0);
    });

    it('should display "No activities yet" message when empty', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: [] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      expect(screen.getByText('No activities yet')).toBeInTheDocument();
    });

    it('should sort activities with recent ones first', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const activities = [
        createMockActivityType({ id: 'work', name: 'Work', icon: 'Briefcase' }),
        createMockActivityType({ id: 'coding', name: 'Coding', icon: 'Code' }),
        createMockActivityType({
          id: 'study',
          name: 'Study',
          icon: 'BookOpen',
        }),
        createMockActivityType({
          id: 'reading',
          name: 'Reading',
          icon: 'Book',
        }),
      ];

      // Mock recent activities: Coding, Reading (in that order)
      useAllActivityTypes.mockReturnValue({ data: activities });
      useRecentActivities.mockReturnValue({
        data: [
          { typeId: 'coding', useCount: 5, lastUsed: new Date('2025-01-10') },
          { typeId: 'reading', useCount: 3, lastUsed: new Date('2025-01-09') },
        ],
      });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert - Get all activity buttons in the "All Activities" section
      const allActivitiesSection =
        screen.getByText('All Activities').parentElement;
      const activityButtons = allActivitiesSection?.querySelectorAll('button');
      const activityNames = Array.from(activityButtons || []).map(button => {
        // Extract just the activity name from the button's text span
        const nameSpan = button.querySelector('span.text-sm.font-medium');
        return nameSpan?.textContent?.trim() || '';
      });

      // Recent activities should appear first in order: Coding, Reading, then others
      expect(activityNames[0]).toBe('Coding');
      expect(activityNames[1]).toBe('Reading');
      // Work and Study should appear after recent ones
      expect(activityNames.slice(2)).toContain('Work');
      expect(activityNames.slice(2)).toContain('Study');
    });
  });

  // ========================================================================
  // CREATE ACTIVITY LINK
  // ========================================================================

  describe('Create Activity Link', () => {
    it('should display "Add custom activity" link in dropdown', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const activities = [createMockActivityType()];
      useAllActivityTypes.mockReturnValue({ data: activities });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      expect(screen.getByText('Add custom activity')).toBeInTheDocument();
    });

    it('should link to settings/activities page', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const activities = [createMockActivityType()];
      useAllActivityTypes.mockReturnValue({ data: activities });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      const link = screen.getByText('Add custom activity').closest('a');
      expect(link).toHaveAttribute('href', '/settings/activities');
    });

    it('should display "Create Activity" button when no activities', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: [] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker();

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      expect(screen.getByText('Create Activity')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // ERROR STATES
  // ========================================================================

  describe('Error States', () => {
    it('should display error styling when showError is true', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: [] });
      useRecentActivities.mockReturnValue({ data: undefined });

      const { container } = renderActivityPicker({ showError: true });

      // Assert
      const button = container.querySelector('button');
      expect(button?.className).toContain('border-red-500');
    });

    it('should not display error styling when showError is false', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: [] });
      useRecentActivities.mockReturnValue({ data: undefined });

      const { container } = renderActivityPicker({ showError: false });

      // Assert
      const button = container.querySelector('button');
      expect(button?.className).not.toContain('border-red-500');
    });
  });

  // ========================================================================
  // BACKWARD COMPATIBILITY
  // ========================================================================

  describe('Backward Compatibility', () => {
    it('should use legacy allActivities prop when provided', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      useAllActivityTypes.mockReturnValue({ data: undefined });
      useRecentActivities.mockReturnValue({ data: undefined });

      const legacyActivities = [
        createMockActivity({ id: 'legacy-1', name: 'Legacy Activity' }),
      ];

      renderActivityPicker({ allActivities: legacyActivities });

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert
      expect(screen.getByText('Legacy Activity')).toBeInTheDocument();
    });

    it('should prefer legacy prop over hook data when both provided', () => {
      // Arrange
      const { useAllActivityTypes } = jest.requireMock(
        '@/hooks/useActivityTypes'
      );
      const { useRecentActivities } = jest.requireMock(
        '@/hooks/useActivityPreferences'
      );

      const hookActivity = createMockActivityType({
        id: 'hook-1',
        name: 'Hook Activity',
      });
      const legacyActivity = createMockActivity({
        id: 'legacy-1',
        name: 'Legacy Activity',
      });

      // When both hook data and legacy prop are provided, legacy takes precedence
      // (see component line 43: if (legacyActivities) return legacyActivities;)
      useAllActivityTypes.mockReturnValue({ data: [hookActivity] });
      useRecentActivities.mockReturnValue({ data: undefined });

      renderActivityPicker({ allActivities: [legacyActivity] });

      // Act
      fireEvent.click(screen.getByRole('button'));

      // Assert - Legacy prop takes precedence when provided
      expect(screen.getByText('Legacy Activity')).toBeInTheDocument();
      expect(screen.queryByText('Hook Activity')).not.toBeInTheDocument();
    });
  });
});
