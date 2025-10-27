/**
 * Challenge Scheduler Utilities
 * Functions to check for challenges that need notifications
 */

import { firebaseChallengeApi, challengeNotifications } from './api';

/**
 * Check for challenges ending soon and send notifications
 * This should be called daily (e.g., via a cron job or scheduled function)
 */
export async function checkChallengesEndingSoon(): Promise<void> {
  try {
    // Get all active challenges
    const challenges = await firebaseChallengeApi.getChallenges({
      status: 'active',
    });

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    for (const challenge of challenges) {
      const endDate = new Date(challenge.endDate);

      // Check if challenge ends within 1-2 days
      if (endDate > oneDayFromNow && endDate <= twoDaysFromNow) {
        const daysRemaining = Math.ceil(
          (endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        await challengeNotifications.notifyEndingSoon(
          challenge.id,
          challenge.name,
          daysRemaining
        );
      }
    }
  } catch (_error) {
    console.error('Error checking challenges ending soon:', error);
  }
}

/**
 * Check for rank changes in challenges and send notifications
 * This should be called after challenge progress updates
 */
export async function checkRankChanges(challengeId: string): Promise<void> {
  try {
    // Get current leaderboard
    const _leaderboard =
      await firebaseChallengeApi.getChallengeLeaderboard(challengeId);

    // For now, we'll skip rank change notifications as they require storing previous ranks
    // This could be implemented with a separate collection to track rank history
  } catch (_error) {
    console.error('Error checking rank changes:', error);
  }
}

/**
 * Manual function to test notifications
 * This can be called from the browser console for testing
 */
export async function testChallengeNotifications(
  challengeId: string,
  userId: string
): Promise<void> {
  try {
    // Test completion notification
    await challengeNotifications.notifyCompletion(
      challengeId,
      userId,
      'Test Challenge',
      'hours'
    );

    // Test milestone notification
    await challengeNotifications.notifyMilestone(
      challengeId,
      userId,
      'Test Challenge',
      25,
      100
    );
  } catch (_error) {
    console.error('Error sending test notifications:', error);
  }
}
