/**
 * Streaks API Module
 * Handles streak tracking and calculations
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
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  addDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import { handleError, isPermissionError } from '@/lib/errorHandler';

// Shared utilities
import { convertTimestamp } from '../shared/utils';

// Types
import type { _User, StreakData, StreakStats } from '@/types';

// ============================================================================
// PUBLIC API
// ============================================================================

export const firebaseStreakApi = {
  /**
   * Get streak data for a user, initializing if it doesn't exist
   *
   * @param userId - The user ID whose streak data to retrieve
   * @returns Promise resolving to the user's streak data (returns empty streak on permission errors)
   */
  getStreakData: async (userId: string): Promise<StreakData> => {
    try {
      const streakDoc = await getDoc(doc(db, 'streaks', userId));

      if (!streakDoc.exists()) {
        // Initialize streak data if it doesn't exist
        const initialStreak: StreakData = {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(0),
          totalStreakDays: 0,
          streakHistory: [],
          isPublic: true,
        };

        // Try to create the document, but if permission is denied (viewing another user's profile),
        // just return the initial streak without creating it
        try {
          await setDoc(doc(db, 'streaks', userId), {
            ...initialStreak,
            lastActivityDate: Timestamp.fromDate(
              initialStreak.lastActivityDate
            ),
          });
        } catch (createError) {
          // If we can't create (permission denied), just return the empty streak
          if (isPermissionError(createError)) {
            return initialStreak;
          }
          throw createError;
        }

        return initialStreak;
      }

      const data = streakDoc.data();
      return {
        userId: data.userId,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        lastActivityDate: convertTimestamp(data.lastActivityDate),
        totalStreakDays: data.totalStreakDays || 0,
        streakHistory: data.streakHistory || [],
        isPublic: data.isPublic !== false,
      };
    } catch (error) {
      // Handle permission errors gracefully - return empty streak
      if (isPermissionError(error)) {
        return {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(0),
          totalStreakDays: 0,
          streakHistory: [],
          isPublic: true,
        };
      }

      const apiError = handleError(error, 'Get streak data', {
        defaultMessage: 'Failed to get streak data',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Calculate real-time streak statistics from actual session data
   * Computes current streak, longest streak, and risk status
   *
   * @param userId - The user ID whose streak stats to calculate
   * @returns Promise resolving to calculated streak statistics
   * @throws Error if fetch or calculation fails
   */
  getStreakStats: async (userId: string): Promise<StreakStats> => {
    try {
      // Fetch sessions to calculate actual streak from data
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        orderBy('startTime', 'desc'),
        limitFn(365) // Get last year of sessions
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        startTime: convertTimestamp(doc.data().startTime),
      }));

      // Group sessions by day (YYYY-MM-DD)
      const sessionsByDay = new Map<string, boolean>();
      sessions.forEach(session => {
        const date = new Date(session.startTime);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        sessionsByDay.set(dayKey, true);
      });

      // Calculate current streak by going backwards from today
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let currentStreak = 0;
      const checkDate = new Date(today);
      let lastActivityDate: Date | null = null;

      // Start checking from today, going backwards
      for (let i = 0; i < 365; i++) {
        const dayKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        const hasSession = sessionsByDay.has(dayKey);

        if (i === 0) {
          // Today - if no session, start checking from yesterday
          if (hasSession) {
            currentStreak = 1;
            lastActivityDate = new Date(checkDate);
          } else {
          }
        } else {
          // Previous days
          if (hasSession) {
            currentStreak++;
            if (!lastActivityDate) {
              lastActivityDate = new Date(checkDate);
            }
          } else {
            // Gap found - stop counting
            break;
          }
        }

        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Calculate longest streak and total days
      const sortedDays = Array.from(sessionsByDay.keys()).sort();
      let longestStreak = 0;
      let tempStreak = 0;
      let prevDate: Date | null = null;

      sortedDays.forEach((dayKey, index) => {
        const [year, month, day] = dayKey.split('-').map(Number);
        if (year === undefined || month === undefined || day === undefined) {
          throw new Error(`Invalid date format in dayKey: ${dayKey}`);
        }
        const currentDate = new Date(year, month - 1, day);

        if (!prevDate) {
          // First day
          tempStreak = 1;
        } else {
          const daysDiff = Math.floor(
            (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff === 1) {
            // Consecutive day
            tempStreak++;
          } else {
            // Gap - reset streak
            tempStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        prevDate = currentDate;
      });

      const totalStreakDays = sessionsByDay.size;

      // Determine if streak is at risk
      const daysSinceActivity = lastActivityDate
        ? Math.floor(
            (today.getTime() - lastActivityDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;
      const streakAtRisk = currentStreak > 0 && daysSinceActivity >= 1;

      // Calculate next milestone
      const milestones = [7, 30, 100, 365, 500, 1000];
      const nextMilestone =
        milestones.find(m => m > currentStreak) ||
        milestones[milestones.length - 1] ||
        1000; // Fallback to 1000 if array is empty

      const result: StreakStats = {
        currentStreak,
        longestStreak,
        totalStreakDays,
        lastActivityDate,
        streakAtRisk,
        nextMilestone,
      };

      return result;
    } catch (error) {
      console.error('=== FIREBASE API: Error in getStreakStats ===', error);
      const apiError = handleError(error, 'Get streak stats', {
        defaultMessage: 'Failed to get streak stats',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Update streak data after a session is completed
   * Handles consecutive days, streak breaks, and history tracking
   *
   * @param userId - The user ID whose streak to update
   * @param sessionDate - The date of the completed session
   * @returns Promise resolving to the updated streak data
   * @throws Error if update fails
   */
  updateStreak: async (
    userId: string,
    sessionDate: Date
  ): Promise<StreakData> => {
    try {
      const streakData = await firebaseStreakApi.getStreakData(userId);

      const sessionDay = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate()
      );
      const lastActivityDay = new Date(
        streakData.lastActivityDate.getFullYear(),
        streakData.lastActivityDate.getMonth(),
        streakData.lastActivityDate.getDate()
      );

      const daysDiff = Math.floor(
        (sessionDay.getTime() - lastActivityDay.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let newCurrentStreak = streakData.currentStreak;
      let newLongestStreak = streakData.longestStreak;
      let newTotalStreakDays = streakData.totalStreakDays;

      // Special case: If current streak is 0 (first session ever or after long break)
      // Check if this is truly the first session or if we're restarting
      const isFirstEverSession =
        streakData.currentStreak === 0 && streakData.totalStreakDays === 0;
      const isRestartingStreak =
        streakData.currentStreak === 0 && streakData.totalStreakDays > 0;

      if (isFirstEverSession || isRestartingStreak) {
        // First session or restarting - start streak at 1
        if (isFirstEverSession) {
          newTotalStreakDays = 1;
        } else {
          newTotalStreakDays += 1;
        }
        newCurrentStreak = 1;
        newLongestStreak = Math.max(1, newLongestStreak);
      } else if (daysDiff === 0) {
        // Same day, no change to streak
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newCurrentStreak += 1;
        newTotalStreakDays += 1;
        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }
      } else if (daysDiff > 1) {
        // Streak broken, reset to 1
        newCurrentStreak = 1;
        newTotalStreakDays += 1;
      } else if (daysDiff < 0) {
        // Session is in the past before last activity
      }

      // Update streak history (keep last 365 days)
      const dateStr = sessionDay.toISOString().split('T')[0];
      if (!dateStr) {
        throw new Error('Invalid date format');
      }
      const existingDayIndex = streakData.streakHistory.findIndex(
        d => d.date === dateStr
      );

      let newHistory = [...streakData.streakHistory];
      if (existingDayIndex >= 0) {
        const existingDay = newHistory[existingDayIndex];
        if (existingDay) {
          existingDay.sessionCount += 1;
        }
      } else {
        newHistory.push({
          date: dateStr,
          hasActivity: true,
          sessionCount: 1,
          totalMinutes: 0,
        });
      }

      // Keep only last 365 days
      newHistory = newHistory.slice(-365);

      const updatedStreak: StreakData = {
        ...streakData,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: sessionDate,
        totalStreakDays: newTotalStreakDays,
        streakHistory: newHistory,
      };

      await setDoc(doc(db, 'streaks', userId), {
        ...updatedStreak,
        lastActivityDate: Timestamp.fromDate(sessionDate),
      });

      return updatedStreak;
    } catch (error) {
      const apiError = handleError(error, 'Update streak', {
        defaultMessage: 'Failed to update streak',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Toggle the visibility of a user's streak (public/private)
   *
   * @param userId - The user ID whose streak visibility to toggle
   * @returns Promise resolving to the new visibility state (true = public, false = private)
   * @throws Error if user is not authorized or toggle fails
   */
  toggleStreakVisibility: async (userId: string): Promise<boolean> => {
    try {
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('Unauthorized');
      }

      const streakData = await firebaseStreakApi.getStreakData(userId);
      const newVisibility = !streakData.isPublic;

      await updateDoc(doc(db, 'streaks', userId), {
        isPublic: newVisibility,
      });

      return newVisibility;
    } catch (error) {
      const apiError = handleError(error, 'Toggle streak visibility', {
        defaultMessage: 'Failed to toggle streak visibility',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Update the visibility of a user's streak to a specific value
   *
   * @param userId - The user ID whose streak visibility to update
   * @param isPublic - Whether the streak should be public
   * @returns Promise that resolves when visibility is updated
   * @throws Error if user is not authorized or update fails
   */
  updateStreakVisibility: async (
    userId: string,
    isPublic: boolean
  ): Promise<void> => {
    try {
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('Unauthorized');
      }

      await updateDoc(doc(db, 'streaks', userId), {
        isPublic,
      });
    } catch (error) {
      const apiError = handleError(error, 'Update streak visibility', {
        defaultMessage: 'Failed to update streak visibility',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Admin function: Restore a user's streak to a specific value
   * TODO: Add admin permission check
   *
   * @param userId - The user ID whose streak to restore
   * @param streakValue - The streak value to restore to
   * @returns Promise that resolves when the streak is restored
   * @throws Error if user is not authenticated or restore fails
   */
  restoreStreak: async (userId: string, streakValue: number): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('Unauthorized');
      }

      // TODO: Add admin check

      await updateDoc(doc(db, 'streaks', userId), {
        currentStreak: streakValue,
        lastActivityDate: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      const apiError = handleError(error, 'Restore streak', {
        defaultMessage: 'Failed to restore streak',
      });
      throw new Error(apiError.userMessage);
    }
  },
};
