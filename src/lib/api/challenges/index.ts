/**
 * Challenges API Module
 * Handles challenge system: CRUD operations, participants, leaderboards, progress tracking
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
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import { handleError } from '@/lib/errorHandler';

// Error messages
import { ERROR_MESSAGES } from '@/config/errorMessages';

// Shared utilities
import { convertTimestamp, removeUndefinedFields } from '../shared/utils';

// Types
import type {
  Challenge,
  CreateChallengeData,
  UpdateChallengeData,
  ChallengeFilters,
  ChallengeProgress,
  ChallengeLeaderboard,
  ChallengeLeaderboardEntry,
  ChallengeStats,
} from '@/types';

// ============================================================================
// PUBLIC API
// ============================================================================

export const firebaseChallengeApi = {
  // Create a new challenge (group admins only)
  createChallenge: async (data: CreateChallengeData): Promise<Challenge> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // If groupId is provided, verify user is admin
      if (data.groupId) {
        const groupDoc = await getDoc(doc(db, 'groups', data.groupId));
        if (!groupDoc.exists()) {
          throw new Error('Group not found');
        }
        const groupData = groupDoc.data();
        if (!groupData.adminUserIds.includes(auth.currentUser.uid)) {
          throw new Error('Only group admins can create challenges');
        }
      }

      const challengeData = {
        ...data,
        createdByUserId: auth.currentUser.uid,
        participantCount: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'challenges'), challengeData);

      return {
        id: docRef.id,
        ...data,
        createdByUserId: auth.currentUser.uid,
        participantCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (_error) {
      const apiError = handleError(error, 'Create challenge', {
        defaultMessage: ERROR_MESSAGES.UNKNOWN_ERROR,
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get challenge by ID
  getChallenge: async (challengeId: string): Promise<Challenge> => {
    try {
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));

      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const data = challengeDoc.data();
      return {
        id: challengeDoc.id,
        groupId: data.groupId,
        name: data.name,
        description: data.description,
        type: data.type,
        goalValue: data.goalValue,
        startDate: convertTimestamp(data.startDate),
        endDate: convertTimestamp(data.endDate),
        participantCount: data.participantCount || 0,
        createdByUserId: data.createdByUserId,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        rules: data.rules,
        projectIds: data.projectIds,
        isActive: data.isActive !== false,
        rewards: data.rewards,
      };
    } catch (_error) {
      const apiError = handleError(error, 'Get challenge', {
        defaultMessage: ERROR_MESSAGES.CHALLENGE_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get challenges with filters
  getChallenges: async (
    filters: ChallengeFilters = {}
  ): Promise<Challenge[]> => {
    try {
      // Start with a simple query to avoid complex index requirements
      let challengesQuery = query(
        collection(db, 'challenges'),
        orderBy('createdAt', 'desc')
      );

      // Apply simple filters first
      if (filters.groupId) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('groupId', '==', filters.groupId),
          orderBy('createdAt', 'desc')
        );
      } else if (filters.type) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('type', '==', filters.type),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(challengesQuery);
      const challenges: Challenge[] = [];
      const now = new Date();

      for (const challengeDoc of snapshot.docs) {
        const data = challengeDoc.data();

        // Apply client-side filtering for complex conditions
        const startDate = convertTimestamp(data.startDate);
        const endDate = convertTimestamp(data.endDate);
        const isActive = data.isActive !== false;

        // Filter by status (client-side to avoid complex queries)
        if (filters.status === 'active') {
          if (!(now >= startDate && now <= endDate && isActive)) {
            continue;
          }
        } else if (filters.status === 'upcoming') {
          if (!(now < startDate && isActive)) {
            continue;
          }
        } else if (filters.status === 'completed') {
          if (!(now > endDate || !isActive)) {
            continue;
          }
        }

        // Filter by type (if not already filtered at query level)
        if (filters.type && !filters.groupId && data.type !== filters.type) {
          continue;
        }

        // If filtering by participation, check if current user is participating
        if (filters.isParticipating && auth.currentUser) {
          try {
            const participantDoc = await getDoc(
              doc(
                db,
                'challengeParticipants',
                `${auth.currentUser.uid}_${challengeDoc.id}`
              )
            );
            if (!participantDoc.exists()) {
              continue;
            }
          } catch (_error) {
            // If we can't check participation, skip this challenge
            handleError(
              error,
              `Check participation for challenge ${challengeDoc.id}`,
              { severity: ErrorSeverity.WARNING }
            );
            continue;
          }
        }

        challenges.push({
          id: challengeDoc.id,
          groupId: data.groupId,
          name: data.name,
          description: data.description,
          type: data.type,
          goalValue: data.goalValue,
          startDate,
          endDate,
          participantCount: data.participantCount || 0,
          createdByUserId: data.createdByUserId,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          rules: data.rules,
          projectIds: data.projectIds,
          isActive,
          rewards: data.rewards,
        });
      }

      return challenges;
    } catch (_error) {
      handleError(error, 'in getChallenges', { severity: ErrorSeverity.ERROR });
      const apiError = handleError(error, 'Get challenges', {
        defaultMessage: ERROR_MESSAGES.CHALLENGE_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Join a challenge
  joinChallenge: async (challengeId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const participantId = `${auth.currentUser.uid}_${challengeId}`;

      // Check if already participating
      const existingParticipant = await getDoc(
        doc(db, 'challengeParticipants', participantId)
      );
      if (existingParticipant.exists()) {
        throw new Error('Already participating in this challenge');
      }

      // Check if challenge exists and is active
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challengeData = challengeDoc.data();
      const now = new Date();
      const _startDate = convertTimestamp(challengeData.startDate);
      const endDate = convertTimestamp(challengeData.endDate);

      if (!challengeData.isActive) {
        throw new Error('Challenge is not active');
      }
      if (now > endDate) {
        throw new Error('Challenge has ended');
      }

      const batch = writeBatch(db);

      // Add participant
      batch.set(doc(db, 'challengeParticipants', participantId), {
        challengeId,
        userId: auth.currentUser.uid,
        joinedAt: serverTimestamp(),
        progress: 0,
        isCompleted: false,
      });

      // Update participant count
      batch.update(doc(db, 'challenges', challengeId), {
        participantCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (_error) {
      const apiError = handleError(error, 'Join challenge', {
        defaultMessage: ERROR_MESSAGES.CHALLENGE_JOIN_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Leave a challenge
  leaveChallenge: async (challengeId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const participantId = `${auth.currentUser.uid}_${challengeId}`;

      // Check if participating
      const participantDoc = await getDoc(
        doc(db, 'challengeParticipants', participantId)
      );
      if (!participantDoc.exists()) {
        throw new Error('Not participating in this challenge');
      }

      const batch = writeBatch(db);

      // Remove participant
      batch.delete(doc(db, 'challengeParticipants', participantId));

      // Update participant count
      batch.update(doc(db, 'challenges', challengeId), {
        participantCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (_error) {
      const apiError = handleError(error, 'Leave challenge', {
        defaultMessage: ERROR_MESSAGES.CHALLENGE_LEAVE_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get challenge leaderboard
  getChallengeLeaderboard: async (
    challengeId: string
  ): Promise<ChallengeLeaderboard> => {
    try {
      // Get all participants for this challenge
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId),
        orderBy('progress', 'desc')
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const entries: ChallengeLeaderboardEntry[] = [];

      let rank = 1;
      for (const participantDoc of participantsSnapshot.docs) {
        const participantData = participantDoc.data();

        // Get user data
        try {
          const userDoc = await getDoc(
            doc(db, 'users', participantData.userId)
          );
          const userData = userDoc.data();

          if (userData) {
            entries.push({
              userId: participantData.userId,
              user: {
                id: participantData.userId,
                email: userData.email || '',
                name: userData.name || 'Unknown User',
                username: userData.username || 'unknown',
                bio: userData.bio,
                location: userData.location,
                profilePicture: userData.profilePicture,
                createdAt: convertTimestamp(userData.createdAt) || new Date(),
                updatedAt: convertTimestamp(userData.updatedAt) || new Date(),
              },
              progress: participantData.progress || 0,
              rank,
              isCompleted: participantData.isCompleted || false,
              completedAt: participantData.completedAt
                ? convertTimestamp(participantData.completedAt)
                : undefined,
            });
            rank++;
          }
        } catch (_error) {
          handleError(
            error,
            `Load user data for participant ${participantData.userId}`,
            { severity: ErrorSeverity.WARNING }
          );
        }
      }

      return {
        challengeId,
        entries,
        lastUpdated: new Date(),
      };
    } catch (_error) {
      const apiError = handleError(error, 'Get challenge leaderboard', {
        defaultMessage: ERROR_MESSAGES.CHALLENGE_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get user's progress in a challenge
  getChallengeProgress: async (
    challengeId: string,
    userId?: string
  ): Promise<ChallengeProgress | null> => {
    try {
      const targetUserId = userId || auth.currentUser?.uid;
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const participantId = `${targetUserId}_${challengeId}`;
      const participantDoc = await getDoc(
        doc(db, 'challengeParticipants', participantId)
      );

      if (!participantDoc.exists()) {
        return null;
      }

      const participantData = participantDoc.data();
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      const challengeData = challengeDoc.data();

      // Calculate percentage based on challenge type and goal
      let percentage = 0;
      if (challengeData?.goalValue && participantData.progress) {
        percentage = Math.min(
          (participantData.progress / challengeData.goalValue) * 100,
          100
        );
      }

      // Get rank by counting participants with higher progress
      const higherProgressQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId),
        where('progress', '>', participantData.progress || 0)
      );
      const higherProgressSnapshot = await getDocs(higherProgressQuery);
      const rank = higherProgressSnapshot.size + 1;

      return {
        challengeId,
        userId: targetUserId,
        currentValue: participantData.progress || 0,
        targetValue: challengeData?.goalValue,
        percentage,
        rank,
        isCompleted: participantData.isCompleted || false,
        lastUpdated: convertTimestamp(participantData.updatedAt) || new Date(),
      };
    } catch (_error) {
      const apiError = handleError(error, 'Get challenge progress', {
        defaultMessage: ERROR_MESSAGES.CHALLENGE_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update challenge progress (called when sessions are logged)
  updateChallengeProgress: async (
    userId: string,
    sessionData: unknown
  ): Promise<void> => {
    try {
      // Get all active challenges the user is participating in
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('userId', '==', userId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const batch = writeBatch(db);

      for (const participantDoc of participantsSnapshot.docs) {
        const participantData = participantDoc.data();
        const challengeId = participantData.challengeId;

        // Get challenge details
        const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
        if (!challengeDoc.exists()) continue;

        const challengeData = challengeDoc.data();
        const _now = new Date();
        const startDate = convertTimestamp(challengeData.startDate);
        const endDate = convertTimestamp(challengeData.endDate);
        const sessionStart = convertTimestamp(sessionData.startTime);

        // Skip if challenge is not active or session is outside challenge period
        if (
          !challengeData.isActive ||
          sessionStart < startDate ||
          sessionStart > endDate
        ) {
          continue;
        }

        // Skip if challenge has specific projects and session project is not included
        if (challengeData.projectIds && challengeData.projectIds.length > 0) {
          if (!challengeData.projectIds.includes(sessionData.projectId)) {
            continue;
          }
        }

        // Calculate progress increment based on challenge type
        let progressIncrement = 0;
        switch (challengeData.type) {
          case 'most-activity':
            progressIncrement = sessionData.duration / 3600; // Convert seconds to hours
            break;
          case 'fastest-effort':
            // Duration-based effort (tasks are deprecated)
            // Using session duration as a proxy for effort
            const hours = sessionData.duration / 3600;
            if (hours > 0) {
              // For fastest-effort, track the longest single session duration
              if (hours > (participantData.progress || 0)) {
                progressIncrement = hours - (participantData.progress || 0);
              }
            }
            break;
          case 'longest-session':
            // Update if this session is longer than current best
            const sessionHours = sessionData.duration / 3600;
            if (sessionHours > (participantData.progress || 0)) {
              progressIncrement =
                sessionHours - (participantData.progress || 0);
            }
            break;
          case 'group-goal':
            progressIncrement = sessionData.duration / 3600; // Contribute hours to group goal
            break;
        }

        if (progressIncrement > 0) {
          const newProgress =
            (participantData.progress || 0) + progressIncrement;
          const isCompleted = challengeData.goalValue
            ? newProgress >= challengeData.goalValue
            : false;

          const updateData: unknown = {
            progress: newProgress,
            updatedAt: serverTimestamp(),
          };

          if (isCompleted && !participantData.isCompleted) {
            updateData.isCompleted = true;
            updateData.completedAt = serverTimestamp();
          }

          batch.update(participantDoc.ref, updateData);
        }
      }

      await batch.commit();
    } catch (_error) {
      handleError(error, 'update challenge progress', {
        severity: ErrorSeverity.ERROR,
      });
      // Don't throw error to avoid breaking session creation
    }
  },

  // Get challenge statistics
  getChallengeStats: async (challengeId: string): Promise<ChallengeStats> => {
    try {
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challengeData = challengeDoc.data();
      const endDate = convertTimestamp(challengeData.endDate);
      const now = new Date();
      const timeRemaining = Math.max(0, endDate.getTime() - now.getTime());
      const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

      // Get all participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const totalParticipants = participantsSnapshot.size;
      let completedParticipants = 0;
      let totalProgress = 0;

      participantsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.isCompleted) {
          completedParticipants++;
        }
        totalProgress += data.progress || 0;
      });

      const averageProgress =
        totalParticipants > 0 ? totalProgress / totalParticipants : 0;

      // Get top performers (top 3)
      const leaderboard =
        await firebaseChallengeApi.getChallengeLeaderboard(challengeId);
      const topPerformers = leaderboard.entries.slice(0, 3);

      return {
        totalParticipants,
        completedParticipants,
        averageProgress,
        topPerformers,
        timeRemaining: Math.floor(timeRemaining / 1000), // Convert to seconds
        daysRemaining,
      };
    } catch (_error) {
      const apiError = handleError(error, 'Get challenge stats', {
        defaultMessage: 'Failed to get challenge stats',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update challenge (admin only)
  updateChallenge: async (
    challengeId: string,
    data: UpdateChallengeData
  ): Promise<Challenge> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challengeData = challengeDoc.data();

      // Check if user is admin (challenge creator or group admin)
      let isAdmin = challengeData.createdByUserId === auth.currentUser.uid;

      if (!isAdmin && challengeData.groupId) {
        const groupDoc = await getDoc(doc(db, 'groups', challengeData.groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          isAdmin = groupData.adminUserIds.includes(auth.currentUser.uid);
        }
      }

      if (!isAdmin) {
        throw new Error(
          'Only challenge creators or group admins can update challenges'
        );
      }

      const updateData = removeUndefinedFields({
        ...data,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'challenges', challengeId), updateData);

      // Return updated challenge
      return await firebaseChallengeApi.getChallenge(challengeId);
    } catch (_error) {
      const apiError = handleError(error, 'Update challenge', {
        defaultMessage: 'Failed to update challenge',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Delete challenge (admin only)
  deleteChallenge: async (challengeId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challengeData = challengeDoc.data();

      // Check if user is admin
      let isAdmin = challengeData.createdByUserId === auth.currentUser.uid;

      if (!isAdmin && challengeData.groupId) {
        const groupDoc = await getDoc(doc(db, 'groups', challengeData.groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          isAdmin = groupData.adminUserIds.includes(auth.currentUser.uid);
        }
      }

      if (!isAdmin) {
        throw new Error(
          'Only challenge creators or group admins can delete challenges'
        );
      }

      const batch = writeBatch(db);

      // Delete challenge
      batch.delete(doc(db, 'challenges', challengeId));

      // Delete all participants
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('challengeId', '==', challengeId)
      );
      const participantsSnapshot = await getDocs(participantsQuery);

      participantsSnapshot.forEach(participantDoc => {
        batch.delete(participantDoc.ref);
      });

      await batch.commit();
    } catch (_error) {
      const apiError = handleError(error, 'Delete challenge', {
        defaultMessage: 'Failed to delete challenge',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Search challenges with filters and limitFn
  searchChallenges: async (
    filters: ChallengeFilters = {},
    limitCount: number = 50
  ): Promise<Challenge[]> => {
    try {
      // Use getChallenges but apply limitFn
      let challengesQuery = query(
        collection(db, 'challenges'),
        orderBy('createdAt', 'desc'),
        limitFn(limitCount)
      );

      // Apply simple filters
      if (filters.groupId) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('groupId', '==', filters.groupId),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount)
        );
      } else if (filters.type) {
        challengesQuery = query(
          collection(db, 'challenges'),
          where('type', '==', filters.type),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount)
        );
      }

      const snapshot = await getDocs(challengesQuery);
      const challenges: Challenge[] = [];
      const now = new Date();

      for (const challengeDoc of snapshot.docs) {
        const data = challengeDoc.data();

        // Apply client-side filtering for complex conditions
        const startDate = convertTimestamp(data.startDate);
        const endDate = convertTimestamp(data.endDate);
        const isActive = data.isActive !== false;

        // Filter by status (client-side)
        if (filters.status === 'active') {
          if (!(now >= startDate && now <= endDate && isActive)) {
            continue;
          }
        } else if (filters.status === 'upcoming') {
          if (!(now < startDate && isActive)) {
            continue;
          }
        } else if (filters.status === 'completed') {
          if (!(now > endDate || !isActive)) {
            continue;
          }
        }

        challenges.push({
          id: challengeDoc.id,
          groupId: data.groupId,
          name: data.name,
          description: data.description,
          type: data.type,
          goalValue: data.goalValue,
          startDate,
          endDate,
          participantCount: data.participantCount || 0,
          createdByUserId: data.createdByUserId,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          rules: data.rules,
          projectIds: data.projectIds,
          isActive,
          rewards: data.rewards,
          category: data.category,
        });
      }

      return challenges;
    } catch (_error) {
      handleError(error, 'in searchChallenges', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Search challenges', {
        defaultMessage: 'Failed to search challenges',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get challenges that a user is participating in
  getUserChallenges: async (userId: string): Promise<Challenge[]> => {
    try {
      // Get all challenge participations for this user
      const participantsQuery = query(
        collection(db, 'challengeParticipants'),
        where('userId', '==', userId)
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const challenges: Challenge[] = [];

      // Fetch each challenge
      for (const participantDoc of participantsSnapshot.docs) {
        const participantData = participantDoc.data();
        const challengeId = participantData.challengeId;

        try {
          const challenge =
            await firebaseChallengeApi.getChallenge(challengeId);
          challenges.push(challenge);
        } catch (_error) {
          handleError(error, `Load challenge ${challengeId}`, {
            severity: ErrorSeverity.WARNING,
          });
        }
      }

      // Sort by most recent first
      challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return challenges;
    } catch (_error) {
      const apiError = handleError(error, 'Get user challenges', {
        defaultMessage: 'Failed to get user challenges',
      });
      throw new Error(apiError.userMessage);
    }
  },
};
