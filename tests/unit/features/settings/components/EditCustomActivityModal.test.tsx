/**
 * Unit Tests for EditCustomActivityModal
 *
 * Tests the custom activity editing form:
 * - Form initialization with activity data
 * - Validation (name, icon, description)
 * - Duplicate name checking (excluding current activity)
 * - Submission and error handling
 * - Modal lifecycle
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditCustomActivityModal } from '@/features/settings/components/EditCustomActivityModal'
import type { ActivityType } from '@/types'

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('@/hooks/useActivityTypes', () => ({
  useUpdateCustomActivity: jest.fn(() => ({
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

describe('EditCustomActivityModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ========================================================================
  // RENDERING
  // ========================================================================

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      // Act
      render(
        <EditCustomActivityModal
          isOpen={false}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={null}
        />
      )

      // Assert
      expect(screen.queryByText('Edit Custom Activity')).not.toBeInTheDocument()
    })

    it('should not render when activity is null', () => {
      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={null}
        />
      )

      // Assert
      expect(screen.queryByText('Edit Custom Activity')).not.toBeInTheDocument()
    })

    it('should render modal when isOpen and activity are provided', () => {
      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Assert
      expect(screen.getByText('Edit Custom Activity')).toBeInTheDocument()
    })

    it('should initialize form with activity data', () => {
      // Arrange
      const activity = createMockActivityType({
        name: 'Piano Lessons',
        description: 'Weekly piano lessons',
      })

      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity}
        />
      )

      // Assert
      const nameInput = screen.getByLabelText(/Activity Name/) as HTMLInputElement
      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement

      expect(nameInput.value).toBe('Piano Lessons')
      expect(descInput.value).toBe('Weekly piano lessons')
    })

    it('should render all form fields', () => {
      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Assert
      expect(screen.getByLabelText(/Activity Name/)).toBeInTheDocument()
      expect(screen.getByText('Icon')).toBeInTheDocument() // Icon is a label without a form control
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    })

    it('should render submit and cancel buttons', () => {
      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Assert
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Save Changes/ })).toBeInTheDocument()
    })
  })

  // ========================================================================
  // FORM INITIALIZATION
  // ========================================================================

  describe('Form Initialization', () => {
    it('should populate name field with activity name', () => {
      // Arrange
      const activity = createMockActivityType({ name: 'Violin Lessons' })

      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity}
        />
      )

      // Assert
      const nameInput = screen.getByLabelText(/Activity Name/) as HTMLInputElement
      expect(nameInput.value).toBe('Violin Lessons')
    })

    it('should populate description field with activity description', () => {
      // Arrange
      const activity = createMockActivityType({
        description: 'Weekly lessons on Thursdays',
      })

      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity}
        />
      )

      // Assert
      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement
      expect(descInput.value).toBe('Weekly lessons on Thursdays')
    })

    it('should handle empty description', () => {
      // Arrange
      const activity = createMockActivityType({ description: undefined })

      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity}
        />
      )

      // Assert
      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement
      expect(descInput.value).toBe('')
    })

    it('should select correct icon', () => {
      // Arrange
      // Use a valid flat-color-icon that exists in the component's availableIcons list
      const activity = createMockActivityType({
        icon: 'flat-color-icons:music',
      })

      // Act
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity}
        />
      )

      // Assert
      // The aria-label format is "Select <icon-name> icon" where icon-name is the part after the colon
      // Icons are rendered as radio buttons within a radiogroup
      const musicIconButton = screen.getByRole('radio', {
        name: /Select music icon/i,
      })
      // Verify the button is selected (aria-checked="true")
      expect(musicIconButton).toHaveAttribute('aria-checked', 'true')
    })
  })

  // ========================================================================
  // FORM VALIDATION
  // ========================================================================

  describe('Form Validation', () => {
    it('should require activity name', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const nameInput = screen.getByLabelText(/Activity Name/)
      await user.clear(nameInput)

      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      expect(screen.getByText('Activity name is required')).toBeInTheDocument()
    })

    it('should enforce max name length of 50 characters', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const nameInput = screen.getByLabelText(/Activity Name/) as HTMLInputElement
      await user.clear(nameInput)
      await user.type(nameInput, 'a'.repeat(51))

      // Assert - Input should enforce maxLength and only contain 50 characters
      expect(nameInput.value).toHaveLength(50)
      expect(nameInput.value).toBe('a'.repeat(50))
    })

    it('should prevent duplicate names (excluding current activity)', async () => {
      // Arrange
      const user = userEvent.setup()
      const existingNames = ['Violin', 'Piano']

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType({ name: 'Guitar' })}
          existingNames={existingNames}
        />
      )

      // Act
      const nameInput = screen.getByLabelText(/Activity Name/)
      await user.clear(nameInput)
      await user.type(nameInput, 'Piano') // Try to change to existing name

      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      expect(screen.getByText('An activity with this name already exists')).toBeInTheDocument()
    })

    it('should allow keeping the same name', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useUpdateCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const mockMutateAsync = jest.fn().mockResolvedValue({})

      useUpdateCustomActivity.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      })

      const activity = createMockActivityType({ name: 'Guitar' })
      const existingNames = ['Guitar', 'Piano'] // Guitar already exists (current activity)

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity}
          existingNames={existingNames}
        />
      )

      // Act
      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert - Should allow submission with same name
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })

    it('should be case-insensitive for duplicate checking', async () => {
      // Arrange
      const user = userEvent.setup()
      const existingNames = ['Piano']

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType({ name: 'Guitar' })}
          existingNames={existingNames}
        />
      )

      // Act
      const nameInput = screen.getByLabelText(/Activity Name/)
      await user.clear(nameInput)
      await user.type(nameInput, 'piano') // Different case

      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      expect(screen.getByText('An activity with this name already exists')).toBeInTheDocument()
    })

    it('should enforce max description length of 200 characters', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const descInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement
      await user.clear(descInput)
      await user.type(descInput, 'a'.repeat(201))

      // Assert - Textarea should enforce maxLength and only contain 200 characters
      expect(descInput.value).toHaveLength(200)
      expect(descInput.value).toBe('a'.repeat(200))
    })
  })

  // ========================================================================
  // FORM SUBMISSION
  // ========================================================================

  describe('Form Submission', () => {
    it('should submit updated data', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useUpdateCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const mockMutateAsync = jest.fn().mockResolvedValue({})

      useUpdateCustomActivity.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      })

      const activity = createMockActivityType({ id: 'guitar-123' })

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity}
        />
      )

      // Act
      const nameInput = screen.getByLabelText(/Activity Name/)
      await user.clear(nameInput)
      await user.type(nameInput, 'Electric Guitar')

      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            typeId: 'guitar-123',
            data: expect.objectContaining({
              name: 'Electric Guitar',
            }),
          })
        )
      })
    })

    it('should trim whitespace from fields', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useUpdateCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const mockMutateAsync = jest.fn().mockResolvedValue({})

      useUpdateCustomActivity.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: false,
      })

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const nameInput = screen.getByLabelText(/Activity Name/)
      await user.clear(nameInput)
      await user.type(nameInput, '  Updated Name  ')

      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'Updated Name',
            }),
          })
        )
      })
    })

    it('should call onSuccess on successful submission', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useUpdateCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const onSuccess = jest.fn()

      useUpdateCustomActivity.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({}),
        isLoading: false,
      })

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={onSuccess}
          activity={createMockActivityType()}
        />
      )

      // Act
      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should close modal on successful submission', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useUpdateCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const onClose = jest.fn()

      useUpdateCustomActivity.mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({}),
        isLoading: false,
      })

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={onClose}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should display error message on submission failure', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useUpdateCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const errorMessage = 'Failed to update activity'

      useUpdateCustomActivity.mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error(errorMessage)),
        isLoading: false,
      })

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should show saving state during submission', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useUpdateCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')

      useUpdateCustomActivity.mockReturnValue({
        mutateAsync: jest.fn(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve({}), 100)
            })
        ),
        isLoading: false,
      })

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      // Assert
      expect(screen.getByRole('button', { name: /Saving/ })).toBeInTheDocument()
    })
  })

  // ========================================================================
  // MODAL LIFECYCLE
  // ========================================================================

  describe('Modal Lifecycle', () => {
    it('should reset form when activity changes', async () => {
      // Arrange
      const user = userEvent.setup()
      const activity1 = createMockActivityType({
        id: 'guitar',
        name: 'Guitar',
      })
      const activity2 = createMockActivityType({
        id: 'piano',
        name: 'Piano',
      })

      const { rerender } = render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity1}
        />
      )

      // Act - Change activity
      rerender(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={activity2}
        />
      )

      // Assert
      const nameInput = screen.getByLabelText(/Activity Name/) as HTMLInputElement
      expect(nameInput.value).toBe('Piano')
    })

    it('should close modal on close button click', async () => {
      // Arrange
      const user = userEvent.setup()
      const onClose = jest.fn()

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={onClose}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const closeButton = screen.getByLabelText('Close modal')
      await user.click(closeButton)

      // Assert
      expect(onClose).toHaveBeenCalled()
    })

    it('should close modal on cancel button click', async () => {
      // Arrange
      const user = userEvent.setup()
      const onClose = jest.fn()

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={onClose}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      await user.click(cancelButton)

      // Assert
      expect(onClose).toHaveBeenCalled()
    })

    it('should close modal on ESC key press', async () => {
      // Arrange
      const onClose = jest.fn()
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={onClose}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      // Assert
      expect(onClose).toHaveBeenCalled()
    })

    it('should not close modal on ESC when submitting', async () => {
      // Arrange
      const user = userEvent.setup()
      const { useUpdateCustomActivity } = jest.requireMock('@/hooks/useActivityTypes')
      const onClose = jest.fn()

      useUpdateCustomActivity.mockReturnValue({
        mutateAsync: jest.fn(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve({}), 100)
            })
        ),
        isLoading: false,
      })

      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={onClose}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const submitButton = screen.getByRole('button', { name: /Save Changes/ })
      await user.click(submitButton)

      fireEvent.keyDown(document, { key: 'Escape' })

      // Assert - onClose should not be called while submitting
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // CHARACTER COUNTING
  // ========================================================================

  describe('Character Counting', () => {
    it('should display name character count', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType({ name: 'Guitar' })}
        />
      )

      // Act
      const nameInput = screen.getByLabelText(/Activity Name/)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated')

      // Assert
      expect(screen.getByText('7/50 characters')).toBeInTheDocument()
    })

    it('should display description character count', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const descInput = screen.getByLabelText(/Description/)
      await user.clear(descInput)
      await user.type(descInput, 'New Description')

      // Assert
      expect(screen.getByText('15/200 characters')).toBeInTheDocument()
    })
  })

  // ========================================================================
  // PREVIEW
  // ========================================================================

  describe('Preview', () => {
    it('should update preview when name changes', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const nameInput = screen.getByLabelText(/Activity Name/)
      await user.clear(nameInput)
      await user.type(nameInput, 'Electric Guitar')

      // Assert
      expect(screen.getByText('Electric Guitar')).toBeInTheDocument()
    })

    it('should update preview when description changes', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <EditCustomActivityModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          activity={createMockActivityType()}
        />
      )

      // Act
      const descInput = screen.getByLabelText(/Description/)
      await user.clear(descInput)
      await user.type(descInput, 'New Description')

      // Assert - Description appears in preview and possibly in textarea
      const descElements = screen.getAllByText('New Description')
      expect(descElements.length).toBeGreaterThanOrEqual(1)
    })
  })
})
