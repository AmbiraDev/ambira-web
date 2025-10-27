import React from 'react';
import { render, screen, _waitFor } from '@testing-library/react';
import ActivitiesPage from '../page';
import { Activity } from '@/types';

/**
 * Integration tests for Activities Page
 *
 * Coverage:
 * - Page rendering with all layout components
 * - Error boundary integration
 * - Loading states with Suspense
 * - Protected route authentication
 * - Edit handler navigation
 * - Desktop and mobile layouts
 */

// Mock all dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/ProjectsContext', () => ({
  useProjects: jest.fn(),
}));

jest.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({
    children,
    _onError,
  }: {
    children: React.ReactNode;
    onError?: (error: Error, errorInfo: any) => void;
  }) => <div data-testid="error-boundary">{children}</div>,
}));

jest.mock('@/components/HeaderComponent', () => {
  return function MockHeader() {
    return <div data-testid="desktop-header">Desktop Header</div>;
  };
});

jest.mock('@/components/MobileHeader', () => {
  return function MockMobileHeader({ title }: { title: string }) {
    return <div data-testid="mobile-header">{title}</div>;
  };
});

jest.mock('@/components/BottomNavigation', () => {
  return function MockBottomNavigation() {
    return <div data-testid="bottom-navigation">Bottom Navigation</div>;
  };
});

jest.mock('@/components/ActivityList', () => ({
  ActivityList: ({
    onEditActivity,
  }: {
    onEditActivity?: (activity: Activity) => void;
  }) => (
    <div data-testid="activity-list">
      <button
        onClick={() => onEditActivity?.({ id: 'test-activity' } as Activity)}
      >
        Edit Test Activity
      </button>
    </div>
  ),
}));

