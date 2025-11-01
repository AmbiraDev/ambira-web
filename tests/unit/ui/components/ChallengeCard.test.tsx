import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChallengeCard from '@/components/ChallengeCard';
import type { Challenge, ChallengeStats } from '@/types';

jest.mock('next/link', () => {
  const LinkMock = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  LinkMock.displayName = 'NextLinkMock';
  return LinkMock;
});

const baseChallenge = (overrides: Partial<Challenge> = {}): Challenge => ({
  id: 'challenge-1',
  name: 'Deep Work Sprint',
  description: 'Log the most focused hours',
  type: 'most-activity',
  goalValue: 12,
  startDate: new Date('2024-01-01T00:00:00Z'),
  endDate: new Date('2024-01-10T00:00:00Z'),
  participantCount: 23,
  createdByUserId: 'creator-1',
  createdAt: new Date('2023-12-01T00:00:00Z'),
  updatedAt: new Date('2023-12-20T00:00:00Z'),
  isActive: true,
  ...overrides,
});

const createUser = (id: string, name: string) => ({
  id,
  name,
  email: `${id}@example.com`,
  username: id,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const sampleStats: ChallengeStats = {
  totalParticipants: 23,
  completedParticipants: 5,
  averageProgress: 6,
  topPerformers: [
    {
      userId: 'user-1',
      user: createUser('user-1', 'Ada Lovelace'),
      progress: 9,
      rank: 1,
      isCompleted: false,
    },
    {
      userId: 'user-2',
      user: createUser('user-2', 'Grace Hopper'),
      progress: 7,
      rank: 2,
      isCompleted: false,
    },
    {
      userId: 'user-3',
      user: createUser('user-3', 'Alan Turing'),
      progress: 6,
      rank: 3,
      isCompleted: false,
    },
  ],
  timeRemaining: 0,
  daysRemaining: 0,
};

describe('components/ChallengeCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-05T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders active challenge details and triggers join handler', () => {
    const joinHandler = jest.fn();

    render(<ChallengeCard challenge={baseChallenge()} onJoin={joinHandler} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Join Challenge')).toBeEnabled();

    fireEvent.click(screen.getByText('Join Challenge'));
    expect(joinHandler).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Goal: 12.0h')).toBeInTheDocument();
    expect(screen.getByText('23 participants')).toBeInTheDocument();
  });

  it('shows progress and leave action for participating users', () => {
    const leaveHandler = jest.fn();

    render(
      <ChallengeCard
        challenge={baseChallenge()}
        isParticipating
        userProgress={6}
        onLeave={leaveHandler}
        stats={sampleStats}
      />
    );

    expect(screen.getByText('Your Progress')).toBeInTheDocument();
    expect(screen.getByText('6.0h / 12.0h')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Leave Challenge'));
    expect(leaveHandler).toHaveBeenCalledTimes(1);
  });

  it('shows upcoming and completed labels based on schedule', () => {
    jest.setSystemTime(new Date('2023-12-30T00:00:00Z'));
    const upcomingChallenge = baseChallenge();
    const { rerender } = render(
      <ChallengeCard challenge={upcomingChallenge} />
    );

    expect(screen.getByText('Upcoming')).toBeInTheDocument();

    jest.setSystemTime(new Date('2024-01-12T00:00:00Z'));
    rerender(
      <ChallengeCard
        challenge={baseChallenge({
          isActive: false,
        })}
      />
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
