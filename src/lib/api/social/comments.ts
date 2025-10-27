/**
 * Comments API Module
 * Handles comment CRUD operations and likes
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
  serverTimestamp,
  increment,
  writeBatch,
  setDoc,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import {
  handleError,
  isPermissionError,
  isNotFoundError,
  ErrorSeverity,
} from '@/lib/errorHandler';
import { checkRateLimit } from '@/lib/rateLimit';

// Error messages
import { ERROR_MESSAGES } from '@/config/errorMessages';

// Shared utilities
import { convertTimestamp, _removeUndefinedFields } from '../shared/utils';

// Social helpers
import {
  fetchUserDataForSocialContext,
  buildCommentUserDetails,
} from './helpers';

// Types
import type {
  Comment,
  CommentWithDetails,
  CreateCommentData,
  UpdateCommentData,
  CommentLike,
  CommentsResponse,
} from '@/types';

// ============================================================================
// PUBLIC API
// ============================================================================

export const firebaseCommentApi = {
  /**
   * Create a new comment or reply on a session
   * Automatically creates notifications for mentions, session owners, and parent comment owners
   *
   * @param data - The comment data including sessionId, content, and optional parentId for replies
   * @returns Promise resolving to the created comment with user details
   * @throws Error if user is not authenticated, rate limit exceeded, or creation fails
   */
  createComment: async (
    data: CreateCommentData
  ): Promise<CommentWithDetails> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Rate limitFn comment creation
      checkRateLimit(auth.currentUser.uid, 'COMMENT');

      const userId = auth.currentUser.uid;

      // Extract mentions from content
      const mentionRegex = /@(\w+)/g;
      const mentions = [...data.content.matchAll(mentionRegex)].map(
        match => match[1]
      );

      const commentData: any = {
        sessionId: data.sessionId,
        userId,
        content: data.content,
        likeCount: 0,
        replyCount: 0,
        isEdited: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add parentId if it exists
      if (data.parentId) {
        commentData.parentId = data.parentId;
      }

      const docRef = await addDoc(collection(db, 'comments'), commentData);

      // Increment comment count on session
      const sessionRef = doc(db, 'sessions', data.sessionId);
      await updateDoc(sessionRef, {
        commentCount: increment(1),
      });

      // If this is a reply, increment reply count on parent comment
      if (data.parentId) {
        const parentCommentRef = doc(db, 'comments', data.parentId);
        await updateDoc(parentCommentRef, {
          replyCount: increment(1),
        });
      }

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      // Create notifications for mentions
      if (mentions.length > 0) {
        // Get users by username
        const usersQuery = query(
          collection(db, 'users'),
          where('username', 'in', mentions)
        );
        const usersSnapshot = await getDocs(usersQuery);

        const notificationPromises = usersSnapshot.docs.map(async userDoc => {
          const mentionedUserId = userDoc.id;
          if (mentionedUserId !== userId) {
            // Create notification
            await addDoc(collection(db, 'notifications'), {
              userId: mentionedUserId,
              type: 'mention',
              title: 'New mention',
              message: `${userData?.name} mentioned you in a comment`,
              linkUrl: `/sessions/${data.sessionId}`,
              actorId: userId,
              actorName: userData?.name,
              actorUsername: userData?.username,
              actorProfilePicture: userData?.profilePicture,
              sessionId: data.sessionId,
              commentId: docRef.id,
              isRead: false,
              createdAt: serverTimestamp(),
            });
          }
        });

        await Promise.all(notificationPromises);
      }

      // Create notification for session owner (if not commenting on own session)
      if (!data.parentId) {
        const sessionDoc = await getDoc(sessionRef);
        const sessionData = sessionDoc.data();

        if (sessionData && sessionData.userId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: sessionData.userId,
            type: 'comment',
            title: 'New comment',
            message: `${userData?.name} commented on your session`,
            linkUrl: `/sessions/${data.sessionId}`,
            actorId: userId,
            actorName: userData?.name,
            actorUsername: userData?.username,
            actorProfilePicture: userData?.profilePicture,
            sessionId: data.sessionId,
            commentId: docRef.id,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // Create notification for parent comment owner (if replying to someone else)
        const parentCommentDoc = await getDoc(
          doc(db, 'comments', data.parentId)
        );
        const parentCommentData = parentCommentDoc.data();

        if (parentCommentData && parentCommentData.userId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: parentCommentData.userId,
            type: 'reply',
            title: 'New reply',
            message: `${userData?.name} replied to your comment`,
            linkUrl: `/sessions/${data.sessionId}`,
            actorId: userId,
            actorName: userData?.name,
            actorUsername: userData?.username,
            actorProfilePicture: userData?.profilePicture,
            sessionId: data.sessionId,
            commentId: docRef.id,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      }

      return {
        id: docRef.id,
        sessionId: data.sessionId,
        userId,
        parentId: data.parentId,
        content: data.content,
        likeCount: 0,
        replyCount: 0,
        isLiked: false,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: buildCommentUserDetails(userId, userData || null),
      };
    } catch (error) {
      const apiError = handleError(error, 'Create comment', {
        defaultMessage: ERROR_MESSAGES.COMMENT_POST_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Update an existing comment's content
   *
   * @param commentId - The ID of the comment to update
   * @param data - The updated comment data (content)
   * @returns Promise resolving to the updated comment
   * @throws Error if user is not authenticated, comment not found, or not authorized
   */
  updateComment: async (
    commentId: string,
    data: UpdateCommentData
  ): Promise<Comment> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);

      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const commentData = commentDoc.data();

      if (commentData.userId !== auth.currentUser.uid) {
        throw new Error('Not authorized to edit this comment');
      }

      await updateDoc(commentRef, {
        content: data.content,
        isEdited: true,
        updatedAt: serverTimestamp(),
      });

      return {
        id: commentId,
        ...commentData,
        content: data.content,
        isEdited: true,
        createdAt: convertTimestamp(commentData.createdAt),
        updatedAt: new Date(),
      } as Comment;
    } catch (error) {
      const apiError = handleError(error, 'Update comment', {
        defaultMessage: ERROR_MESSAGES.COMMENT_POST_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Delete a comment and all its replies
   *
   * @param commentId - The ID of the comment to delete
   * @returns Promise that resolves when the comment and replies are deleted
   * @throws Error if user is not authenticated, comment not found, or not authorized
   */
  deleteComment: async (commentId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);

      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const commentData = commentDoc.data();

      if (commentData.userId !== auth.currentUser.uid) {
        throw new Error('Not authorized to delete this comment');
      }

      // Delete all replies to this comment
      const repliesQuery = query(
        collection(db, 'comments'),
        where('parentId', '==', commentId)
      );
      const repliesSnapshot = await getDocs(repliesQuery);

      const batch = writeBatch(db);

      repliesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      batch.delete(commentRef);

      await batch.commit();

      // Decrement comment count on session
      const sessionRef = doc(db, 'sessions', commentData.sessionId);
      await updateDoc(sessionRef, {
        commentCount: increment(-1 - repliesSnapshot.size), // -1 for the comment itself, and -repliesSnapshot.size for replies
      });

      // If this is a reply, decrement reply count on parent comment
      if (commentData.parentId) {
        const parentCommentRef = doc(db, 'comments', commentData.parentId);
        await updateDoc(parentCommentRef, {
          replyCount: increment(-1),
        });
      }
    } catch (error) {
      const apiError = handleError(error, 'Delete comment', {
        defaultMessage: ERROR_MESSAGES.COMMENT_DELETE_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Like a comment
   *
   * @param commentId - The ID of the comment to like
   * @returns Promise that resolves when the like is added
   * @throws Error if user is not authenticated, comment already liked, or like fails
   */
  likeComment: async (commentId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      const likeId = `${userId}_${commentId}`;
      const likeRef = doc(db, 'commentLikes', likeId);

      const likeDoc = await getDoc(likeRef);

      if (likeDoc.exists()) {
        throw new Error('Already liked this comment');
      }

      await setDoc(likeRef, {
        commentId,
        userId,
        createdAt: serverTimestamp(),
      });

      // Increment like count on comment
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likeCount: increment(1),
      });
    } catch (error) {
      const apiError = handleError(error, 'Like comment', {
        defaultMessage: 'Failed to like comment',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Unlike a comment (remove like)
   *
   * @param commentId - The ID of the comment to unlike
   * @returns Promise that resolves when the like is removed
   * @throws Error if user is not authenticated, comment not liked, or unlike fails
   */
  unlikeComment: async (commentId: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;
      const likeId = `${userId}_${commentId}`;
      const likeRef = doc(db, 'commentLikes', likeId);

      const likeDoc = await getDoc(likeRef);

      if (!likeDoc.exists()) {
        throw new Error('Comment not liked');
      }

      await deleteDoc(likeRef);

      // Decrement like count on comment
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likeCount: increment(-1),
      });
    } catch (error) {
      const apiError = handleError(error, 'Unlike comment', {
        defaultMessage: 'Failed to unlike comment',
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get top-level comments for a session with pagination
   * Returns only parent comments (no replies) - use getReplies for nested comments
   *
   * @param sessionId - The session ID whose comments to retrieve
   * @param limitCount - Maximum number of comments to return (default: 20)
   * @param lastDoc - Optional Firestore document snapshot for pagination
   * @returns Promise resolving to comments with hasMore flag (returns empty on permission errors)
   */
  getSessionComments: async (
    sessionId: string,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<CommentsResponse> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;

      // Get top-level comments (no parentId)
      let q;

      if (lastDoc) {
        q = query(
          collection(db, 'comments'),
          where('sessionId', '==', sessionId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limitFn(limitCount + 1)
        );
      } else {
        q = query(
          collection(db, 'comments'),
          where('sessionId', '==', sessionId),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount + 1)
        );
      }

      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q);

      // Filter for top-level comments only (no parentId)
      const topLevelDocs: QueryDocumentSnapshot<DocumentData>[] =
        snapshot.docs.filter(
          (doc: QueryDocumentSnapshot<DocumentData>) => !doc.data().parentId
        );

      const hasMore: boolean = topLevelDocs.length > limitCount;
      const docs: QueryDocumentSnapshot<DocumentData>[] = hasMore
        ? topLevelDocs.slice(0, -1)
        : topLevelDocs;

      // Get all comment likes for current user in one query
      const commentIds: string[] = docs.map(
        (d: QueryDocumentSnapshot<DocumentData>) => d.id
      );
      let likedCommentIds = new Set<string>();
      if (commentIds.length > 0) {
        const likesQuery = query(
          collection(db, 'commentLikes'),
          where('userId', '==', userId),
          where('commentId', 'in', commentIds)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likedCommentIds = new Set(
          likesSnapshot.docs.map(d => d.data().commentId)
        );
      }

      // Build comments with user details
      const comments: CommentWithDetails[] = await Promise.all(
        docs.map(async (docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
          const data = docSnapshot.data();

          const userData = await fetchUserDataForSocialContext(data.userId);

          return {
            id: docSnapshot.id,
            sessionId: data.sessionId,
            userId: data.userId,
            parentId: data.parentId,
            content: data.content,
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            isLiked: likedCommentIds.has(docSnapshot.id),
            isEdited: data.isEdited || false,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            user: buildCommentUserDetails(data.userId, userData),
          };
        })
      );

      return {
        comments,
        hasMore,
      };
    } catch (error) {
      // Handle permission errors gracefully - return empty comments
      if (isPermissionError(error)) {
        // Don't log permission errors - they're expected for restricted sessions
        return {
          comments: [],
          hasMore: false,
        };
      }

      // For other errors, log and throw with appropriate message
      const apiError = handleError(error, 'Get session comments', {
        defaultMessage: ERROR_MESSAGES.COMMENT_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Legacy alias for getSessionComments - get top-level comments for a session
   * Kept for backward compatibility with older code
   *
   * @param sessionId - The session ID whose comments to retrieve
   * @param limitCount - Maximum number of comments to return (default: 20)
   * @param lastDoc - Optional Firestore document snapshot for pagination
   * @returns Promise resolving to comments with hasMore flag and nextCursor
   * @throws Error if user is not authenticated or fetch fails
   */
  getPostComments: async (
    sessionId: string,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<CommentsResponse> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;

      // Get top-level comments (no parentId)
      // Note: Firestore doesn't support querying for undefined, so we check for both null and absence
      let q;

      if (lastDoc) {
        q = query(
          collection(db, 'comments'),
          where('sessionId', '==', sessionId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limitFn(limitCount + 1)
        );
      } else {
        q = query(
          collection(db, 'comments'),
          where('sessionId', '==', sessionId),
          orderBy('createdAt', 'desc'),
          limitFn(limitCount + 1)
        );
      }

      const snapshot: QuerySnapshot<DocumentData> = await getDocs(q);

      // Filter for top-level comments only (no parentId)
      const topLevelDocs: QueryDocumentSnapshot<DocumentData>[] =
        snapshot.docs.filter(
          (doc: QueryDocumentSnapshot<DocumentData>) => !doc.data().parentId
        );

      const hasMore: boolean = topLevelDocs.length > limitCount;
      const docs: QueryDocumentSnapshot<DocumentData>[] = hasMore
        ? topLevelDocs.slice(0, -1)
        : topLevelDocs;

      // Get all comment likes for current user in one query
      const commentIds: string[] = docs.map(
        (d: QueryDocumentSnapshot<DocumentData>) => d.id
      );
      let likedCommentIds = new Set<string>();
      if (commentIds.length > 0) {
        const likesQuery = query(
          collection(db, 'commentLikes'),
          where('userId', '==', userId),
          where('commentId', 'in', commentIds)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likedCommentIds = new Set(
          likesSnapshot.docs.map(d => d.data().commentId)
        );
      }

      // Build comments with user details
      const comments: CommentWithDetails[] = await Promise.all(
        docs.map(async (docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
          const data = docSnapshot.data();

          const userData = await fetchUserDataForSocialContext(data.userId);

          return {
            id: docSnapshot.id,
            sessionId: data.sessionId,
            userId: data.userId,
            parentId: data.parentId,
            content: data.content,
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            isLiked: likedCommentIds.has(docSnapshot.id),
            isEdited: data.isEdited || false,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            user: buildCommentUserDetails(data.userId, userData),
          };
        })
      );

      const lastDocInResult: QueryDocumentSnapshot<DocumentData> | undefined =
        docs[docs.length - 1];
      return {
        comments,
        hasMore,
        nextCursor: hasMore && lastDocInResult ? lastDocInResult.id : undefined,
      };
    } catch (error) {
      const apiError = handleError(error, 'Get comments', {
        defaultMessage: ERROR_MESSAGES.COMMENT_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get all replies for a specific comment
   *
   * @param commentId - The ID of the parent comment
   * @returns Promise resolving to array of reply comments with user details
   * @throws Error if user is not authenticated or fetch fails
   */
  getReplies: async (commentId: string): Promise<CommentWithDetails[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;

      const q = query(
        collection(db, 'comments'),
        where('parentId', '==', commentId),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(q);

      // Get all comment likes for current user in one query
      const commentIds = snapshot.docs.map(d => d.id);
      let likedCommentIds = new Set<string>();
      if (commentIds.length > 0) {
        const likesQuery = query(
          collection(db, 'commentLikes'),
          where('userId', '==', userId),
          where('commentId', 'in', commentIds)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likedCommentIds = new Set(
          likesSnapshot.docs.map(d => d.data().commentId)
        );
      }

      const replies: CommentWithDetails[] = await Promise.all(
        snapshot.docs.map(async docSnapshot => {
          const data = docSnapshot.data();

          const userData = await fetchUserDataForSocialContext(data.userId);

          return {
            id: docSnapshot.id,
            sessionId: data.sessionId,
            userId: data.userId,
            parentId: data.parentId,
            content: data.content,
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            isLiked: likedCommentIds.has(docSnapshot.id),
            isEdited: data.isEdited || false,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            user: buildCommentUserDetails(data.userId, userData),
          };
        })
      );

      return replies;
    } catch (error) {
      const apiError = handleError(error, 'Get replies', {
        defaultMessage: ERROR_MESSAGES.COMMENT_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },

  /**
   * Get top comments for a session sorted by like count
   * Useful for showing popular comments in previews
   *
   * @param sessionId - The session ID whose top comments to retrieve
   * @param limitCount - Maximum number of top comments to return (default: 2)
   * @returns Promise resolving to array of top comments (empty array on permission errors)
   */
  getTopComments: async (
    sessionId: string,
    limitCount: number = 2
  ): Promise<CommentWithDetails[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = auth.currentUser.uid;

      // Get top-level comments sorted by likeCount
      const q = query(
        collection(db, 'comments'),
        where('sessionId', '==', sessionId),
        orderBy('likeCount', 'desc'),
        limitFn(limitCount)
      );

      const snapshot = await getDocs(q);

      // Filter for top-level comments only (no parentId)
      const topLevelDocs = snapshot.docs.filter(doc => !doc.data().parentId);

      // Get all comment likes for current user in one query
      const commentIds = topLevelDocs.map(d => d.id);
      let likedCommentIds = new Set<string>();
      if (commentIds.length > 0) {
        const likesQuery = query(
          collection(db, 'commentLikes'),
          where('userId', '==', userId),
          where('commentId', 'in', commentIds)
        );
        const likesSnapshot = await getDocs(likesQuery);
        likedCommentIds = new Set(
          likesSnapshot.docs.map(d => d.data().commentId)
        );
      }

      // Build comments with user details
      const comments: CommentWithDetails[] = await Promise.all(
        topLevelDocs.map(async docSnapshot => {
          const data = docSnapshot.data();

          const userData = await fetchUserDataForSocialContext(data.userId);

          return {
            id: docSnapshot.id,
            sessionId: data.sessionId,
            userId: data.userId,
            parentId: data.parentId,
            content: data.content,
            likeCount: data.likeCount || 0,
            replyCount: data.replyCount || 0,
            isLiked: likedCommentIds.has(docSnapshot.id),
            isEdited: data.isEdited || false,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            user: buildCommentUserDetails(data.userId, userData),
          };
        })
      );

      return comments;
    } catch (error) {
      // Handle permission errors gracefully - return empty array
      if (isPermissionError(error)) {
        return [];
      }

      // For other errors, throw with appropriate message
      const apiError = handleError(error, 'Get top comments', {
        defaultMessage: ERROR_MESSAGES.COMMENT_LOAD_FAILED,
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// ==================== GROUP API ====================
