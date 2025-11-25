/**
 * Unit Tests for DeleteCustomActivityModal
 *
 * Tests the activity deletion confirmation:
 * - Confirmation dialog rendering
 * - Activity usage display (sessions, hours)
 * - Deletion handling and error states
 * - Modal lifecycle
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteCustomActivityModal } from '@/features/settings/components/DeleteCustomActivityModal'
import type { ActivityType } from '@/types'

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('@/hooks/useActivityTypes', () => ({
  useDeleteCustomActivity: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isLoading: false,
  })),
}))

jest.mock('@/components/IconRenderer', () => ({
  IconRenderer: ({ iconName, className }: { iconName: string; className: string }) => (
    <span data-testid={`icon-${iconName}`} className={className}>
      {iconName}
    </span>
  ),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    type,
    disabled,
    variant,
    className,
  }: {
    children: React.ReactNode
    onClick?: () => void
    type?: 'button' | 'submit'
    disabled?: boolean
    variant?: string
    className?: string
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  ),
}))

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createMockActivityType = (overrides: Partial<ActivityType> = {}): ActivityType => ({
  id: 'guitar',
  name: 'Guitar Practice',
  category: 'creative',
  icon: 'mdi:music',
  defaultColor: '#FF6482',
  isSystem: false,
  userId: 'test-user-123',
  order: 11,
  description: 'Daily guitar practice',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// ============================================================================
// TEST SUITE
// ============================================================================

describe('DeleteCustomActivityModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ========================================================================
  // RENDERING
  // ========================================================================

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      // Act
      render(<DeleteCustomActivityModal isOpen={false} onClose={jest.fn()} activity={null} />)

      // Assert
      expect(screen.queryByText('Delete Activity?')).not.toBeInTheDocument()
    })

    it('should not render when activity is null', () => {
      // Act
      render(<DeleteCustomActivityModal isOpen={true} onClose={jest.fn()} activity={null} />)

      // Assert
      expect(screen.queryByText('Delete Activity?')).not.toBeInTheDocument()
    })

    it('should render modal when isOpen and activity are provided', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Assert
      expect(screen.getByText('Delete Activity?')).toBeInTheDocument()
    })

    it('should display activity name and icon', () => {
      // Arrange
      const activity = createMockActivityType({
        name: 'Violin Lessons',
        icon: 'mdi:music',
      })

      // Act
      render(<DeleteCustomActivityModal isOpen={true} onClose={jest.fn()} activity={activity} />)

      // Assert
      expect(screen.getByText('Violin Lessons')).toBeInTheDocument()
      expect(screen.getByTestId('icon-mdi:music')).toBeInTheDocument()
    })

    it('should display activity description', () => {
      // Arrange
      const activity = createMockActivityType({
        description: 'Weekly violin lessons',
      })

      // Act
      render(<DeleteCustomActivityModal isOpen={true} onClose={jest.fn()} activity={activity} />)

      // Assert
      expect(screen.getByText('Weekly violin lessons')).toBeInTheDocument()
    })

    it('should render delete and cancel buttons', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Assert
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Delete Activity/ })).toBeInTheDocument()
    })
  })

  // ========================================================================
  // USAGE DISPLAY - NO SESSIONS
  // ========================================================================

  describe('Usage Display - No Sessions', () => {
    it('should display message when activity has not been used', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={0}
          totalHours={0}
        />
      )

      // Assert
      expect(screen.getByText(/This activity has never been used/)).toBeInTheDocument()
    })

    it('should not show usage stats when sessionCount is 0', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={0}
        />
      )

      // Assert
      expect(screen.queryByText(/This activity has existing sessions/)).not.toBeInTheDocument()
    })
  })

  // ========================================================================
  // USAGE DISPLAY - WITH SESSIONS
  // ========================================================================

  describe('Usage Display - With Sessions', () => {
    it('should display session count when activity has been used', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={5}
          totalHours={2.5}
        />
      )

      // Assert
      expect(screen.getByText(/This activity has existing sessions/)).toBeInTheDocument()
      expect(screen.getByText(/5 sessions/)).toBeInTheDocument()
    })

    it('should display singular "session" for 1 session', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={1}
          totalHours={0.5}
        />
      )

      // Assert
      expect(screen.getByText(/1 session$/)).toBeInTheDocument()
    })

    it('should display plural "sessions" for multiple sessions', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={3}
          totalHours={1.5}
        />
      )

      // Assert
      expect(screen.getByText(/3 sessions/)).toBeInTheDocument()
    })

    it('should display total hours when provided', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={5}
          totalHours={12.75}
        />
      )

      // Assert - Component uses .toFixed(1) so 12.75 becomes 12.8
      expect(screen.getByText(/12.8 hours total/)).toBeInTheDocument()
    })

    it('should display singular "hour" for 1 hour', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={1}
          totalHours={1}
        />
      )

      // Assert - Component uses .toFixed(1) so 1 becomes 1.0
      expect(screen.getByText(/1.0 hour total/)).toBeInTheDocument()
    })

    it('should display plural "hours" for multiple hours', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={5}
          totalHours={3.5}
        />
      )

      // Assert
      expect(screen.getByText(/3.5 hours/)).toBeInTheDocument()
    })

    it('should warn about sessions becoming unassigned', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={5}
          totalHours={10}
        />
      )

      // Assert
      expect(screen.getByText(/All sessions will be marked as/)).toBeInTheDocument()
      expect(screen.getByText(/Unassigned/)).toBeInTheDocument()
    })

    it('should not display hours when totalHours is 0', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={5}
          totalHours={0}
        />
      )

      // Assert
      expect(screen.getByText(/5 sessions/)).toBeInTheDocument()
      expect(screen.queryByText(/0 hours/)).not.toBeInTheDocument()
    })
  })

  // ========================================================================
  // DELETE CONFIRMATION
  // ========================================================================

  describe('Delete Confirmation', () => {
    it('should show confirmation message', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Assert
      expect(
        screen.getByText(/Are you sure you want to delete this custom activity?/)
      ).toBeInTheDocument()
    })

    it('should warn action cannot be undone', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Assert
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument()
    })
  })

  // ========================================================================
  // DELETION
  // ========================================================================

  describe('Deletion', () => {
    it('should call mutateAsync when delete button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined)

      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      })

      const activity = createMockActivityType({ id: 'guitar-123' })

      render(<DeleteCustomActivityModal isOpen={true} onClose={jest.fn()} activity={activity} />)

      // Act
      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })
      await user.click(deleteButton)

      // Assert
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('guitar-123')
      })
    })

    it('should call onSuccess on successful deletion', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const onSuccess = jest.fn()

      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue(undefined),
        isLoading: false,
      })

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={onSuccess}
          activity={createMockActivityType()}
        />
      )

      // Act
      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })
      await user.click(deleteButton)

      // Assert
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should close modal on successful deletion', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const onClose = jest.fn()

      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue(undefined),
        isLoading: false,
      })

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={onClose}
          activity={createMockActivityType()}
        />
      )

      // Act
      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })
      await user.click(deleteButton)

      // Assert
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should display error message on deletion failure', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const errorMessage = 'Failed to delete activity'

      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error(errorMessage)),
        isLoading: false,
      })

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })
      await user.click(deleteButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should disable buttons during deletion', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')

      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: jest.fn(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(undefined), 100)
            })
        ),
        isLoading: false,
      })

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })
      await user.click(deleteButton)

      // Assert - Button should show deleting state
      expect(screen.getByRole('button', { name: /Deleting/ })).toBeInTheDocument()
    })

    it('should show correct button text during deletion', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')

      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: jest.fn(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(undefined), 100)
            })
        ),
        isLoading: false,
      })

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })

      // Initial state
      expect(deleteButton).toHaveTextContent('Delete Activity')

      // During deletion
      await user.click(deleteButton)
      expect(screen.getByRole('button', { name: /Deleting/ })).toBeInTheDocument()
    })
  })

  // ========================================================================
  // MODAL LIFECYCLE
  // ========================================================================

  describe('Modal Lifecycle', () => {
    it('should close modal on cancel button click', async () => {
      // Arrange
      const user = userEvent.setup()
      const onClose = jest.fn()

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={onClose}
          activity={createMockActivityType()}
        />
      )

      // Act
      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      await user.click(cancelButton)

      // Assert
      expect(onClose).toHaveBeenCalled()
    })

    it('should close modal on close button click', async () => {
      // Arrange
      const user = userEvent.setup()
      const onClose = jest.fn()

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={onClose}
          activity={createMockActivityType()}
        />
      )

      // Act
      const closeButton = screen.getByLabelText('Close modal')
      await user.click(closeButton)

      // Assert
      expect(onClose).toHaveBeenCalled()
    })

    it('should close modal on ESC key press', async () => {
      // Arrange
      const onClose = jest.fn()
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={onClose}
          activity={createMockActivityType()}
        />
      )

      // Act
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      // Assert
      expect(onClose).toHaveBeenCalled()
    })

    it('should not close modal on ESC when deleting', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const onClose = jest.fn()

      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: jest.fn(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(undefined), 100)
            })
        ),
        isLoading: false,
      })

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={onClose}
          activity={createMockActivityType()}
        />
      )

      // Act
      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })
      await user.click(deleteButton)

      fireEvent.keyDown(document, { key: 'Escape' })

      // Assert - onClose should not be called while deleting
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should disable close button during deletion', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')

      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: jest.fn(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(undefined), 100)
            })
        ),
        isLoading: false,
      })

      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })
      await user.click(deleteButton)

      // Assert
      const closeButton = screen.getByLabelText('Close modal')
      expect(closeButton).toBeDisabled()
    })

    it('should reset error state when modal opens', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useDeleteCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')

      // Set up the failing mock BEFORE rendering
      useDeleteCustomActivity.mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('Delete failed')),
        isLoading: false,
      })

      const { rerender } = render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      const deleteButton = screen.getByRole('button', {
        name: /Delete Activity/,
      })
      await user.click(deleteButton)

      // Error should be visible
      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })

      // Close and reopen
      rerender(
        <DeleteCustomActivityModal
          isOpen={false}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      rerender(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Assert - Error should be cleared
      expect(screen.queryByText('Delete failed')).not.toBeInTheDocument()
    })
  })

  // ========================================================================
  // DEFAULT VALUES
  // ========================================================================

  describe('Default Values', () => {
    it('should default sessionCount to 0', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          // No sessionCount provided
        />
      )

      // Assert
      expect(screen.getByText(/This activity has never been used/)).toBeInTheDocument()
    })

    it('should default totalHours to 0', () => {
      // Act
      render(
        <DeleteCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          activity={createMockActivityType()}
          sessionCount={5}
          // No totalHours provided
        />
      )

      // Assert
      expect(screen.queryByText(/0 hours/)).not.toBeInTheDocument()
    })
  })
})