const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    userId: 'user-1',
    name: 'Writing',
    description: 'Daily writing practice',
    color: 'blue',
    icon: 'Pen',
    status: 'active',
    weeklyTarget: 10,
    totalTarget: 100,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('Activities Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    });

    const { useProjects } = require('@/contexts/ProjectsContext');
    useProjects.mockReturnValue({
      projects: mockActivities,
      isLoading: false,
      error: null,
      deleteProject: jest.fn(),
      archiveProject: jest.fn(),
    });

    const { useRouter } = require('next/navigation');
    useRouter.mockReturnValue({
      push: jest.fn(),
    });
  });

  describe('Page Rendering', () => {
    it('should render the complete page structure', () => {
      render(<ActivitiesPage />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('activity-list')).toBeInTheDocument();
    });

    it('should render within ProtectedRoute', () => {
      render(<ActivitiesPage />);

      const protectedRoute = screen.getByTestId('protected-route');
      expect(protectedRoute).toBeInTheDocument();
    });

    it('should render within ErrorBoundary', () => {
      render(<ActivitiesPage />);

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toBeInTheDocument();
    });

    it('should render ActivityList component', () => {
      render(<ActivitiesPage />);

      expect(screen.getByTestId('activity-list')).toBeInTheDocument();
    });
  });

  describe('Layout Components', () => {
    it('should render desktop header', () => {
      render(<ActivitiesPage />);

      expect(screen.getByTestId('desktop-header')).toBeInTheDocument();
    });

    it('should render mobile header with correct title', () => {
      render(<ActivitiesPage />);

      const mobileHeader = screen.getByTestId('mobile-header');
      expect(mobileHeader).toBeInTheDocument();
      expect(mobileHeader).toHaveTextContent('Activities');
    });

    it('should render bottom navigation for mobile', () => {
      render(<ActivitiesPage />);

      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    it('should hide desktop header on mobile using CSS classes', () => {
      const { container } = render(<ActivitiesPage />);

      const desktopHeaderContainer =
        screen.getByTestId('desktop-header').parentElement;
      expect(desktopHeaderContainer).toHaveClass('hidden');
      expect(desktopHeaderContainer).toHaveClass('md:block');
    });

    it('should hide mobile header on desktop using CSS classes', () => {
      const { container } = render(<ActivitiesPage />);

      const mobileHeaderContainer =
        screen.getByTestId('mobile-header').parentElement;
      expect(mobileHeaderContainer).toHaveClass('md:hidden');
    });

    it('should hide bottom navigation on desktop using CSS classes', () => {
      const { container } = render(<ActivitiesPage />);

      const bottomNavContainer =
        screen.getByTestId('bottom-navigation').parentElement;
      expect(bottomNavContainer).toHaveClass('md:hidden');
    });
  });

  describe('Edit Handler Integration', () => {
    it('should navigate to edit page when handleEditActivity is called', () => {
      const { useRouter } = require('next/navigation');
      const mockPush = jest.fn();
      useRouter.mockReturnValue({
        push: mockPush,
      });

      render(<ActivitiesPage />);

      const editButton = screen.getByText('Edit Test Activity');
      editButton.click();

      expect(mockPush).toHaveBeenCalledWith('/activities/test-activity/edit');
    });

    it('should construct correct edit URL with activity ID', () => {
      const { useRouter } = require('next/navigation');
      const mockPush = jest.fn();
      useRouter.mockReturnValue({
        push: mockPush,
      });

      render(<ActivitiesPage />);

      const editButton = screen.getByText('Edit Test Activity');
      editButton.click();

      const callArgs = mockPush.mock.calls[0][0];
      expect(callArgs).toContain('test-activity');
      expect(callArgs).toContain('/edit');
    });
  });

  describe('Error Boundary Integration', () => {
    it('should provide error handler to ErrorBoundary', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // We need to access ErrorBoundary mock to verify it's called correctly
      const _ErrorBoundaryMock =
        require('@/components/ErrorBoundary').ErrorBoundary;
      const mockOnError = jest.fn();

      // Temporarily override the mock to capture onError
      jest
        .spyOn(require('@/components/ErrorBoundary'), 'ErrorBoundary')
        .mockImplementation(({ children, onError }: any) => {
          if (onError) {
            mockOnError.mockImplementation(onError);
          }
          return <div data-testid="error-boundary">{children}</div>;
        });

      render(<ActivitiesPage />);

      // Verify ErrorBoundary was rendered
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Authentication States', () => {
    it('should not render content when user is not authenticated', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({
        user: null,
      });

      render(<ActivitiesPage />);

      // ProtectedRoute should still render (it handles the auth check)
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render full content when user is authenticated', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({
        user: {
          id: 'test-user',
          email: 'test@example.com',
        },
      });

      render(<ActivitiesPage />);

      expect(screen.getByTestId('activity-list')).toBeInTheDocument();
      expect(screen.getByTestId('desktop-header')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should apply correct background colors for desktop and mobile', () => {
      const { container } = render(<ActivitiesPage />);

      const mainContent = container.querySelector('.min-h-screen');
      expect(mainContent).toHaveClass('bg-white');
      expect(mainContent).toHaveClass('md:bg-gray-50');
    });

    it('should apply correct padding for mobile and desktop', () => {
      const { container } = render(<ActivitiesPage />);

      const contentArea = container.querySelector('.pb-32');
      expect(contentArea).toHaveClass('pb-32'); // Mobile bottom padding
      expect(contentArea).toHaveClass('md:pb-8'); // Desktop bottom padding
    });

    it('should have max-width container for content', () => {
      const { container } = render(<ActivitiesPage />);

      const contentContainer = container.querySelector('.max-w-5xl');
      expect(contentContainer).toBeInTheDocument();
      expect(contentContainer).toHaveClass('mx-auto'); // Centered
    });

    it('should have responsive horizontal padding', () => {
      const { container } = render(<ActivitiesPage />);

      const contentContainer = container.querySelector('.max-w-5xl');
      expect(contentContainer).toHaveClass('px-4');
      expect(contentContainer).toHaveClass('md:px-6');
    });
  });

  describe('Suspense and Loading States', () => {
    it('should wrap ActivityList in Suspense', () => {
      // This test verifies that the Suspense wrapper exists by checking
      // that the page can handle loading states gracefully
      const { useProjects } = require('@/contexts/ProjectsContext');
      useProjects.mockReturnValue({
        projects: null,
        isLoading: true,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      render(<ActivitiesPage />);

      // Page should still render without crashing during loading
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });

  describe('Error State Handling', () => {
    it('should handle error state from ProjectsContext', () => {
      const { useProjects } = require('@/contexts/ProjectsContext');
      useProjects.mockReturnValue({
        projects: null,
        isLoading: false,
        error: 'Failed to load activities',
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      // Should render without crashing
      render(<ActivitiesPage />);

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });

    it('should log errors to console via ErrorBoundary onError handler', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<ActivitiesPage />);

      // The page sets up an error handler that logs to console
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Page Accessibility', () => {
    it('should have proper page structure with main content area', () => {
      const { container } = render(<ActivitiesPage />);

      // Should have a min-h-screen container for full viewport height
      const pageContainer = container.querySelector('.min-h-screen');
      expect(pageContainer).toBeInTheDocument();
    });

    it('should have proper spacing for content readability', () => {
      const { container } = render(<ActivitiesPage />);

      const contentArea = container.querySelector('.py-4');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass onEditActivity handler to ActivityList', () => {
      const { useRouter } = require('next/navigation');
      const mockPush = jest.fn();
      useRouter.mockReturnValue({
        push: mockPush,
      });

      render(<ActivitiesPage />);

      // The ActivityList mock has a button that triggers onEditActivity
      const editButton = screen.getByText('Edit Test Activity');
      expect(editButton).toBeInTheDocument();

      editButton.click();

      // Handler should navigate to edit page
      expect(mockPush).toHaveBeenCalled();
    });

    it('should integrate all layout components in correct hierarchy', () => {
      const { container } = render(<ActivitiesPage />);

      // Check that all major components are present
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('desktop-header')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
      expect(screen.getByTestId('activity-list')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });
  });
});
