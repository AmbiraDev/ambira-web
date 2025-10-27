/**
 * Posts API Module (LEGACY)
 *
 * ⚠️ DEPRECATED: Posts are now sessions. This module exists for backward compatibility only.
 *
 * Sessions ARE the primary content type, not posts. All post operations
 * delegate to session operations.
 *
 * @deprecated Use firebaseSessionApi instead
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
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  startAfter,
  serverTimestamp,
  runTransaction,
  onSnapshot,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import {
  handleError,
  ErrorSeverity,
  isPermissionError,
} from '@/lib/errorHandler';

// Shared utilities
import { convertTimestamp, _removeUndefinedFields } from '../shared/utils';

// Session helpers
import { populateSessionsWithDetails } from './helpers';

// Rate limiting
import { checkRateLimit } from '@/lib/rateLimit';

// Types
import type {
  Post,
  PostWithDetails,
  CreatePostData,
  UpdatePostData,
  FeedResponse,
  FeedFilters,
  Session,
} from '@/types';

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

const _processPosts = async (
  postDocs: DocumentSnapshot[]
): Promise<PostWithDetails[]> => {
  const posts: PostWithDetails[] = [];
  const batchSize = 10;

  for (let i = 0; i < postDocs.length; i += batchSize) {
    const batch = postDocs.slice(i, i + batchSize);
    const batchPromises = batch.map(async postDoc => {
      const postData = postDoc.data();

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', postData.userId));
      const userData = userDoc.data();

      // Get session data
      const sessionDoc = await getDoc(doc(db, 'sessions', postData.sessionId));
      const sessionData = sessionDoc.data();

      // Get project data
      const projectId = sessionData?.projectId;
      if (projectId) {
        try {
          const projectDoc = await getDoc(
            doc(db, 'projects', postData.userId, 'userProjects', projectId)
          );
          if (projectDoc.exists()) {
            // projectData is available if needed
          }
        } catch (_error) {
          handleError(error, `Fetch project ${projectId}`, {
            severity: ErrorSeverity.WARNING,
          });
        }
      }

      // Check if current user has supported this post
      const supportDoc = auth.currentUser
        ? await getDoc(
            doc(db, 'postSupports', `${auth.currentUser.uid}_${postDoc.id}`)
          )
        : null;
      const isSupported = supportDoc?.exists() || false;

      // Build the post with full details
      const post: PostWithDetails = {
        id: postDoc.id,
        sessionId: postData.sessionId,
        userId: postData.userId,
        content: postData.content,
        supportCount: postData.supportCount || 0,
        commentCount: postData.commentCount || 0,
        isSupported,
        visibility: postData.visibility || 'everyone',
        createdAt: convertTimestamp(postData.createdAt),
        updatedAt: convertTimestamp(postData.updatedAt),
        user: {
          id: postData.userId,
          email: userData?.email || '',
          name: userData?.name || 'Unknown User',
          username: userData?.username || 'unknown',
          bio: userData?.bio,
          location: userData?.location,
          profilePicture: userData?.profilePicture,
          createdAt: convertTimestamp(userData?.createdAt) || new Date(),
          updatedAt: convertTimestamp(userData?.updatedAt) || new Date(),
        },
        session: sessionData
          ? {
              id: postData.sessionId,
              userId: postData.userId,
              activityId: sessionData.activityId || sessionData.projectId || '',
              projectId: sessionData.projectId || sessionData.activityId || '',
              title: sessionData.title || 'Untitled Session',
              description: sessionData.description || '',
              duration: sessionData.duration || 0,
              startTime: convertTimestamp(sessionData.startTime) || new Date(),
              tags: sessionData.tags || [],
              visibility: sessionData.visibility || 'everyone',
              showStartTime: sessionData.showStartTime,
              howFelt: sessionData.howFelt,
              privateNotes: sessionData.privateNotes,
              isArchived: sessionData.isArchived || false,
              supportCount: sessionData.supportCount || 0,
              commentCount: sessionData.commentCount || 0,
              createdAt: convertTimestamp(sessionData.createdAt) || new Date(),
              updatedAt: convertTimestamp(sessionData.updatedAt) || new Date(),
            }
          : ({
              id: postData.sessionId,
              userId: postData.userId,
              activityId: '',
              projectId: '',
              title: 'Session Not Found',
              description: '',
              duration: 0,
              startTime: new Date(),
              tags: [],
              visibility: 'everyone',
              isArchived: false,
              supportCount: 0,
              commentCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Session),
      };

      return post;
    });

    const batchResults = await Promise.all(batchPromises);
    posts.push(...batchResults);
  }

  return posts;
};

// Firebase Post API

// ============================================================================
// PUBLIC API
// ============================================================================

export const firebasePostApi = {
  // Create a new post
  createPost: async (data: CreatePostData): Promise<Post> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const postData = {
        ...data,
        userId: auth.currentUser.uid,
        supportCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);

      return {
        id: docRef.id,
        sessionId: data.sessionId,
        userId: auth.currentUser.uid,
        content: data.content,
        visibility: data.visibility,
        supportCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (_error) {
      const apiError = handleError(error, 'Create post', {
        defaultMessage: 'Failed to create post',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Get sessions for feed (Strava-like - sessions are the content)
  getFeedSessions: async (
    limitCount: number = 20,
    cursor?: string,
    filters: FeedFilters = {}
  ): Promise<FeedResponse> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let sessionsQuery;
      const { type = 'recent', userId, groupId } = filters;

      // Handle different feed types - fetch from sessions collection
      if (type === 'group' && groupId) {
        // Group: fetch sessions from group members
        const membershipsQuery = query(
          collection(db, 'groupMemberships'),
          where('groupId', '==', groupId),
          where('status', '==', 'active')
        );
        const membershipsSnapshot = await getDocs(membershipsQuery);
        const memberIds = membershipsSnapshot.docs.map(
          doc => doc.data().userId
        );

        if (memberIds.length === 0) {
          return { sessions: [], hasMore: false, nextCursor: undefined };
        }

        // Fetch sessions from group members
        // Due to Firestore limitations, fetch all and filter
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', 'in', ['everyone', 'followers']),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount * 3) // Fetch more to account for filtering
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', 'in', ['everyone', 'followers']),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limitFn(limitCount * 3)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        // Filter to only sessions from group members
        const filteredDocs = querySnapshot.docs
          .filter(doc => memberIds.includes(doc.data().userId))
          .slice(0, limitCount + 1);

        const sessions = await populateSessionsWithDetails(
          filteredDocs.slice(0, limitCount)
        );
        const hasMore = filteredDocs.length > limitCount;
        const nextCursor = hasMore
          ? filteredDocs[limitCount - 1]?.id
          : undefined;

        return { sessions, hasMore, nextCursor };
      } else if (type === 'following') {
        // Get list of users the current user is following
        let followingIds: string[] = [];

        // Try new social_graph structure first
        try {
          const outboundRef = collection(
            db,
            `social_graph/${auth.currentUser.uid}/outbound`
          );
          const outboundSnapshot = await getDocs(outboundRef);

          if (!outboundSnapshot.empty) {
            followingIds = outboundSnapshot.docs.map(doc => doc.id);
          }
        } catch (_socialGraphError) {
          // If social_graph doesn't exist or has permission issues, continue to fallback
        }

        // Fallback to old follows collection if no following found via social_graph
        if (followingIds.length === 0) {
          const followingQuery = query(
            collection(db, 'follows'),
            where('followerId', '==', auth.currentUser.uid)
          );
          const followingSnapshot = await getDocs(followingQuery);

          followingIds = followingSnapshot.docs.map(doc => {
            const data = doc.data();
            return data.followingId;
          });
        }

        // DO NOT include current user's sessions in following feed

        // If not following anyone yet, return empty feed
        if (followingIds.length === 0) {
          return { sessions: [], hasMore: false, nextCursor: undefined };
        }

        // Fetch sessions from followed users only
        // Due to Firestore limitations, fetch all and filter
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', 'in', ['everyone', 'followers']),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount * 3) // Fetch more to account for filtering
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', 'in', ['everyone', 'followers']),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limitFn(limitCount * 3)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        // Filter to only sessions from followed users
        const filteredDocs = querySnapshot.docs
          .filter(doc => followingIds.includes(doc.data().userId))
          .slice(0, limitCount + 1);

        const sessions = await populateSessionsWithDetails(
          filteredDocs.slice(0, limitCount)
        );
        const hasMore = filteredDocs.length > limitCount;
        const nextCursor = hasMore
          ? filteredDocs[limitCount - 1]?.id
          : undefined;

        return { sessions, hasMore, nextCursor };
      } else if (type === 'trending') {
        // Trending: fetch recent public sessions
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', '==', 'everyone'),
          where('createdAt', '>=', sevenDaysAgo),
          orderBy('createdAt', 'desc'),
          limitFn(100) // Fetch more for sorting
        );

        const querySnapshot = await getDocs(sessionsQuery);

        // For trending, we'd ideally sort by engagement, but since sessions don't have
        // support/comment counts directly, we'll just show recent public sessions
        // In a production app, you'd maintain engagement scores on sessions
        const sessionDocs = querySnapshot.docs;

        // Apply cursor if provided
        let startIndex = 0;
        if (cursor) {
          startIndex = sessionDocs.findIndex(doc => doc.id === cursor) + 1;
        }

        const paginatedDocs = sessionDocs.slice(
          startIndex,
          startIndex + limitCount + 1
        );
        const sessions = await populateSessionsWithDetails(
          paginatedDocs.slice(0, limitCount)
        );
        const hasMore = paginatedDocs.length > limitCount;
        const nextCursor = hasMore
          ? paginatedDocs[limitCount - 1]?.id
          : undefined;

        return { sessions, hasMore, nextCursor };
      } else if (type === 'user') {
        // User: fetch sessions for a specific user
        const targetUserId = userId || auth.currentUser.uid;

        sessionsQuery = query(
          collection(db, 'sessions'),
          where('userId', '==', targetUserId),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount + 1)
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('userId', '==', targetUserId),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limitFn(limitCount + 1)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        const sessionDocs = querySnapshot.docs.slice(0, limitCount);
        const sessions = await populateSessionsWithDetails(sessionDocs);
        const hasMore = querySnapshot.docs.length > limitCount;
        const nextCursor = hasMore
          ? sessionDocs[sessionDocs.length - 1]?.id
          : undefined;

        return {
          sessions,
          hasMore,
          nextCursor,
        };
      } else if (type === 'group-members-unfollowed') {
        // Get list of users the current user is following
        let followingIds: string[] = [];

        // Try new social_graph structure first
        try {
          const outboundRef = collection(
            db,
            `social_graph/${auth.currentUser.uid}/outbound`
          );
          const outboundSnapshot = await getDocs(outboundRef);

          if (!outboundSnapshot.empty) {
            followingIds = outboundSnapshot.docs.map(doc => doc.id);
          }
        } catch (_socialGraphError) {
          // If social_graph doesn't exist or has permission issues, continue to fallback
        }

        // Fallback to old follows collection if no following found via social_graph
        if (followingIds.length === 0) {
          const followingQuery = query(
            collection(db, 'follows'),
            where('followerId', '==', auth.currentUser.uid)
          );
          const followingSnapshot = await getDocs(followingQuery);

          followingIds = followingSnapshot.docs.map(doc => {
            const data = doc.data();
            return data.followingId;
          });
        }

        // Get all groups the user is a member of
        const membershipQuery = query(
          collection(db, 'groupMemberships'),
          where('userId', '==', auth.currentUser.uid),
          where('status', '==', 'active')
        );
        const membershipSnapshot = await getDocs(membershipQuery);
        const userGroupIds = membershipSnapshot.docs.map(
          doc => doc.data().groupId
        );

        if (userGroupIds.length === 0) {
          return { sessions: [], hasMore: false, nextCursor: undefined };
        }

        // Get all members from all the user's groups
        const allGroupMemberIds: string[] = [];
        for (const groupId of userGroupIds) {
          const groupMembersQuery = query(
            collection(db, 'groupMemberships'),
            where('groupId', '==', groupId),
            where('status', '==', 'active')
          );
          const groupMembersSnapshot = await getDocs(groupMembersQuery);
          groupMembersSnapshot.docs.forEach(doc => {
            const memberId = doc.data().userId;
            // Exclude current user and people they follow
            if (
              memberId !== auth.currentUser!.uid &&
              !followingIds.includes(memberId)
            ) {
              if (!allGroupMemberIds.includes(memberId)) {
                allGroupMemberIds.push(memberId);
              }
            }
          });
        }

        if (allGroupMemberIds.length === 0) {
          return { sessions: [], hasMore: false, nextCursor: undefined };
        }

        // Fetch sessions from group members (excluding followed users and current user)
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', 'in', ['everyone', 'followers']),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount * 3) // Fetch more to account for filtering
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', 'in', ['everyone', 'followers']),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limitFn(limitCount * 3)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        // Filter to only sessions from group members who user doesn't follow
        const filteredDocs = querySnapshot.docs
          .filter(doc => {
            const sessionUserId = doc.data().userId;
            const isInGroupMembers = allGroupMemberIds.includes(sessionUserId);
            const isFollowed = followingIds.includes(sessionUserId);
            const isCurrentUser = sessionUserId === auth.currentUser!.uid;

            // Must be in group members list AND not in following list AND not current user
            return isInGroupMembers && !isFollowed && !isCurrentUser;
          })
          .slice(0, limitCount + 1);

        const sessions = await populateSessionsWithDetails(
          filteredDocs.slice(0, limitCount)
        );
        const hasMore = filteredDocs.length > limitCount;
        const nextCursor = hasMore
          ? filteredDocs[limitCount - 1]?.id
          : undefined;

        return { sessions, hasMore, nextCursor };
      } else if (type === 'all') {
        // All: chronological feed of all public sessions (not filtering anyone out)
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', 'in', ['everyone', 'followers']),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount + 1)
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', 'in', ['everyone', 'followers']),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limitFn(limitCount + 1)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);
        const sessionDocs = querySnapshot.docs.slice(0, limitCount);
        const sessions = await populateSessionsWithDetails(sessionDocs);
        const hasMore = querySnapshot.docs.length > limitCount;
        const nextCursor = hasMore
          ? sessionDocs[sessionDocs.length - 1]?.id
          : undefined;

        return {
          sessions,
          hasMore,
          nextCursor,
        };
      } else {
        // Recent: default chronological feed - only show sessions from followed users
        // Get list of users the current user is following
        let followingIds: string[] = [];

        // Try new social_graph structure first
        try {
          const outboundRef = collection(
            db,
            `social_graph/${auth.currentUser.uid}/outbound`
          );
          const outboundSnapshot = await getDocs(outboundRef);

          if (!outboundSnapshot.empty) {
            followingIds = outboundSnapshot.docs.map(doc => doc.id);
          }
        } catch (_socialGraphError) {
          // If social_graph doesn't exist or has permission issues, continue to fallback
        }

        // Fallback to old follows collection if no following found via social_graph
        if (followingIds.length === 0) {
          const followingQuery = query(
            collection(db, 'follows'),
            where('followerId', '==', auth.currentUser.uid)
          );
          const followingSnapshot = await getDocs(followingQuery);

          followingIds = followingSnapshot.docs.map(doc => {
            const data = doc.data();
            return data.followingId;
          });
        }

        // Include current user's sessions too
        followingIds.push(auth.currentUser.uid);

        // If not following anyone yet, return empty feed
        if (
          followingIds.length === 1 &&
          followingIds[0] === auth.currentUser.uid
        ) {
          return { sessions: [], hasMore: false, nextCursor: undefined };
        }

        // Fetch sessions from followed users
        // Due to Firestore limitations, fetch all and filter
        sessionsQuery = query(
          collection(db, 'sessions'),
          where('visibility', 'in', ['everyone', 'followers']),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount * 3) // Fetch more to account for filtering
        );

        if (cursor) {
          const cursorDoc = await getDoc(doc(db, 'sessions', cursor));
          if (cursorDoc.exists()) {
            sessionsQuery = query(
              collection(db, 'sessions'),
              where('visibility', 'in', ['everyone', 'followers']),
              orderBy('createdAt', 'desc'),
              startAfter(cursorDoc),
              limitFn(limitCount * 3)
            );
          }
        }

        const querySnapshot = await getDocs(sessionsQuery);

        // Filter to only sessions from followed users
        const filteredDocs = querySnapshot.docs
          .filter(doc => followingIds.includes(doc.data().userId))
          .slice(0, limitCount + 1);

        const sessions = await populateSessionsWithDetails(
          filteredDocs.slice(0, limitCount)
        );
        const hasMore = filteredDocs.length > limitCount;
        const nextCursor = hasMore
          ? filteredDocs[limitCount - 1]?.id
          : undefined;

        return {
          sessions,
          hasMore,
          nextCursor,
        };
      }
    } catch (_error) {
      handleError(error, 'in getFeedSessions', {
        severity: ErrorSeverity.ERROR,
      });
      const apiError = handleError(error, 'Get feed sessions', {
        defaultMessage: 'Failed to get feed sessions',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Support a session (like/kudos)
  supportSession: async (sessionId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Rate limitFn support actions
      checkRateLimit(auth.currentUser.uid, 'SUPPORT');

      const sessionRef = doc(db, 'sessions', sessionId);

      // Use transaction to safely add user ID to supportedBy array
      await runTransaction(db, async transaction => {
        const sessionDoc = await transaction.get(sessionRef);

        if (!sessionDoc.exists()) {
          throw new Error('Session not found');
        }

        const sessionData = sessionDoc.data();
        const supportedBy = sessionData.supportedBy || [];

        // Check if user already supported this session
        if (supportedBy.includes(auth.currentUser!.uid)) {
          return; // Already supported, do nothing
        }

        // Add user ID to supportedBy array and update supportCount
        transaction.update(sessionRef, {
          supportedBy: [...supportedBy, auth.currentUser!.uid],
          supportCount: supportedBy.length + 1,
          updatedAt: serverTimestamp(),
        });
      });

      // Create notification for support action (outside transaction)
      try {
        const sessionDoc = await getDoc(sessionRef);
        const sessionData = sessionDoc.data();

        // Only notify if supporting someone else's session
        if (sessionData && sessionData.userId !== auth.currentUser.uid) {
          const currentUserDoc = await getDoc(
            doc(db, 'users', auth.currentUser.uid)
          );
          const userData = currentUserDoc.data();

          await addDoc(collection(db, 'notifications'), {
            userId: sessionData.userId,
            type: 'support',
            title: 'New support',
            message: `${userData?.name || 'Someone'} supported your session`,
            linkUrl: `/sessions/${sessionId}`,
            actorId: auth.currentUser.uid,
            sessionId: sessionId,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      } catch (notifError) {
        // Log error but don't fail the support action
        handleError(notifError, 'create support notification', {
          severity: ErrorSeverity.ERROR,
          silent: true,
        });
      }
    } catch (_error) {
      const apiError = handleError(error, 'Support session', {
        defaultMessage: 'Failed to support session',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Remove support from a session
  removeSupportFromSession: async (sessionId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const sessionRef = doc(db, 'sessions', sessionId);

      // Use transaction to safely remove user ID from supportedBy array
      await runTransaction(db, async transaction => {
        const sessionDoc = await transaction.get(sessionRef);

        if (!sessionDoc.exists()) {
          throw new Error('Session not found');
        }

        const sessionData = sessionDoc.data();
        const supportedBy = sessionData.supportedBy || [];

        // Check if user has supported this session
        if (!supportedBy.includes(auth.currentUser!.uid)) {
          return; // Not supported, do nothing
        }

        // Remove user ID from supportedBy array and update supportCount
        const newSupportedBy = supportedBy.filter(
          (id: string) => id !== auth.currentUser!.uid
        );
        transaction.update(sessionRef, {
          supportedBy: newSupportedBy,
          supportCount: newSupportedBy.length,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (_error) {
      const apiError = handleError(error, 'Remove support', {
        defaultMessage: 'Failed to remove support',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update post
  updatePost: async (postId: string, data: UpdatePostData): Promise<Post> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'posts', postId), updateData);

      // Get updated post
      const postDoc = await getDoc(doc(db, 'posts', postId));
      const postData = postDoc.data()!;

      return {
        id: postId,
        visibility: postData.visibility || 'everyone',
        sessionId: postData.sessionId,
        userId: postData.userId,
        content: postData.content,
        supportCount: postData.supportCount || 0,
        commentCount: postData.commentCount || 0,
        createdAt: convertTimestamp(postData.createdAt),
        updatedAt: convertTimestamp(postData.updatedAt),
      };
    } catch (_error) {
      const apiError = handleError(error, 'Update post', {
        defaultMessage: 'Failed to update post',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Delete post
  deletePost: async (postId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Verify post belongs to user
      const postDoc = await getDoc(doc(db, 'posts', postId));
      const postData = postDoc.data();

      if (!postData || postData.userId !== auth.currentUser.uid) {
        throw new Error('Post not found or access denied');
      }

      await deleteDoc(doc(db, 'posts', postId));
    } catch (_error) {
      const apiError = handleError(error, 'Delete post', {
        defaultMessage: 'Failed to delete post',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Listen to real-time updates for session support counts
  listenToSessionUpdates: (
    sessionIds: string[],
    callback: (
      updates: Record<string, { supportCount: number; isSupported: boolean }>
    ) => void
  ) => {
    if (!auth.currentUser) return () => {};

    const unsubscribers: (() => void)[] = [];
    const currentUserId = auth.currentUser.uid;

    sessionIds.forEach(sessionId => {
      // Listen to session support count changes and support status
      const sessionUnsubscribe = onSnapshot(
        doc(db, 'sessions', sessionId),
        sessionDoc => {
          if (sessionDoc.exists()) {
            const sessionData = sessionDoc.data();
            const supportedBy = sessionData.supportedBy || [];
            callback({
              [sessionId]: {
                supportCount: sessionData.supportCount || 0,
                isSupported: supportedBy.includes(currentUserId),
              },
            });
          }
        },
        error => {
          // Silently ignore permission-denied errors - these can occur when:
          // 1. Session visibility changes while listener is active
          // 2. Session is deleted while listener is active
          // 3. User unfollows session owner and visibility is 'followers'
          if (isPermissionError(error)) {
            return;
          }
          // For other errors, log them normally
          handleError(error, `Listen to session ${sessionId}`, {
            severity: ErrorSeverity.ERROR,
          });
        }
      );

      unsubscribers.push(sessionUnsubscribe);
    });

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  },

  // Get user's posts
  getUserPosts: async (
    userId: string,
    limitCount: number = 20,
    isOwnProfile: boolean = false
  ): Promise<PostWithDetails[]> => {
    try {
      let postsQuery;

      if (isOwnProfile) {
        // Show all posts for own profile
        postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount)
        );
      } else {
        // Show only public posts for other profiles
        postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          where('visibility', '==', 'everyone'),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount)
        );
      }

      const querySnapshot = await getDocs(postsQuery);
      const posts: PostWithDetails[] = [];

      // Process posts to populate data
      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data();

        // Get user data
        const userDoc = await getDoc(doc(db, 'users', postData.userId));
        const userData = userDoc.data();

        // Get session data
        const sessionDoc = await getDoc(
          doc(db, 'sessions', postData.sessionId)
        );
        const sessionData = sessionDoc.data();

        // Get project data
        const projectId = sessionData?.projectId;
        if (projectId) {
          try {
            const projectDoc = await getDoc(
              doc(db, 'projects', postData.userId, 'userProjects', projectId)
            );
            if (projectDoc.exists()) {
              // projectData is available if needed
            }
          } catch (_error) {
            handleError(error, `Fetch project ${projectId}`, {
              severity: ErrorSeverity.WARNING,
            });
          }
        }

        posts.push({
          id: postDoc.id,
          sessionId: postData.sessionId,
          userId: postData.userId,
          content: postData.content,
          visibility: postData.visibility || 'everyone',
          supportCount: postData.supportCount || 0,
          commentCount: postData.commentCount || 0,
          isSupported: false, // Will be updated based on current user
          createdAt: convertTimestamp(postData.createdAt),
          updatedAt: convertTimestamp(postData.updatedAt),
          user: {
            id: postData.userId,
            email: userData?.email || '',
            name: userData?.name || 'Unknown User',
            username: userData?.username || 'unknown',
            bio: userData?.bio,
            location: userData?.location,
            profilePicture: userData?.profilePicture,
            createdAt: convertTimestamp(userData?.createdAt) || new Date(),
            updatedAt: convertTimestamp(userData?.updatedAt) || new Date(),
          },
          session: sessionData
            ? {
                id: postData.sessionId,
                userId: postData.userId,
                activityId:
                  sessionData.activityId || sessionData.projectId || '',
                projectId:
                  sessionData.projectId || sessionData.activityId || '',
                title: sessionData.title || 'Untitled Session',
                description: sessionData.description || '',
                duration: sessionData.duration || 0,
                startTime:
                  convertTimestamp(sessionData.startTime) || new Date(),
                tags: sessionData.tags || [],
                visibility: sessionData.visibility || 'everyone',
                showStartTime: sessionData.showStartTime,
                howFelt: sessionData.howFelt,
                privateNotes: sessionData.privateNotes,
                isArchived: sessionData.isArchived || false,
                supportCount: sessionData.supportCount || 0,
                commentCount: sessionData.commentCount || 0,
                createdAt:
                  convertTimestamp(sessionData.createdAt) || new Date(),
                updatedAt:
                  convertTimestamp(sessionData.updatedAt) || new Date(),
              }
            : ({
                id: postData.sessionId,
                userId: postData.userId,
                activityId: '',
                projectId: '',
                title: 'Session Not Found',
                description: '',
                duration: 0,
                startTime: new Date(),
                tags: [],
                visibility: 'everyone',
                isArchived: false,
                supportCount: 0,
                commentCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as Session),
        });
      }

      return posts;
    } catch (_error) {
      const apiError = handleError(error, 'Get user posts', {
        defaultMessage: 'Failed to get user posts',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Firebase Comment API
