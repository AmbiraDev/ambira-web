import { useState } from 'react';
import { firebaseApi } from './firebaseApi';
import { Session, Achievement } from '@/types';

export const useSessionCompletion = () => {
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const completeSession = async (
    sessionData: any,
    userId: string
  ): Promise<{ session: Session; achievements: Achievement[] }> => {
    setIsProcessing(true);
    try {
      // 1. Create the session
      const session = await firebaseApi.session.createSession(sessionData);

      // 2. Update streak
      await firebaseApi.streak.updateStreak(userId, session.startTime);

      // 3. Check for new achievements
      const achievements = await firebaseApi.achievement.checkAchievements(
        userId,
        session.id
      );

      setNewAchievements(achievements);

      return { session, achievements };
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAchievements = () => {
    setNewAchievements([]);
  };

  return {
    completeSession,
    newAchievements,
    clearAchievements,
    isProcessing
  };
};
