import React from 'react';
import { render, screen } from '@testing-library/react';
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced';
import { useTimer } from '@/features/timer/hooks';
import { useActivities } from '@/hooks/useActivitiesQuery';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Mock the contexts and hooks
jest.mock('@/features/timer/hooks');
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    isAuthenticated: true,
  }),
}));
jest.mock('@/hooks/useActivitiesQuery');
jest.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));
jest.mock('@/lib/imageUpload');

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('SessionTimerEnhanced - Timer Display', () => {
  const mockStartTimer = jest.fn();
  const mockPauseTimer = jest.fn();
  const mockResumeTimer = jest.fn();
  const mockFinishTimer = jest.fn();
  const mockResetTimer = jest.fn();
  const mockUpdateSelectedTasks = jest.fn();
  const mockGetElapsedTime = jest.fn(() => 3665); // 1 hour, 1 minute, 5 seconds
  const mockGetFormattedTime = jest.fn((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  const mockProjects = [
    { id: 'proj1', name: 'Test Project', icon: '📝', color: 'blue' }
  ];

  const mockTasks: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();

    (useTimer as jest.Mock).mockReturnValue({
      timerState: {
        isRunning: true,
        startTime: new Date(),
        pausedDuration: 0,
        currentProject: mockProjects[0],
        selectedTasks: [],
        activeTimerId: 'timer1',
        isConnected: true,
        lastAutoSave: null,
      },
      updateSelectedTasks: mockUpdateSelectedTasks,
      getElapsedTime: mockGetElapsedTime,
      getFormattedTime: mockGetFormattedTime,
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resumeTimer: mockResumeTimer,
      finishTimer: mockFinishTimer,
      resetTimer: mockResetTimer,
    });

    (useActivities as jest.Mock).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    });
  });

  it('displays timer with time unit labels', () => {
    render(<SessionTimerEnhanced projectId="" />);

    // Check that the formatted time is displayed (may appear multiple times for mobile/desktop)
    const timers = screen.getAllByText('01:01:05');
    expect(timers.length).toBeGreaterThan(0);

    // Check for time unit labels
    const hoursLabels = screen.getAllByText(/Hours/i);
    const minsLabels = screen.getAllByText(/Mins/i);
    const secsLabels = screen.getAllByText(/Secs/i);

    expect(hoursLabels.length).toBeGreaterThan(0);
    expect(minsLabels.length).toBeGreaterThan(0);
    expect(secsLabels.length).toBeGreaterThan(0);
  });

  it('has aria-label for screen reader accessibility', () => {
    render(<SessionTimerEnhanced projectId="" />);

    // Check for aria-label with descriptive time
    const timerDisplays = screen.getAllByLabelText(/Timer:/i);
    expect(timerDisplays.length).toBeGreaterThan(0);
  });

  it('displays correct time format with zero padding', () => {
    mockGetElapsedTime.mockReturnValue(65); // 1 minute, 5 seconds
    mockGetFormattedTime.mockReturnValue('00:01:05');

    render(<SessionTimerEnhanced projectId="" />);

    const timers = screen.getAllByText('00:01:05');
    expect(timers.length).toBeGreaterThan(0);
  });

  it('displays hours, minutes, and seconds for long sessions', () => {
    mockGetElapsedTime.mockReturnValue(7385); // 2 hours, 3 minutes, 5 seconds
    mockGetFormattedTime.mockReturnValue('02:03:05');

    render(<SessionTimerEnhanced projectId="" />);

    const timers = screen.getAllByText('02:03:05');
    expect(timers.length).toBeGreaterThan(0);
  });
});
