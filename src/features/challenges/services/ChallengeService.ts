/**
 * Challenge Service - Business Logic Layer
 *
 * Orchestrates business workflows for challenges.
 * No React dependencies - pure TypeScript for testability.
 */

import { firebaseApi } from '@/lib/api';
import {
  Challenge,
  ChallengeFilters,
  ChallengeLeaderboard,
  ChallengeProgress,
  ChallengeStats,
  CreateChallengeData,
  UpdateChallengeData,
} from '@/types';

export class ChallengeService {
  /**
   * Get all challenges with optional filters
   */
  async getChallenges(filters?: ChallengeFilters): Promise<Challenge[]> {
    try {
      return await firebaseApi.challenge.getChallenges(filters);
    } catch (error) {
      console.error('Error getting challenges:', error);
      return [];
    }
  }

  /**
   * Get a single challenge by ID
   */
  async getChallenge(challengeId: string): Promise<Challenge | null> {
    try {
      return await firebaseApi.challenge.getChallenge(challengeId);
    } catch (error) {
      console.error('Error getting challenge:', error);
      return null;
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeLeaderboard | null> {
    try {
      return await firebaseApi.challenge.getChallengeLeaderboard(challengeId);
    } catch (error) {
      console.error('Error getting challenge leaderboard:', error);
      return null;
    }
  }

  /**
   * Get challenge progress for a user
   */
  async getChallengeProgress(
    challengeId: string,
    userId: string
  ): Promise<ChallengeProgress | null> {
    try {
      return await firebaseApi.challenge.getChallengeProgress(challengeId, userId);
    } catch (error) {
      console.error('Error getting challenge progress:', error);
      return null;
    }
  }

  /**
   * Get challenge statistics
   */
  async getChallengeStats(challengeId: string): Promise<ChallengeStats | null> {
    try {
      return await firebaseApi.challenge.getChallengeStats(challengeId);
    } catch (error) {
      console.error('Error getting challenge stats:', error);
      return null;
    }
  }

  /**
   * Create a new challenge
   */
  async createChallenge(data: CreateChallengeData): Promise<Challenge> {
    return firebaseApi.challenge.createChallenge(data);
  }

  /**
   * Update a challenge
   */
  async updateChallenge(
    challengeId: string,
    data: UpdateChallengeData
  ): Promise<Challenge> {
    return firebaseApi.challenge.updateChallenge(challengeId, data);
  }

  /**
   * Delete a challenge
   */
  async deleteChallenge(challengeId: string): Promise<void> {
    return firebaseApi.challenge.deleteChallenge(challengeId);
  }

  /**
   * Join a challenge
   */
  async joinChallenge(challengeId: string): Promise<void> {
    return firebaseApi.challenge.joinChallenge(challengeId);
  }

  /**
   * Leave a challenge
   */
  async leaveChallenge(challengeId: string): Promise<void> {
    return firebaseApi.challenge.leaveChallenge(challengeId);
  }
}
