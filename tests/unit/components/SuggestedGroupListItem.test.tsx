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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render group name', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />)

    // Name appears twice (mobile and desktop)
    const names = screen.getAllByText('Test Fitness Group')
    expect(names.length).toBeGreaterThan(0)
  })

  it('should render member count with correct pluralization', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />)

    expect(screen.getByText('15 Members')).toBeInTheDocument()
  })

  it('should render singular "Member" for count of 1', () => {
    const singleMemberGroup = { ...mockGroup, memberCount: 1 }

    render(
      <SuggestedGroupListItem group={singleMemberGroup} onJoin={mockOnJoin} isJoining={false} />
    )

    expect(screen.getByText('1 Member')).toBeInTheDocument()
  })

  it('should render location when provided', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />)

    // Location appears twice (mobile and desktop)
    const locations = screen.getAllByText('Seattle, WA')
    expect(locations.length).toBeGreaterThan(0)
  })

  it('should not render location when not provided', () => {
    const groupWithoutLocation = { ...mockGroup, location: undefined }

    render(
      <SuggestedGroupListItem group={groupWithoutLocation} onJoin={mockOnJoin} isJoining={false} />
    )

    expect(screen.queryByText('Seattle, WA')).not.toBeInTheDocument()
  })

  it('should render description on desktop', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />)

    expect(
      screen.getByText('A group for fitness enthusiasts who love to work out')
    ).toBeInTheDocument()
  })

  it('should render Join button', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />)

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    expect(joinButton).toBeInTheDocument()
    expect(joinButton).toHaveTextContent('Join')
  })

  it('should call onJoin when Join button is clicked', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />)

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    fireEvent.click(joinButton)

    expect(mockOnJoin).toHaveBeenCalledTimes(1)
    expect(mockOnJoin).toHaveBeenCalledWith('group-123', expect.any(Object))
  })

  it('should show "Joining..." when isJoining is true', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={true} />)

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    expect(joinButton).toHaveTextContent('Joining...')
  })

  it('should disable Join button when isJoining is true', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={true} />)

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    expect(joinButton).toBeDisabled()
  })

  it('should not call onJoin when button is disabled', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={true} />)

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    fireEvent.click(joinButton)

    expect(mockOnJoin).not.toHaveBeenCalled()
  })

  it('should render link to group page', () => {
    const { container } = render(
      <SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />
    )

    const groupLink = container.querySelector('a[href="/groups/group-123"]')
    expect(groupLink).toBeInTheDocument()
  })

  it('should truncate long group names on mobile', () => {
    const longNameGroup = {
      ...mockGroup,
      name: 'This is a very long group name that should be truncated on mobile devices',
    }

    render(<SuggestedGroupListItem group={longNameGroup} onJoin={mockOnJoin} isJoining={false} />)

    // Mobile truncation (30 chars + ...)
    expect(screen.getByText('This is a very long group name...')).toBeInTheDocument()
  })

  it('should truncate long location on mobile', () => {
    const longLocationGroup = {
      ...mockGroup,
      location: 'A very long location name that needs truncation',
    }

    render(
      <SuggestedGroupListItem group={longLocationGroup} onJoin={mockOnJoin} isJoining={false} />
    )

    // Mobile truncation (20 chars + ...)
    expect(screen.getByText('A very long location...')).toBeInTheDocument()
  })

  it('should handle groups with 0 members', () => {
    const emptyGroup = { ...mockGroup, memberCount: 0 }

    render(<SuggestedGroupListItem group={emptyGroup} onJoin={mockOnJoin} isJoining={false} />)

    expect(screen.getByText('0 Members')).toBeInTheDocument()
  })

  it('should render group avatar', () => {
    const { container } = render(
      <SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />
    )

    // GroupAvatar component should be rendered (look for the image or icon container)
    const avatarLink = container.querySelector('a[href="/groups/group-123"]')
    expect(avatarLink).toBeInTheDocument()
    expect(avatarLink?.querySelector('div')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes on Join button', () => {
    render(<SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />)

    const joinButton = screen.getByRole('button', {
      name: 'Join Test Fitness Group',
    })
    expect(joinButton).toHaveAttribute('aria-label', 'Join Test Fitness Group')
  })

  it('should apply hover styles to card', () => {
    const { container } = render(
      <SuggestedGroupListItem group={mockGroup} onJoin={mockOnJoin} isJoining={false} />
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('hover:bg-gray-50')
  })

  it('should truncate very long descriptions', () => {
    const longDescGroup = {
      ...mockGroup,
      description: 'A'.repeat(200), // 200 characters
    }

    render(<SuggestedGroupListItem group={longDescGroup} onJoin={mockOnJoin} isJoining={false} />)

    const description = screen.getByText(/^A+\.\.\.$/) as HTMLElement
    expect(description.textContent?.length).toBeLessThanOrEqual(153) // 150 + "..."
  })
})
