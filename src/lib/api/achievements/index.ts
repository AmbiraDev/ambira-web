/**
 * Achievements API Module
 * Handles achievement definitions and tracking
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Firebase imports
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  serverTimestamp,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import { handleError } from '@/lib/errorHandler';

// Shared utilities
import { convertTimestamp } from '../shared/utils';

// Types
import type {
  AchievementType,
  Achievement,
  AchievementProgress,
  UserAchievementData,
} from '@/types';

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

/**
 * Achievement metadata defining all available achievements
 */
export const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementType,
  { name: string; description: string; icon: string; targetValue?: number }
> = {
  'streak-7': {
    name: '7 Day Streak',
    description: 'Complete sessions for 7 days in a row',
    icon: '🔥',
    targetValue: 7,
  },
  'streak-30': {
    name: '30 Day Streak',
    description: 'Complete sessions for 30 days in a row',
    icon: '🔥',
    targetValue: 30,
  },
  'streak-100': {
    name: '100 Day Streak',
    description: 'Complete sessions for 100 days in a row',
    icon: '🔥',
    targetValue: 100,
  },
  'streak-365': {
    name: 'Year Streak',
    description: 'Complete sessions for 365 days in a row',
    icon: '🔥',
    targetValue: 365,
  },
  'hours-10': {
    name: 'First 10 Hours',
    description: 'Log 10 hours of work',
    icon: '⏱️',
    targetValue: 10,
  },
  'hours-50': {
    name: '50 Hours',
    description: 'Log 50 hours of work',
    icon: '⏱️',
    targetValue: 50,
  },
  'hours-100': {
    name: '100 Hours',
    description: 'Log 100 hours of work',
    icon: '⏱️',
    targetValue: 100,
  },
  'hours-500': {
    name: '500 Hours',
    description: 'Log 500 hours of work',
    icon: '⏱️',
    targetValue: 500,
  },
  'hours-1000': {
    name: '1000 Hours',
    description: 'Log 1000 hours of work',
    icon: '⏱️',
    targetValue: 1000,
  },
  'challenge-complete': {
    name: 'Challenge Complete',
    description: 'Complete a challenge',
    icon: '🏆',
  },
  'challenge-winner': {
    name: 'Challenge Winner',
    description: 'Win a challenge',
    icon: '👑',
  },
  'personal-record-session': {
    name: 'Personal Record',
    description: 'Complete your longest session',
    icon: '🎯',
  },
  'personal-record-day': {
    name: 'Best Day Ever',
    description: 'Complete your most productive day',
    icon: '🌟',
  },
  'early-bird': {
    name: 'Early Bird',
    description: 'Complete a session before 6 AM',
    icon: '🌅',
  },
  'night-owl': {
    name: 'Night Owl',
    description: 'Complete a session after 10 PM',
    icon: '🦉',
  },
  'weekend-warrior': {
    name: 'Weekend Warrior',
    description: 'Complete 10 weekend sessions',
    icon: '💪',
  },
  'consistency-king': {
    name: 'Consistency King',
    description: 'Complete sessions for 30 consecutive days',
    icon: '👑',
  },
};

