import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { firebaseApi } from './firebaseApi';
import { Session, Achievement } from '@/types';

export const useSessionCompletion = () => {
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const completeSession = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // 4. Invalidate caches to refresh UI immediately
      // Use partial key matching to invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ['user', 'sessions', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', 'stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['streak', userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'feed'] });

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
