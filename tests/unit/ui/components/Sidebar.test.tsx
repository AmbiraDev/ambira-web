import React from 'react'
import { render, screen } from '@testing-library/react'
import { LeftSidebar, RightSidebar } from '@/components/Sidebar'

describe('components/Sidebar', () => {
  it('renders the default left sidebar stats and quick actions', () => {
    render(<LeftSidebar />)

    expect(screen.getByRole('heading', { name: 'Your Stats' })).toBeInTheDocument()
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('12h 30m')).toBeInTheDocument()
    expect(screen.getByText('7 Day Streak')).toBeInTheDocument()
    expect(screen.getByText('View Training Log')).toBeInTheDocument()
    expect(screen.getByText('Create Project')).toBeInTheDocument()
    expect(screen.getByText('Join Group')).toBeInTheDocument()
  })

  it('renders right sidebar discovery sections', () => {
    render(<RightSidebar />)

    expect(screen.getByRole('heading', { name: 'Challenges' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Suggested Friends' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View All Challenges/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Find and Invite Your Friends/ })).toBeInTheDocument()
  })
})
