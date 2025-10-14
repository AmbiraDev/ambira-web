import React from 'react';
import { render, screen } from '@testing-library/react';
import PostStats from '../PostStats';
import { Session, Project } from '@/types';

// Mock data
const mockSession: Session = {
  id: 'session-1',
  userId: 'user-1',
  activityId: 'project-1',
  projectId: 'project-1',
  title: 'Morning Coding Session',
  description: 'Worked on React components',
  duration: 7200, // 2 hours
  startTime: new Date('2024-01-01T09:00:00Z'),
  tags: ['coding', 'react', 'frontend'],
  visibility: 'everyone',
  howFelt: 4,
  privateNotes: 'Felt productive',
  isArchived: false,
  supportCount: 0,
  commentCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockProject: Project = {
  id: 'project-1',
  userId: 'user-1',
  name: 'Web Development',
  description: 'Building a web application',
  icon: '💻',
  color: '#3B82F6',
  weeklyTarget: 40,
  totalTarget: 200,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('PostStats Component', () => {
  it('renders session duration correctly', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  it('renders task completion stats correctly', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    // In the new UI, tasks are shown as "2" with "/ 3" in a separate span
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders project icon and name correctly', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('💻')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
  });

  it('renders session title', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('Morning Coding Session')).toBeInTheDocument();
  });

  it('does not render session description in stats component', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    // Session description is now shown in the PostCard, not in PostStats
    expect(screen.queryByText('Worked on React components')).not.toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('#coding')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#frontend')).toBeInTheDocument();
  });

  it('does not render how felt rating in new design', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    // How felt is now private and not shown in PostStats
    expect(screen.queryByText('How it felt:')).not.toBeInTheDocument();
  });

  it('renders session title correctly', () => {
    const sessionWithoutDescription = { ...mockSession, description: undefined };
    render(<PostStats session={sessionWithoutDescription} project={mockProject} />);
    
    expect(screen.getByText('Morning Coding Session')).toBeInTheDocument();
  });

  it('handles missing tags gracefully', () => {
    const sessionWithoutTags = { ...mockSession, tags: [] };
    render(<PostStats session={sessionWithoutTags} project={mockProject} />);
    
    expect(screen.getByText('Morning Coding Session')).toBeInTheDocument();
    expect(screen.queryByText('#coding')).not.toBeInTheDocument();
  });

  it('renders correctly without howFelt', () => {
    const sessionWithoutHowFelt = { ...mockSession, howFelt: undefined };
    render(<PostStats session={sessionWithoutHowFelt} project={mockProject} />);
    
    expect(screen.getByText('Morning Coding Session')).toBeInTheDocument();
    // howFelt is not shown in the new design
  });

  it('formats duration correctly for different time periods', () => {
    // Test 1 hour 30 minutes
    const session1h30m = { ...mockSession, duration: 5400 };
    const { rerender } = render(<PostStats session={session1h30m} project={mockProject} />);
    expect(screen.getByText('1h 30m')).toBeInTheDocument();

    // Test 45 minutes
    const session45m = { ...mockSession, duration: 2700 };
    rerender(<PostStats session={session45m} project={mockProject} />);
    expect(screen.getByText('45m')).toBeInTheDocument();

    // Test 2 hours 15 minutes
    const session2h15m = { ...mockSession, duration: 8100 };
    rerender(<PostStats session={session2h15m} project={mockProject} />);
    expect(screen.getByText('2h 15m')).toBeInTheDocument();
  });
});