export const firebaseAchievementApi = {
  // Get user's achievements
  getUserAchievements: async (userId: string): Promise<Achievement[]> => {
    try {
      const achievementsQuery = query(
        collection(db, 'achievements'),
        where('userId', '==', userId),
        orderBy('earnedAt', 'desc')
      );

      const snapshot = await getDocs(achievementsQuery);
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
            earnedAt: convertTimestamp(doc.data().earnedAt),
          }) as Achievement
      );
    } catch (error) {
      const apiError = handleError(error, 'Get achievements', {
        defaultMessage: 'Failed to get achievements',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get achievement progress for all achievement types
  getAchievementProgress: async (
    userId: string
  ): Promise<AchievementProgress[]> => {
    try {
      const [achievements, userData] = await Promise.all([
        firebaseAchievementApi.getUserAchievements(userId),
        firebaseAchievementApi.getUserAchievementData(userId),
      ]);

      const unlockedTypes = new Set(achievements.map(a => a.type));
      const progress: AchievementProgress[] = [];

      // Streak achievements
      const streakAchievements: AchievementType[] = [
        'streak-7',
        'streak-30',
        'streak-100',
        'streak-365',
      ];
      streakAchievements.forEach(type => {
        const def = ACHIEVEMENT_DEFINITIONS[type];
        const isUnlocked = unlockedTypes.has(type);
        const achievement = achievements.find(a => a.type === type);

        progress.push({
          type,
          name: def.name,
          description: def.description,
          icon: def.icon,
          currentValue: userData.currentStreak,
          targetValue: def.targetValue || 0,
          percentage: Math.min(
            100,
            (userData.currentStreak / (def.targetValue || 1)) * 100
          ),
          isUnlocked,
          unlockedAt: achievement?.earnedAt,
        });
      });

      // Hour achievements
      const hourAchievements: AchievementType[] = [
        'hours-10',
        'hours-50',
        'hours-100',
        'hours-500',
        'hours-1000',
      ];
      hourAchievements.forEach(type => {
        const def = ACHIEVEMENT_DEFINITIONS[type];
        const isUnlocked = unlockedTypes.has(type);
        const achievement = achievements.find(a => a.type === type);

        progress.push({
          type,
          name: def.name,
          description: def.description,
          icon: def.icon,
          currentValue: userData.totalHours,
          targetValue: def.targetValue || 0,
          percentage: Math.min(
            100,
            (userData.totalHours / (def.targetValue || 1)) * 100
          ),
          isUnlocked,
          unlockedAt: achievement?.earnedAt,
        });
      });


      return progress;
    } catch (error) {
      const apiError = handleError(error, 'Get achievement progress', {
        defaultMessage: 'Failed to get achievement progress',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get user data for achievement checking
  getUserAchievementData: async (
    userId: string
  ): Promise<UserAchievementData> => {
    try {
      // Dynamic imports to avoid circular dependencies
      const { firebaseStreakApi } = await import('../streaks');
      const { firebaseUserApi } = await import('../users');

      const [streakData, userStats] = await Promise.all([
        firebaseStreakApi.getStreakData(userId),
        firebaseUserApi.getUserStats(userId),
      ]);

      // Get session stats
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        orderBy('duration', 'desc'),
        limitFn(1)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const longestSession = sessionsSnapshot.docs[0]?.data()?.duration || 0;

      return {
        userId,
        totalHours: userStats.totalHours,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        totalSessions: userStats.sessionsThisMonth, // Approximate
        longestSession: Math.floor(longestSession / 60),
        mostHoursInDay: 0, // TODO: Calculate from daily stats
        challengesCompleted: 0, // TODO: Get from challenges
        challengesWon: 0, // TODO: Get from challenges
      };
    } catch (error) {
      const apiError = handleError(error, 'Get user achievement data', {
        defaultMessage: 'Failed to get user achievement data',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Check and award new achievements after session
  checkAchievements: async (
    userId: string,
    sessionId?: string
  ): Promise<Achievement[]> => {
    try {
      const [existingAchievements, userData] = await Promise.all([
        firebaseAchievementApi.getUserAchievements(userId),
        firebaseAchievementApi.getUserAchievementData(userId),
      ]);

      const unlockedTypes = new Set(existingAchievements.map(a => a.type));
      const newAchievements: Achievement[] = [];

      // Check streak achievements
      if (userData.currentStreak >= 7 && !unlockedTypes.has('streak-7')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'streak-7',
            sessionId
          )
        );
      }
      if (userData.currentStreak >= 30 && !unlockedTypes.has('streak-30')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'streak-30',
            sessionId
          )
        );
      }
      if (userData.currentStreak >= 100 && !unlockedTypes.has('streak-100')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'streak-100',
            sessionId
          )
        );
      }
      if (userData.currentStreak >= 365 && !unlockedTypes.has('streak-365')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'streak-365',
            sessionId
          )
        );
      }

      // Check hour achievements
      if (userData.totalHours >= 10 && !unlockedTypes.has('hours-10')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-10',
            sessionId
          )
        );
      }
      if (userData.totalHours >= 50 && !unlockedTypes.has('hours-50')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-50',
            sessionId
          )
        );
      }
      if (userData.totalHours >= 100 && !unlockedTypes.has('hours-100')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-100',
            sessionId
          )
        );
      }
      if (userData.totalHours >= 500 && !unlockedTypes.has('hours-500')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-500',
            sessionId
          )
        );
      }
      if (userData.totalHours >= 1000 && !unlockedTypes.has('hours-1000')) {
        newAchievements.push(
          await firebaseAchievementApi.awardAchievement(
            userId,
            'hours-1000',
            sessionId
          )
        );
      }


      // Check time-based achievements if recent session provided
      if (userData.recentSession) {
        const sessionHour = userData.recentSession.startTime.getHours();

        if (sessionHour < 6 && !unlockedTypes.has('early-bird')) {
          newAchievements.push(
            await firebaseAchievementApi.awardAchievement(
              userId,
              'early-bird',
              sessionId
            )
          );
        }

        if (sessionHour >= 22 && !unlockedTypes.has('night-owl')) {
          newAchievements.push(
            await firebaseAchievementApi.awardAchievement(
              userId,
              'night-owl',
              sessionId
            )
          );
        }
      }

      return newAchievements;
    } catch (error) {
      const apiError = handleError(error, 'Check achievements', {
        defaultMessage: 'Failed to check achievements',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Award an achievement
  awardAchievement: async (
    userId: string,
    type: AchievementType,
    sessionId?: string
  ): Promise<Achievement> => {
    try {
      const def = ACHIEVEMENT_DEFINITIONS[type];
      const achievementData = {
        userId,
        type,
        name: def.name,
        description: def.description,
        icon: def.icon,
        earnedAt: serverTimestamp(),
        sessionId: sessionId || null,
        isShared: false,
      };

      const docRef = await addDoc(
        collection(db, 'achievements'),
        achievementData
      );

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You earned the "${def.name}" achievement!`,
        linkUrl: `/profile/${userId}?tab=achievements`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...achievementData,
        earnedAt: new Date(),
      } as Achievement;
    } catch (error) {
      const apiError = handleError(error, 'Award achievement', {
        defaultMessage: 'Failed to award achievement',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Share achievement to feed
  shareAchievement: async (achievementId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const achievementDoc = await getDoc(
        doc(db, 'achievements', achievementId)
      );
      if (!achievementDoc.exists()) {
        throw new Error('Achievement not found');
      }

      const achievement = achievementDoc.data() as Achievement;
      if (achievement.userId !== auth.currentUser.uid) {
        throw new Error('Unauthorized');
      }

      // Create a post about the achievement
      await addDoc(collection(db, 'posts'), {
        userId: auth.currentUser.uid,
        type: 'achievement',
        content: `Just unlocked the "${achievement.name}" achievement! ${achievement.icon}`,
        achievementId,
        visibility: 'everyone',
        supportCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Mark achievement as shared
      await updateDoc(doc(db, 'achievements', achievementId), {
        isShared: true,
      });
    } catch (error) {
      const apiError = handleError(error, 'Share achievement', {
        defaultMessage: 'Failed to share achievement',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Firebase Notification API
