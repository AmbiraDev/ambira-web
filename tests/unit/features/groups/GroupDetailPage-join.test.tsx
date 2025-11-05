/**
 * Unit Test: GroupDetailPage Join/Leave Functionality
 * Tests: Join button display, join/leave actions, and state management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GroupDetailPage } from '@/features/groups/components/GroupDetailPage';
import { useAuth } from '@/hooks/useAuth';
import { useGroupDetails } from '@/features/groups/hooks/useGroupDetails';
import {
  useJoinGroup,
  useLeaveGroup,
} from '@/features/groups/hooks/useGroupMutations';
import { Group } from '@/types';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/features/groups/hooks/useGroupDetails');
jest.mock('@/features/groups/hooks/useGroupMutations');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseGroupDetails = useGroupDetails as jest.MockedFunction<
  typeof useGroupDetails
>;
const mockUseJoinGroup = useJoinGroup as jest.MockedFunction<
  typeof useJoinGroup
>;
const mockUseLeaveGroup = useLeaveGroup as jest.MockedFunction<
  typeof useLeaveGroup
>;

describe('GroupDetailPage - Join/Leave Functionality', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    createdAt: new Date(),
  };

  const mockGroup: Group = {
    id: 'group-123',
    name: 'Test Fitness Group',
    description: 'A group for fitness enthusiasts',
    category: 'learning',
    type: 'professional',
    privacySetting: 'public',
    memberCount: 15,
    adminUserIds: ['admin-1'],
    memberIds: ['admin-1', 'user-2', 'user-3'],
    createdByUserId: 'admin-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    imageUrl: 'https://example.com/image.jpg',
    location: 'Seattle, WA',
  };

  const mockJoinMutate = jest.fn();
  const mockLeaveMutate = jest.fn();

  // Helper function to render with QueryClient
  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAuth>);

    mockUseJoinGroup.mockReturnValue({
      mutateAsync: mockJoinMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as ReturnType<typeof useJoinGroup>);

    mockUseLeaveGroup.mockReturnValue({
      mutateAsync: mockLeaveMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as ReturnType<typeof useLeaveGroup>);
  });

  describe('Join Button Display', () => {
    it('should show "Join" button when user is not a member', () => {
      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Join ${mockGroup.name}`,
      });
      expect(joinButton).toBeInTheDocument();
      expect(joinButton).toHaveTextContent('Join');
    });

    it('should show "Joined" button with checkmark when user is a member', () => {
      const groupWithUser = {
        ...mockGroup,
        memberIds: [...mockGroup.memberIds, mockUser.id],
      };

      mockUseGroupDetails.mockReturnValue({
        group: groupWithUser,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Leave ${mockGroup.name}`,
      });
      expect(joinButton).toBeInTheDocument();
      expect(joinButton).toHaveTextContent('Joined');
    });

    it('should have different styling for joined vs non-joined state', () => {
      const groupWithUser = {
        ...mockGroup,
        memberIds: [...mockGroup.memberIds, mockUser.id],
      };

      mockUseGroupDetails.mockReturnValue({
        group: groupWithUser,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Leave ${mockGroup.name}`,
      });

      // Joined state should have gray background
      expect(joinButton).toHaveClass('bg-gray-100');
      expect(joinButton).toHaveClass('text-gray-700');
    });
  });

  describe('Join Functionality', () => {
    it('should call joinGroup mutation when Join button is clicked', async () => {
      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      mockJoinMutate.mockResolvedValue(undefined);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Join ${mockGroup.name}`,
      });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockJoinMutate).toHaveBeenCalledTimes(1);
        expect(mockJoinMutate).toHaveBeenCalledWith({
          groupId: 'group-123',
          userId: 'user-123',
        });
      });
    });

    it('should show "Joining..." state while mutation is in progress', async () => {
      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      let resolveJoin: () => void = () => {};
      mockJoinMutate.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveJoin = resolve;
          })
      );

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Join ${mockGroup.name}`,
      });
      fireEvent.click(joinButton);

      // Should show "Joining..." state
      await waitFor(() => {
        expect(joinButton).toHaveTextContent('Joining...');
      });

      // Resolve the promise
      resolveJoin();

      // Should return to normal state
      await waitFor(() => {
        expect(joinButton).toHaveTextContent('Join');
      });
    });

    it('should disable button while joining', async () => {
      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      let resolveJoin: () => void = () => {};
      mockJoinMutate.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveJoin = resolve;
          })
      );

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Join ${mockGroup.name}`,
      });
      fireEvent.click(joinButton);

      // Button should be disabled
      await waitFor(() => {
        expect(joinButton).toHaveClass('cursor-not-allowed');
      });

      resolveJoin();
    });
  });

  describe('Leave Functionality', () => {
    it('should call leaveGroup mutation when Joined button is clicked', async () => {
      const groupWithUser = {
        ...mockGroup,
        memberIds: [...mockGroup.memberIds, mockUser.id],
      };

      mockUseGroupDetails.mockReturnValue({
        group: groupWithUser,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      mockLeaveMutate.mockResolvedValue(undefined);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Leave ${mockGroup.name}`,
      });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(mockLeaveMutate).toHaveBeenCalledTimes(1);
        expect(mockLeaveMutate).toHaveBeenCalledWith({
          groupId: 'group-123',
          userId: 'user-123',
        });
      });
    });

    it('should show "Leaving..." state while mutation is in progress', async () => {
      const groupWithUser = {
        ...mockGroup,
        memberIds: [...mockGroup.memberIds, mockUser.id],
      };

      mockUseGroupDetails.mockReturnValue({
        group: groupWithUser,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      let resolveLeave: () => void = () => {};
      mockLeaveMutate.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveLeave = resolve;
          })
      );

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Leave ${mockGroup.name}`,
      });
      fireEvent.click(joinButton);

      // Should show "Leaving..." state
      await waitFor(() => {
        expect(joinButton).toHaveTextContent('Leaving...');
      });

      // Resolve the promise
      resolveLeave();

      // Should return to normal state
      await waitFor(() => {
        expect(joinButton).toHaveTextContent('Joined');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle join errors gracefully', async () => {
      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockJoinMutate.mockRejectedValue(new Error('Join failed'));

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Join ${mockGroup.name}`,
      });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to join/leave group:',
          expect.any(Error)
        );
      });

      // Button should return to normal state
      await waitFor(() => {
        expect(joinButton).toHaveTextContent('Join');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle leave errors gracefully', async () => {
      const groupWithUser = {
        ...mockGroup,
        memberIds: [...mockGroup.memberIds, mockUser.id],
      };

      mockUseGroupDetails.mockReturnValue({
        group: groupWithUser,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockLeaveMutate.mockRejectedValue(new Error('Leave failed'));

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Leave ${mockGroup.name}`,
      });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to join/leave group:',
          expect.any(Error)
        );
      });

      // Button should return to normal state
      await waitFor(() => {
        expect(joinButton).toHaveTextContent('Joined');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Button Accessibility', () => {
    it('should have proper aria-label for Join button', () => {
      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Join ${mockGroup.name}`,
      });
      expect(joinButton).toHaveAttribute(
        'aria-label',
        `Join ${mockGroup.name}`
      );
    });

    it('should have proper aria-label for Joined button', () => {
      const groupWithUser = {
        ...mockGroup,
        memberIds: [...mockGroup.memberIds, mockUser.id],
      };

      mockUseGroupDetails.mockReturnValue({
        group: groupWithUser,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Leave ${mockGroup.name}`,
      });
      expect(joinButton).toHaveAttribute(
        'aria-label',
        `Leave ${mockGroup.name}`
      );
    });

    it('should have keyboard focus ring styles', () => {
      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Join ${mockGroup.name}`,
      });
      expect(joinButton).toHaveClass('focus-visible:ring-2');
      expect(joinButton).toHaveClass('focus-visible:ring-[#0066CC]');
    });
  });

  describe('Edge Cases', () => {
    it('should not render join button when user is not logged in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useAuth>);

      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.queryByRole('button', {
        name: `Join ${mockGroup.name}`,
      });
      expect(joinButton).not.toBeInTheDocument();
    });

    it('should not allow double-clicking to trigger multiple mutations', async () => {
      mockUseGroupDetails.mockReturnValue({
        group: mockGroup,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useGroupDetails>);

      let resolveJoin: () => void = () => {};
      mockJoinMutate.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveJoin = resolve;
          })
      );

      renderWithQueryClient(<GroupDetailPage groupId="group-123" />);

      const joinButton = screen.getByRole('button', {
        name: `Join ${mockGroup.name}`,
      });

      // Double click
      fireEvent.click(joinButton);
      fireEvent.click(joinButton);

      // Should only be called once
      await waitFor(() => {
        expect(mockJoinMutate).toHaveBeenCalledTimes(1);
      });

      resolveJoin();
    });
  });
});
