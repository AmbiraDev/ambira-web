// Mock Firebase before any imports
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id', getIdToken: jest.fn().mockResolvedValue('test-token') },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: 'test-user-id' });
      return jest.fn(); // unsubscribe
    })
  },
  db: {},
  storage: {}
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced';
import { useTimer } from '@/features/timer/hooks';
import { useActivities } from '@/hooks/useActivitiesQuery';

// Mock dependencies
jest.mock('@/features/timer/hooks');
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true,
  }),
}));
jest.mock('@/hooks/useActivitiesQuery');
jest.mock('@/lib/imageUpload');
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock window.location with a writable href property
delete (window as any).location;
let mockHref = 'http://localhost/';
(window as any).location = {
  get href() {
    return mockHref;
  },
  set href(value: string) {
    mockHref = value;
  },
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  description: 'Test project description',
  color: 'blue',
  icon: 'Folder',
  userId: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockTask = {
  id: 'task-1',
  name: 'Test Task',
  projectId: 'project-1',
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockSession = {
  id: 'session-1',
  userId: 'test-user-id',
  projectId: 'project-1',
  activityId: 'project-1',
  title: 'Test Session',
  description: 'Test description',
  duration: 3600,
  startTime: new Date(),
  tasks: [mockTask],
  visibility: 'private' as const,
  showStartTime: false,
  hideTaskNames: false,
  publishToFeeds: true,
  isArchived: false,
  supportCount: 0,
  commentCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('SessionTimerEnhanced - Complete and Cancel', () => {
  let mockResetTimer: jest.Mock;
  let mockFinishTimer: jest.Mock;
  let mockStartTimer: jest.Mock;
  let mockPauseTimer: jest.Mock;
  let mockResumeTimer: jest.Mock;
  let mockUpdateSelectedTasks: jest.Mock;
  let mockGetElapsedTime: jest.Mock;
  let mockGetFormattedTime: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset window.location href to initial state
    (window as any).location.href = 'http://localhost/';

    // Create mock functions
    mockResetTimer = jest.fn().mockResolvedValue(undefined);
    mockFinishTimer = jest.fn().mockResolvedValue(mockSession);
    mockStartTimer = jest.fn().mockResolvedValue(undefined);
    mockPauseTimer = jest.fn().mockResolvedValue(undefined);
    mockResumeTimer = jest.fn().mockResolvedValue(undefined);
    mockUpdateSelectedTasks = jest.fn().mockResolvedValue(undefined);
    mockGetElapsedTime = jest.fn().mockReturnValue(3600); // 1 hour
    mockGetFormattedTime = jest.fn().mockImplementation((seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    });

    // Mock timer context with paused timer (ready to complete)
    (useTimer as jest.Mock).mockReturnValue({
      timerState: {
        isRunning: false,
        startTime: new Date(),
        pausedDuration: 3600,
        currentProject: mockProject,
        selectedTasks: [mockTask],
        activeTimerId: 'timer-1',
        isConnected: true,
        lastAutoSave: null
      },
      resetTimer: mockResetTimer,
      finishTimer: mockFinishTimer,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resumeTimer: mockResumeTimer,
      updateSelectedTasks: mockUpdateSelectedTasks,
      getElapsedTime: mockGetElapsedTime,
      getFormattedTime: mockGetFormattedTime
    });

    (useActivities as jest.Mock).mockReturnValue({
      data: [mockProject],
      isLoading: false,
      error: null,
    });

    // Mock alert and console
    global.alert = jest.fn();
    global.console.error = jest.fn();
    global.console.log = jest.fn();
  });

  describe('Complete Session', () => {
    it('should show finish modal when finish button is clicked', async () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Verify modal is shown
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });
    });

    it('should successfully complete session with all details', async () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button to open modal
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      // Fill in session details
      const titleInput = screen.getByPlaceholderText(/enter session title/i);
      const descriptionInput = screen.getByPlaceholderText(/how did the session go/i);
      const privateNotesInput = screen.getByPlaceholderText(/personal reflections/i);

      fireEvent.change(titleInput, { target: { value: 'Morning Work Session' } });
      fireEvent.change(descriptionInput, { target: { value: 'Completed important tasks' } });
      fireEvent.change(privateNotesInput, { target: { value: 'Felt productive' } });

      // Click save button
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // Verify finishTimer was called with correct parameters
      await waitFor(() => {
        expect(mockFinishTimer).toHaveBeenCalledWith(
          'Morning Work Session',
          'Completed important tasks',
          [], // tags
          3, // howFelt default
          'Felt productive',
          expect.objectContaining({
            visibility: 'everyone',
            showStartTime: false,
            hideTaskNames: false,
            publishToFeeds: true
          })
        );
      });

      // Verify modal closes after successful save
      await waitFor(() => {
        expect(screen.queryByText('Complete Session')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should not complete session if title is empty', async () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      // Clear the auto-generated title
      const titleInput = screen.getByPlaceholderText(/enter session title/i);
      fireEvent.change(titleInput, { target: { value: '' } });

      // Verify save button is disabled when title is empty
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();

      // Verify finishTimer was NOT called
      expect(mockFinishTimer).not.toHaveBeenCalled();
    });

    it('should handle finish timer errors gracefully', async () => {
      const errorMessage = 'Failed to create session';
      mockFinishTimer.mockRejectedValueOnce(new Error(errorMessage));

      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal and fill in required fields
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText(/enter session title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Session' } });

      // Click save button
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // Verify error alert was shown
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(errorMessage);
      });

      // Verify navigation did NOT happen (should still be on localhost)
      expect(window.location.href).toBe('http://localhost/');
    });

    it('should allow changing visibility settings', async () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      // Fill in title
      const titleInput = screen.getByPlaceholderText(/enter session title/i);
      fireEvent.change(titleInput, { target: { value: 'Private Session' } });

      // Change visibility to private
      const visibilitySelect = screen.getByDisplayValue('Everyone');
      fireEvent.change(visibilitySelect, { target: { value: 'private' } });

      // Click save button
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // Verify finishTimer was called with private visibility
      await waitFor(() => {
        expect(mockFinishTimer).toHaveBeenCalledWith(
          'Private Session',
          '',
          [],
          3,
          '',
          expect.objectContaining({
            visibility: 'private'
          })
        );
      });
    });

    it('should close modal when close button is clicked', async () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByText('Complete Session')).not.toBeInTheDocument();
      });

      // Verify finishTimer was NOT called
      expect(mockFinishTimer).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Session', () => {
    it('should show cancel confirmation modal when cancel button is clicked', async () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button to open completion modal
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      const cancelButton = cancelButtons.find(btn => btn.textContent === 'Cancel');
      fireEvent.click(cancelButton!);

      // Verify confirmation modal is shown
      await waitFor(() => {
        expect(screen.getByText('Cancel Session?')).toBeInTheDocument();
      });
    });

    it('should successfully cancel session when confirmed', async () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      const cancelButton = cancelButtons.find(btn => btn.textContent === 'Cancel');
      fireEvent.click(cancelButton!);

      // Wait for confirmation modal
      await waitFor(() => {
        expect(screen.getByText('Cancel Session?')).toBeInTheDocument();
      });

      // Click confirm cancel button (the red one)
      const confirmButtons = screen.getAllByRole('button', { name: /cancel/i });
      const confirmButton = confirmButtons.find(btn =>
        btn.className.includes('bg-red')
      );
      fireEvent.click(confirmButton!);

      // Verify resetTimer was called
      await waitFor(() => {
        expect(mockResetTimer).toHaveBeenCalledTimes(1);
      });

      // Give navigation time to occur
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify navigation to home page (window.location.href includes http://localhost/)
      expect(window.location.href).toContain('/');
    });

    it('should not cancel session when "Keep Session" is clicked', async () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      const cancelButton = cancelButtons.find(btn => btn.textContent === 'Cancel');
      fireEvent.click(cancelButton!);

      // Wait for confirmation modal
      await waitFor(() => {
        expect(screen.getByText('Cancel Session?')).toBeInTheDocument();
      });

      // Click "Keep Session" button
      const keepButton = screen.getByRole('button', { name: /keep session/i });
      fireEvent.click(keepButton);

      // Verify resetTimer was NOT called
      expect(mockResetTimer).not.toHaveBeenCalled();

      // Verify we're still on the completion modal
      expect(screen.getByText('Complete Session')).toBeInTheDocument();
    });

    it('should handle cancel errors gracefully', async () => {
      const errorMessage = 'Failed to clear active session';
      mockResetTimer.mockRejectedValueOnce(new Error(errorMessage));

      render(<SessionTimerEnhanced projectId="" />);

      // Click finish button
      const finishButton = screen.getByRole('button', { name: /finish/i });
      fireEvent.click(finishButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('Complete Session')).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      const cancelButton = cancelButtons.find(btn => btn.textContent === 'Cancel');
      fireEvent.click(cancelButton!);

      // Wait for confirmation modal
      await waitFor(() => {
        expect(screen.getByText('Cancel Session?')).toBeInTheDocument();
      });

      // Click confirm cancel button
      const confirmButtons = screen.getAllByRole('button', { name: /cancel/i });
      const confirmButton = confirmButtons.find(btn =>
        btn.className.includes('bg-red')
      );
      fireEvent.click(confirmButton!);

      // Verify error alert was shown
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to cancel session. Please try again.');
      });

      // Verify navigation did NOT happen (should still be on localhost)
      expect(window.location.href).toBe('http://localhost/');
    });
  });

  describe('Timer state integration', () => {
    it('should display finish button when timer is paused and ready to complete', () => {
      render(<SessionTimerEnhanced projectId="" />);

      // Verify finish button is shown (timer is paused in default mock)
      expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
    });

    it('should hide finish button and show pause button when timer is running', () => {
      // Update mock to show running timer
      (useTimer as jest.Mock).mockReturnValue({
        timerState: {
          isRunning: true,
          startTime: new Date(),
          pausedDuration: 0,
          currentProject: mockProject,
          selectedTasks: [mockTask],
          activeTimerId: 'timer-1',
          isConnected: true,
          lastAutoSave: null
        },
        resetTimer: mockResetTimer,
        finishTimer: mockFinishTimer,
        startTimer: mockStartTimer,
        pauseTimer: mockPauseTimer,
        resumeTimer: mockResumeTimer,
        updateSelectedTasks: mockUpdateSelectedTasks,
        getElapsedTime: mockGetElapsedTime,
        getFormattedTime: mockGetFormattedTime
      });

      render(<SessionTimerEnhanced projectId="" />);

      // Verify finish button is NOT shown
      expect(screen.queryByRole('button', { name: /finish/i })).not.toBeInTheDocument();

      // Verify pause button is shown instead
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });
});
