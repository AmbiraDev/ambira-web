import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced';
import { useTimer } from '@/features/timer/hooks';
import { useActivities } from '@/hooks/useActivitiesQuery';
import { uploadImages } from '@/lib/imageUpload';

// Mock the contexts and hooks
jest.mock('@/features/timer/hooks');
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    isAuthenticated: true,
  }),
}));
jest.mock('@/hooks/useActivitiesQuery');
jest.mock('@/lib/imageUpload');

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return <img {...props} alt={props.alt || ''} />;
  },
}));

describe('SessionTimerEnhanced - Image Upload', () => {
  const mockStartTimer = jest.fn();
  const mockPauseTimer = jest.fn();
  const mockResumeTimer = jest.fn();
  const mockFinishTimer = jest.fn();
  const mockResetTimer = jest.fn();
  const mockUpdateSelectedTasks = jest.fn();
  const mockGetElapsedTime = jest.fn(() => 3600);
  const mockGetFormattedTime = jest.fn((seconds: number) => '01:00:00');

  const mockProjects = [
    { id: 'proj1', name: 'Test Project', icon: '📝', color: '#007AFF' },
  ];

  const mockTasks = [
    { id: 'task1', name: 'Test Task', projectId: 'proj1', status: 'active' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useTimer as jest.Mock).mockReturnValue({
      timerState: {
        isRunning: true,
        startTime: new Date(),
        pausedDuration: 0,
        currentProject: mockProjects[0],
        selectedTasks: [],
        activeTimerId: 'timer-123',
        isConnected: true,
        lastAutoSave: null,
      },
      startTimer: mockStartTimer,
      pauseTimer: mockPauseTimer,
      resumeTimer: mockResumeTimer,
      finishTimer: mockFinishTimer,
      resetTimer: mockResetTimer,
      updateSelectedTasks: mockUpdateSelectedTasks,
      getElapsedTime: mockGetElapsedTime,
      getFormattedTime: mockGetFormattedTime,
    });

    (useActivities as jest.Mock).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    });

    (uploadImages as jest.Mock).mockResolvedValue([
      { url: 'https://example.com/image1.jpg', path: 'path/to/image1.jpg' },
      { url: 'https://example.com/image2.jpg', path: 'path/to/image2.jpg' },
    ]);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
  });

  it('should show image upload button in finish modal', async () => {
    render(<SessionTimerEnhanced projectId="proj1" />);

    // Click finish button to open modal
    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });
  });

  it('should allow selecting image files', async () => {
    render(<SessionTimerEnhanced projectId="proj1" />);

    // Open finish modal
    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    // Create mock file
    const file = new File(['image content'], 'test-image.jpg', {
      type: 'image/jpeg',
    });

    // Find file input and simulate file selection
    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });
  });

  it('should show preview after selecting images', async () => {
    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      const preview = screen.getByAltText(/preview 1/i);
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute('src', 'blob:mock-url');
    });
  });

  it('should limit to maximum 3 images', async () => {
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    const files = [
      new File(['1'], '1.jpg', { type: 'image/jpeg' }),
      new File(['2'], '2.jpg', { type: 'image/jpeg' }),
      new File(['3'], '3.jpg', { type: 'image/jpeg' }),
      new File(['4'], '4.jpg', { type: 'image/jpeg' }),
    ];

    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: files,
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Maximum 3 images allowed');
    });

    alertMock.mockRestore();
  });

  it('should reject files larger than 5MB', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('too large')
      );
    });

    alertMock.mockRestore();
  });

  it('should reject non-image files', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    const textFile = new File(['text'], 'file.txt', { type: 'text/plain' });

    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [textFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('not an image')
      );
    });

    alertMock.mockRestore();
  });

  it('should allow removing selected images', async () => {
    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByAltText(/preview 1/i)).toBeInTheDocument();
    });

    // Find and click remove button
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(btn => btn.querySelector('svg')); // XCircle icon

    if (removeButton) {
      fireEvent.click(removeButton);
    }

    await waitFor(() => {
      expect(screen.queryByAltText(/preview 1/i)).not.toBeInTheDocument();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  it('should upload images when finishing session', async () => {
    mockFinishTimer.mockResolvedValue({ id: 'session-123' });

    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    // Add images
    const files = [
      new File(['1'], '1.jpg', { type: 'image/jpeg' }),
      new File(['2'], '2.jpg', { type: 'image/jpeg' }),
    ];

    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: files,
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getAllByAltText(/preview/i)).toHaveLength(2);
    });

    // Fill required fields
    const titleInput = screen.getByPlaceholderText(/how did it go/i);
    fireEvent.change(titleInput, { target: { value: 'Test Session' } });

    // Find and click the save button (not finish timer button)
    const saveButton = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(uploadImages).toHaveBeenCalledWith(files);
      expect(mockFinishTimer).toHaveBeenCalledWith(
        'Test Session',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          images: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
        })
      );
    });
  });

  it('should handle image upload errors gracefully', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    (uploadImages as jest.Mock).mockRejectedValue(new Error('Upload failed'));
    mockFinishTimer.mockResolvedValue({ id: 'session-123' });

    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByAltText(/preview 1/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(/how did it go/i);
    fireEvent.change(titleInput, { target: { value: 'Test Session' } });

    const saveButton = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Failed to upload images')
      );
      // Session should still be created without images
      expect(mockFinishTimer).toHaveBeenCalled();
    });

    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  it('should update button text when more images can be added', async () => {
    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText('Add images')).toBeInTheDocument();
    });

    // Add one image
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Add 2 more')).toBeInTheDocument();
    });
  });

  it('should hide upload button when 3 images are selected', async () => {
    render(<SessionTimerEnhanced projectId="proj1" />);

    const finishButton = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/add images/i)).toBeInTheDocument();
    });

    const files = [
      new File(['1'], '1.jpg', { type: 'image/jpeg' }),
      new File(['2'], '2.jpg', { type: 'image/jpeg' }),
      new File(['3'], '3.jpg', { type: 'image/jpeg' }),
    ];

    const fileInput = screen
      .getByLabelText(/add images/i)
      .querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: files,
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getAllByAltText(/preview/i)).toHaveLength(3);
      expect(screen.queryByText(/add/i)).not.toBeInTheDocument();
    });
  });
});
