/**
 * Challenge Factory
 * Creates mock challenges and participants for testing
 */

import type { Challenge, ChallengeParticipant } from '@/types';

let challengeIdCounter = 0;
let participantIdCounter = 0;

export function createMockChallenge(
  overrides: Partial<Challenge> = {}
): Challenge {
  const id = overrides.id || `challenge-${Date.now()}-${++challengeIdCounter}`;
  const startDate = overrides.startDate || new Date();
  const endDate =
    overrides.endDate ||
    new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

  return {
    id,
    groupId: overrides.groupId,
    name: overrides.name || 'Test Challenge',
    description: overrides.description || 'A test challenge description',
    type: overrides.type || 'most-activity',
    goalValue: overrides.goalValue,
    startDate,
    endDate,
    participantCount: overrides.participantCount || 0,
    createdByUserId: overrides.createdByUserId || `user-${Date.now()}`,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    rules: overrides.rules,
    projectIds: overrides.projectIds,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    rewards: overrides.rewards,
    category: overrides.category,
    isParticipating: overrides.isParticipating,
    userProgress: overrides.userProgress,
  };
}

export function createMockChallengeParticipant(
  overrides: Partial<ChallengeParticipant> = {}
): ChallengeParticipant {
  return {
    id: overrides.id || `participant-${Date.now()}-${++participantIdCounter}`,
    challengeId: overrides.challengeId || `challenge-${Date.now()}`,
    userId: overrides.userId || `user-${Date.now()}`,
    joinedAt: overrides.joinedAt || new Date(),
    progress: overrides.progress || 0,
    rank: overrides.rank,
    isCompleted: overrides.isCompleted || false,
    completedAt: overrides.completedAt,
  };
}

export function createMockChallengeBatch(
  count: number,
  baseOverrides: Partial<Challenge> = {}
): Challenge[] {
  return Array.from({ length: count }, (_, i) =>
    createMockChallenge({ ...baseOverrides, name: `Challenge ${i + 1}` })
  );
}

export function resetChallengeFactory() {
  challengeIdCounter = 0;
  participantIdCounter = 0;
}
