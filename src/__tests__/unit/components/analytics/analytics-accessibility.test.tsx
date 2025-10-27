import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the contexts and hooks
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', username: 'testuser' },
    isLoading: false,
  }),
}));

jest.mock('@/contexts/ProjectsContext', () => ({
  useProjects: () => ({
    projects: [
      { id: 'project-1', name: 'Test Project 1', icon: 'code', color: '#007AFF' },
      { id: 'project-2', name: 'Test Project 2', icon: 'book', color: '#34C759' },
    ],
  }),
}));

jest.mock('@/features/sessions/hooks', () => ({
  useUserSessions: () => ({
    data: [],
    isLoading: false,
  }),
}));

jest.mock('@/features/profile/hooks', () => ({
  useProfileStats: () => ({
    data: { currentStreak: 5, longestStreak: 10 },
    isLoading: false,
  }),
}));

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  ComposedChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
}));

// Mock other components
jest.mock('@/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/MobileHeader', () => ({
  default: () => <div>Mobile Header</div>,
}));

jest.mock('@/components/BottomNavigation', () => ({
  default: () => <div>Bottom Navigation</div>,
}));

jest.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

jest.mock('@/components/HeaderComponent', () => ({
  default: () => <div>Header</div>,
}));

jest.mock('@/components/IconRenderer', () => ({
  IconRenderer: () => <span>Icon</span>,
}));

jest.mock('lucide-react', () => ({
  ChevronDown: () => <span>ChevronDown</span>,
}));

// Import the component after all mocks are set up
import AnalyticsPage from '@/app/analytics/page';

describe('Analytics Page - Accessibility ARIA Labels', () => {
  beforeEach(() => {
    // Clear any previous renders
    jest.clearAllMocks();
  });

  describe('Activity Selector Dropdown', () => {
    it('should have proper aria-label on activity selector button', () => {
      render(<AnalyticsPage />);
      const activityButton = screen.getByLabelText('Select activity to filter analytics');
      expect(activityButton).toBeInTheDocument();
    });

    it('should have aria-expanded attribute on activity selector button', () => {
      render(<AnalyticsPage />);
      const activityButton = screen.getByLabelText('Select activity to filter analytics');
      expect(activityButton).toHaveAttribute('aria-expanded');
    });

    it('should have aria-haspopup listbox on activity selector button', () => {
      render(<AnalyticsPage />);
      const activityButton = screen.getByLabelText('Select activity to filter analytics');
      expect(activityButton).toHaveAttribute('aria-haspopup', 'listbox');
    });
  });

  describe('Chart Type Selector Dropdown', () => {
    it('should have proper aria-label on chart type selector button', () => {
      render(<AnalyticsPage />);
      const chartTypeButton = screen.getByLabelText('Select chart type for analytics visualization');
      expect(chartTypeButton).toBeInTheDocument();
    });

    it('should have aria-expanded attribute on chart type selector button', () => {
      render(<AnalyticsPage />);
      const chartTypeButton = screen.getByLabelText('Select chart type for analytics visualization');
      expect(chartTypeButton).toHaveAttribute('aria-expanded');
    });

    it('should have aria-haspopup listbox on chart type selector button', () => {
      render(<AnalyticsPage />);
      const chartTypeButton = screen.getByLabelText('Select chart type for analytics visualization');
      expect(chartTypeButton).toHaveAttribute('aria-haspopup', 'listbox');
    });
  });

  describe('Time Period Selection Buttons', () => {
    it('should have descriptive aria-labels for all time period buttons', () => {
      render(<AnalyticsPage />);

      expect(screen.getByLabelText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByLabelText('Last 2 weeks')).toBeInTheDocument();
      expect(screen.getByLabelText('Last 4 weeks')).toBeInTheDocument();
      expect(screen.getByLabelText('Last 3 months')).toBeInTheDocument();
      expect(screen.getByLabelText('Last 1 year')).toBeInTheDocument();
    });

    it('should have aria-pressed attribute on time period buttons', () => {
      render(<AnalyticsPage />);
      const sevenDaysButton = screen.getByLabelText('Last 7 days');
      expect(sevenDaysButton).toHaveAttribute('aria-pressed');
    });

    it('should have role="group" on time period container', () => {
      const { container } = render(<AnalyticsPage />);
      const groupElement = container.querySelector('[role="group"][aria-label="Time period selection"]');
      expect(groupElement).toBeInTheDocument();
    });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have unique and descriptive labels for all interactive elements', () => {
      render(<AnalyticsPage />);

      // Verify all critical buttons have accessible names
      const activitySelector = screen.getByLabelText('Select activity to filter analytics');
      const chartTypeSelector = screen.getByLabelText('Select chart type for analytics visualization');
      const timePeriodButtons = [
        screen.getByLabelText('Last 7 days'),
        screen.getByLabelText('Last 2 weeks'),
        screen.getByLabelText('Last 4 weeks'),
        screen.getByLabelText('Last 3 months'),
        screen.getByLabelText('Last 1 year'),
      ];

      expect(activitySelector).toBeInTheDocument();
      expect(chartTypeSelector).toBeInTheDocument();
      timePeriodButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should provide appropriate ARIA attributes for dropdown menus', () => {
      render(<AnalyticsPage />);

      // Check that dropdown triggers have proper ARIA attributes
      const dropdownButtons = [
        screen.getByLabelText('Select activity to filter analytics'),
        screen.getByLabelText('Select chart type for analytics visualization'),
      ];

      dropdownButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded');
        expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      });
    });
  });
});
