import React from 'react';
import { render, screen } from '@testing-library/react';
import PostStats from '../PostStats';
import { Session, Project } from '@/types';

// Mock data
const mockSession: Session = {
  id: 'session-1',
  userId: 'user-1',
  projectId: 'project-1',
  title: 'Morning Coding Session',
  description: 'Worked on React components',
  duration: 7200, // 2 hours
  startTime: new Date('2024-01-01T09:00:00Z'),
  tasks: [
    { id: 'task-1', projectId: 'project-1', name: 'Create component', status: 'completed', createdAt: new Date(), completedAt: new Date() },
    { id: 'task-2', projectId: 'project-1', name: 'Write tests', status: 'completed', createdAt: new Date(), completedAt: new Date() },
    { id: 'task-3', projectId: 'project-1', name: 'Update docs', status: 'active', createdAt: new Date() }
  ],
  tags: ['coding', 'react', 'frontend'],
  visibility: 'everyone',
  howFelt: 4,
  privateNotes: 'Felt productive',
  isArchived: false,
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
    
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders project icon correctly', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('💻')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
  });

  it('renders session title', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('Morning Coding Session')).toBeInTheDocument();
  });

  it('renders session description', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('Worked on React components')).toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('#coding')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#frontend')).toBeInTheDocument();
  });

  it('renders how felt rating correctly', () => {
    render(<PostStats session={mockSession} project={mockProject} />);
    
    expect(screen.getByText('How it felt:')).toBeInTheDocument();
    
    // Should show 4 stars filled
    const stars = screen.getAllByText('★');
    expect(stars).toHaveLength(5); // 5 stars total
  });

  it('handles missing description gracefully', () => {
    const sessionWithoutDescription = { ...mockSession, description: undefined };
    render(<PostStats session={sessionWithoutDescription} project={mockProject} />);
    
    expect(screen.getByText('Morning Coding Session')).toBeInTheDocument();
    expect(screen.queryByText('Worked on React components')).not.toBeInTheDocument();
  });

  it('handles missing tags gracefully', () => {
    const sessionWithoutTags = { ...mockSession, tags: [] };
    render(<PostStats session={sessionWithoutTags} project={mockProject} />);
    
    expect(screen.getByText('Morning Coding Session')).toBeInTheDocument();
    expect(screen.queryByText('#coding')).not.toBeInTheDocument();
  });

  it('handles missing howFelt gracefully', () => {
    const sessionWithoutHowFelt = { ...mockSession, howFelt: undefined };
    render(<PostStats session={sessionWithoutHowFelt} project={mockProject} />);
    
    expect(screen.getByText('Morning Coding Session')).toBeInTheDocument();
    expect(screen.queryByText('How it felt:')).not.toBeInTheDocument();
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
