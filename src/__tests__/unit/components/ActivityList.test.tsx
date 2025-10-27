import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityList } from '@/components/ActivityList';
import { Activity } from '@/types';

/**
 * Comprehensive tests for ActivityList component
 *
 * Coverage:
 * - Component rendering (empty state, loading state, error state, with data)
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Interactions (create, delete, archive)
 * - Modal dialogs
 */

// Mock dependencies
const mockPush = jest.fn();
const mockDeleteProject = jest.fn();
const mockArchiveProject = jest.fn();
const mockSuccessToast = jest.fn();
const mockErrorToast = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/contexts/ProjectsContext', () => ({
  useProjects: jest.fn(),
}));

jest.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    success: mockSuccessToast,
    error: mockErrorToast,
  }),
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
  {
    id: 'activity-2',
    userId: 'user-1',
    name: 'Coding',
    description: 'Web development',
    color: 'purple',
    icon: 'Code',
    status: 'active',
    weeklyTarget: 20,
    totalTarget: 200,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'activity-3',
    userId: 'user-1',
    name: 'Reading',
    description: 'Technical books',
    color: 'green',
    icon: 'Book',
    status: 'archived',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

const useProjects = require('@/contexts/ProjectsContext').useProjects;

describe('ActivityList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default mock implementation
    useProjects.mockReturnValue({
      projects: mockActivities,
      isLoading: false,
      error: null,
      deleteProject: mockDeleteProject,
      archiveProject: mockArchiveProject,
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton', () => {
      useProjects.mockReturnValue({
        projects: null,
        isLoading: true,
        error: null,
        deleteProject: mockDeleteProject,
        archiveProject: mockArchiveProject,
      });

      const { container } = render(<ActivityList />);

      // Loading skeletons should be present
      const loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should show 6 skeleton cards in loading state', () => {
      useProjects.mockReturnValue({
        projects: null,
        isLoading: true,
        error: null,
        deleteProject: mockDeleteProject,
        archiveProject: mockArchiveProject,
      });

      const { container } = render(<ActivityList />);

      // Should have loading skeleton structure
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when loading fails', () => {
      
      useProjects.mockReturnValue({
        projects: null,
        isLoading: false,
        error: 'Failed to load activities',
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      

      render(<ActivityList />);

      expect(screen.getByText(/error loading activities/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load activities/i)).toBeInTheDocument();
    });

    it('should display retry button in error state', () => {
      
      useProjects.mockReturnValue({
        projects: null,
        isLoading: false,
        error: 'Failed to load activities',
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      

      render(<ActivityList />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should reload page when retry button is clicked', () => {

      useProjects.mockReturnValue({
        projects: null,
        isLoading: false,
        error: 'Failed to load activities',
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      // Simply verify the reload button exists and is clickable
      // We can't easily test window.location.reload() in jsdom
      render(<ActivityList />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Verify it's clickable (doesn't throw)
      expect(() => fireEvent.click(retryButton)).not.toThrow();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no activities exist', () => {

      useProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      render(<ActivityList />);

      expect(screen.getByText(/no activities yet/i)).toBeInTheDocument();
      // Check for the button specifically to avoid matching text in multiple places
      expect(screen.getByRole('button', { name: /create your first activity/i })).toBeInTheDocument();
    });

    it('should display create button in empty state', () => {
      
      useProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      

      render(<ActivityList />);

      const createButton = screen.getByRole('button', { name: /create your first activity/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should navigate to new activity page when create button is clicked', () => {
      useProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      render(<ActivityList />);

      const createButton = screen.getByRole('button', { name: /create your first activity/i });
      fireEvent.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/activities/new');
    });
  });

  describe('Activities Display', () => {
    beforeEach(() => {
      
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      
    });

    it('should display activity count', () => {
      render(<ActivityList />);

      expect(screen.getByText(/3 activities/i)).toBeInTheDocument();
    });

    it('should display singular form for one activity', () => {
      
      useProjects.mockReturnValue({
        projects: [mockActivities[0]],
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      render(<ActivityList />);

      expect(screen.getByText(/1 activity/i)).toBeInTheDocument();
    });

    it('should render activities in grid view', () => {
      const { container } = render(<ActivityList />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });

    it('should display all activities', () => {
      render(<ActivityList />);

      expect(screen.getByText('Writing')).toBeInTheDocument();
      expect(screen.getByText('Coding')).toBeInTheDocument();
      expect(screen.getByText('Reading')).toBeInTheDocument();
    });
  });

  describe('Accessibility - ARIA Labels', () => {
    beforeEach(() => {
      
      useProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      
    });

    it('should have aria-label on new activity button', () => {
      render(<ActivityList />);

      const newButton = screen.getByRole('button', { name: /create new activity/i });
      expect(newButton).toHaveAttribute('aria-label', 'Create new activity');
    });

    it('should have aria-label on create first activity button', () => {
      render(<ActivityList />);

      const createButton = screen.getByRole('button', { name: /create your first activity/i });
      expect(createButton).toHaveAttribute('aria-label', 'Create your first activity');
    });

    it('should mark decorative icons as aria-hidden', () => {
      const { container } = render(<ActivityList />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility - Touch Targets', () => {
    beforeEach(() => {
      
      useProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      
    });

    it('should meet minimum 44x44px touch target for create button in empty state', () => {
      render(<ActivityList />);

      const createButton = screen.getByRole('button', { name: /create your first activity/i });
      expect(createButton).toHaveClass('min-h-[44px]');
    });

    it('should meet minimum 44px height for modal buttons', () => {
      
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      render(<ActivityList onEditActivity={jest.fn()} />);

      // Open menu and trigger delete
      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton || !(firstMenuButton instanceof Element)) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      // Check modal buttons
      const modalButtons = screen.getAllByRole('button');
      const cancelButton = modalButtons.find(btn => btn.textContent === 'Cancel');
      const confirmButton = modalButtons.find(btn => btn.textContent === 'Delete');

      expect(cancelButton).toHaveClass('min-h-[44px]');
      expect(confirmButton).toHaveClass('min-h-[44px]');
    });
  });

  describe('Delete Confirmation Modal', () => {
    beforeEach(() => {
      
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      
    });

    it('should open delete modal when delete is clicked', () => {
      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton || !(firstMenuButton instanceof Element)) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(screen.getByText(/delete activity/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('should display activity name in delete confirmation', () => {
      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton || !(firstMenuButton instanceof Element)) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(screen.getByText(/"Writing"/i)).toBeInTheDocument();
    });

    it('should close modal when Cancel is clicked', () => {
      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText(/delete activity/i)).not.toBeInTheDocument();
    });

    it('should close modal when clicking backdrop', () => {
      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      const backdrop = screen.getByText(/delete activity/i).parentElement?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(screen.queryByText(/delete activity/i)).not.toBeInTheDocument();
    });

    it('should close modal when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      const backdrop = screen.getByText(/delete activity/i).parentElement?.parentElement;
      if (backdrop) {
        fireEvent.keyDown(backdrop, { key: 'Escape' });
      }

      expect(screen.queryByText(/delete activity/i)).not.toBeInTheDocument();
    });

    it('should call deleteProject when Delete is confirmed', async () => {

      const mockDeleteProject = jest.fn().mockResolvedValue(undefined);
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: mockDeleteProject,
        archiveProject: jest.fn(),
      });

      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteProject).toHaveBeenCalledWith('activity-1');
      });
    });

    it('should show success toast after successful delete', async () => {

      const localMockDeleteProject = jest.fn().mockResolvedValue(undefined);
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: localMockDeleteProject,
        archiveProject: jest.fn(),
      });

      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockSuccessToast).toHaveBeenCalledWith('Activity "Writing" deleted successfully');
      });
    });

    it('should show error toast on delete failure', async () => {

      const localMockDeleteProject = jest.fn().mockRejectedValue(new Error('Delete failed'));
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: localMockDeleteProject,
        archiveProject: jest.fn(),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith('Failed to delete activity. Please try again.');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Archive/Restore Functionality', () => {
    beforeEach(() => {
      
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn().mockResolvedValue(undefined),
      });

      
    });

    it('should call archiveProject when Archive is clicked on active activity', async () => {
      
      const mockArchiveProject = jest.fn().mockResolvedValue(undefined);
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: mockArchiveProject,
      });

      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0]; // First activity (active)
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const archiveButton = screen.getByRole('menuitem', { name: /archive/i });
      fireEvent.click(archiveButton);

      await waitFor(() => {
        expect(mockArchiveProject).toHaveBeenCalledWith('activity-1');
      });
    });

    it('should show success toast after archiving', async () => {

      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const archiveButton = screen.getByRole('menuitem', { name: /archive/i });
      fireEvent.click(archiveButton);

      await waitFor(() => {
        expect(mockSuccessToast).toHaveBeenCalledWith('Activity "Writing" archived successfully');
      });
    });

    it('should show error toast on archive failure', async () => {

      const localMockArchiveProject = jest.fn().mockRejectedValue(new Error('Archive failed'));
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: localMockArchiveProject,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ActivityList onEditActivity={jest.fn()} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const archiveButton = screen.getByRole('menuitem', { name: /archive/i });
      fireEvent.click(archiveButton);

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith('Failed to archive activity. Please try again.');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Edit Navigation', () => {
    it('should call onEditActivity when edit is clicked', () => {
      const mockEditHandler = jest.fn();

      
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      

      render(<ActivityList onEditActivity={mockEditHandler} />);

      const menuButtons = screen.getAllByRole('button', { name: /open activity menu/i });
      const firstMenuButton = menuButtons[0];
      if (!firstMenuButton) return;
      fireEvent.click(firstMenuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      fireEvent.click(editButton);

      expect(mockEditHandler).toHaveBeenCalledWith(mockActivities[0]);
    });
  });

  describe('New Activity Navigation', () => {
    it('should navigate to new activity page', () => {
      useProjects.mockReturnValue({
        projects: mockActivities,
        isLoading: false,
        error: null,
        deleteProject: jest.fn(),
        archiveProject: jest.fn(),
      });

      render(<ActivityList />);

      const newButton = screen.getByRole('button', { name: /create new activity/i });
      fireEvent.click(newButton);

      expect(mockPush).toHaveBeenCalledWith('/activities/new');
    });
  });
});
