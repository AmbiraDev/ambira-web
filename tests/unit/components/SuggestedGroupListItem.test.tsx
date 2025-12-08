/**
 * Unit Test: SuggestedGroupListItem Component
 * Tests: Suggested group card display and join functionality
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SuggestedGroupListItem } from '@/features/groups/components/SuggestedGroupListItem'
import { Group } from '@/types'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('SuggestedGroupListItem', () => {
  const mockGroup: Group = {
    id: 'group-123',
    name: 'Test Fitness Group',
    description: 'A group for fitness enthusiasts who love to work out',
    category: 'learning',
    type: 'professional',
    privacySetting: 'public',
    memberCount: 15,
    adminUserIds: ['user-1'],
    memberIds: ['user-1', 'user-2'],
    createdByUserId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    imageUrl: 'https://example.com/image.jpg',
    location: 'Seattle, WA',
  }

  const mockOnJoin = jest.fn()

  type SuggestedGroupListItemProps = React.ComponentProps<typeof SuggestedGroupListItem>

  const defaultProps: SuggestedGroupListItemProps = {
    group: mockGroup,
    onJoin: mockOnJoin,
    isJoining: false,
    isJoined: false,
  }

  const renderComponent = (props: Partial<SuggestedGroupListItemProps> = {}) =>
    render(<SuggestedGroupListItem {...defaultProps} {...props} />)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render group name', () => {
    renderComponent()

    const names = screen.getAllByText('Test Fitness Group')
    expect(names.length).toBeGreaterThan(0)
  })

  it('should render member count with correct pluralization', () => {
    renderComponent()

    expect(screen.getByText('15 Members')).toBeInTheDocument()
  })

  it('should render singular "Member" for count of 1', () => {
    const singleMemberGroup = { ...mockGroup, memberCount: 1 }

    renderComponent({ group: singleMemberGroup })

    expect(screen.getByText('1 Member')).toBeInTheDocument()
  })

  it('should render location when provided', () => {
    renderComponent()

    const locations = screen.getAllByText('Seattle, WA')
    expect(locations.length).toBeGreaterThan(0)
  })

  it('should not render location when not provided', () => {
    const groupWithoutLocation = { ...mockGroup, location: undefined }

    renderComponent({ group: groupWithoutLocation })

    expect(screen.queryByText('Seattle, WA')).not.toBeInTheDocument()
  })

  it('should render description on desktop', () => {
    renderComponent()

    expect(
      screen.getByText('A group for fitness enthusiasts who love to work out')
    ).toBeInTheDocument()
  })

  it('should render Join button', () => {
    renderComponent()

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    expect(joinButton).toBeInTheDocument()
    expect(joinButton).toHaveTextContent('Join')
  })

  it('should call onJoin when Join button is clicked', () => {
    renderComponent()

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    fireEvent.click(joinButton)

    expect(mockOnJoin).toHaveBeenCalledTimes(1)
    expect(mockOnJoin).toHaveBeenCalledWith('group-123', expect.any(Object))
  })

  it('should show "Joining..." when isJoining is true', () => {
    renderComponent({ isJoining: true })

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    expect(joinButton).toHaveTextContent('Joining...')
  })

  it('should disable Join button when isJoining is true', () => {
    renderComponent({ isJoining: true })

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    expect(joinButton).toBeDisabled()
  })

  it('should not call onJoin when button is disabled due to joining state', () => {
    renderComponent({ isJoining: true })

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    fireEvent.click(joinButton)

    expect(mockOnJoin).not.toHaveBeenCalled()
  })

  it('should render link to group page', () => {
    const { container } = renderComponent()

    const groupLink = container.querySelector('a[href="/groups/group-123"]')
    expect(groupLink).toBeInTheDocument()
  })

  it('should truncate long group names on mobile', () => {
    const longNameGroup = {
      ...mockGroup,
      name: 'This is a very long group name that should be truncated on mobile devices',
    }

    renderComponent({ group: longNameGroup })

    expect(screen.getByText('This is a very long group name...')).toBeInTheDocument()
  })

  it('should truncate long location on mobile', () => {
    const longLocationGroup = {
      ...mockGroup,
      location: 'A very long location name that needs truncation',
    }

    renderComponent({ group: longLocationGroup })

    expect(screen.getByText('A very long location...')).toBeInTheDocument()
  })

  it('should handle groups with 0 members', () => {
    const emptyGroup = { ...mockGroup, memberCount: 0 }

    renderComponent({ group: emptyGroup })

    expect(screen.getByText('0 Members')).toBeInTheDocument()
  })

  it('should render group avatar', () => {
    const { container } = renderComponent()

    const avatarLink = container.querySelector('a[href="/groups/group-123"]')
    expect(avatarLink).toBeInTheDocument()
    expect(avatarLink?.querySelector('div')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes on Join button', () => {
    renderComponent()

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    expect(joinButton).toHaveAttribute('aria-label', 'Join Test Fitness Group')
  })

  it('should apply hover styles to card', () => {
    const { container } = renderComponent()

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('hover:bg-gray-50')
  })

  it('should truncate very long descriptions', () => {
    const longDescGroup = {
      ...mockGroup,
      description: 'A'.repeat(200),
    }

    renderComponent({ group: longDescGroup })

    const description = screen.getByText(/^A+\.\.\.$/) as HTMLElement
    expect(description.textContent?.length).toBeLessThanOrEqual(153)
  })

  it('should show Joined state when already a member', () => {
    renderComponent({ isJoined: true })

    const joinButton = screen.getByRole('button', {
      name: 'Already joined Test Fitness Group',
    })
    expect(joinButton).toHaveTextContent('Joined')
    expect(joinButton).toBeDisabled()
  })
})
