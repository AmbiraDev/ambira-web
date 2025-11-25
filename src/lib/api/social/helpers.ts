/**
 * Social module helper functions
 * Shared utilities for social features (follows, supports, comments)
 */

import {
  collection,
  doc,
  getDoc,
  addDoc,
  runTransaction,
  increment,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { handleError, isPermissionError, isNotFoundError, ErrorSeverity } from '@/lib/errorHandler'
import {
  PRIVATE_USER_FALLBACK_NAME,
  PRIVATE_USER_USERNAME_PREFIX,
  convertTimestamp,
} from '../shared/utils'
import type { User } from '@/types'

/**
 * Manage social graph and friendship counts transactionally
 * Handles follow/unfollow actions with proper count management
 */
export const updateSocialGraph = async (
  currentUserId: string,
  targetUserId: string,
  action: 'follow' | 'unfollow'
): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId)
  const targetUserRef = doc(db, 'users', targetUserId)

  const currentUserSocialGraphRef = doc(db, `social_graph/${currentUserId}/outbound`, targetUserId)
  const targetUserSocialGraphRef = doc(db, `social_graph/${targetUserId}/inbound`, currentUserId)

  try {
    await runTransaction(db, async (transaction) => {
      // ALL READS MUST HAPPEN FIRST before any writes
      const currentUserDoc = await transaction.get(currentUserRef)
      const targetUserDoc = await transaction.get(targetUserRef)
      const isFollowing = (await transaction.get(currentUserSocialGraphRef)).exists()
      const mutualCheckRef = doc(db, `social_graph/${targetUserId}/outbound`, currentUserId)
      const isMutualOrWasMutual = (await transaction.get(mutualCheckRef)).exists()

      if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
        throw new Error('One or both users not found.')
      }

      const currentUserData = currentUserDoc.data()
      const targetUserData = targetUserDoc.data()

      if (action === 'follow' && isFollowing) return
      if (action === 'unfollow' && !isFollowing) return

      const now = new Date()
      const currentUserUpdate: Record<string, unknown> = { updatedAt: now }
      const targetUserUpdate: Record<string, unknown> = { updatedAt: now }

      // NOW DO ALL WRITES
      if (action === 'follow') {
        transaction.set(currentUserSocialGraphRef, {
          id: targetUserId,
          type: 'outbound',
          user: targetUserData,
          createdAt: now,
        })
        transaction.set(targetUserSocialGraphRef, {
          id: currentUserId,
          type: 'inbound',
          user: currentUserData,
          createdAt: now,
        })

        currentUserUpdate.outboundFriendshipCount = increment(1)
        currentUserUpdate.followingCount = increment(1)
        targetUserUpdate.inboundFriendshipCount = increment(1)
        targetUserUpdate.followersCount = increment(1)

        // Check for mutual friendship (using pre-read value)
        if (isMutualOrWasMutual) {
          currentUserUpdate.mutualFriendshipCount = increment(1)
          targetUserUpdate.mutualFriendshipCount = increment(1)
        }
      } else {
        // unfollow
        transaction.delete(currentUserSocialGraphRef)
        transaction.delete(targetUserSocialGraphRef)

        currentUserUpdate.outboundFriendshipCount = increment(-1)
        currentUserUpdate.followingCount = increment(-1)
        targetUserUpdate.inboundFriendshipCount = increment(-1)
        targetUserUpdate.followersCount = increment(-1)

        // Check for mutual friendship (using pre-read value)
        if (isMutualOrWasMutual) {
          currentUserUpdate.mutualFriendshipCount = increment(-1)
          targetUserUpdate.mutualFriendshipCount = increment(-1)
        }
      }

      transaction.update(currentUserRef, currentUserUpdate)
      transaction.update(targetUserRef, targetUserUpdate)
    })

    // Create notification for follow action (outside transaction)
    if (action === 'follow') {
      try {
        const currentUserData = await getDoc(currentUserRef)
        const userData = currentUserData.data()

        await addDoc(collection(db, 'notifications'), {
          userId: targetUserId,
          type: 'follow',
          title: 'New follower',
          message: `${userData?.name || 'Someone'} started following you`,
          linkUrl: `/profile/${userData?.username}`,
          actorId: currentUserId,
          actorName: userData?.name,
          actorUsername: userData?.username,
          actorProfilePicture: userData?.profilePicture,
          isRead: false,
          createdAt: serverTimestamp(),
        })
      } catch (notifError) {
        // Log error but don't fail the follow action
        handleError(notifError, 'create follow notification', {
          severity: ErrorSeverity.ERROR,
          silent: true,
        })
      }
    }
  } catch (error: unknown) {
    const apiError = handleError(error, `${action.charAt(0).toUpperCase() + action.slice(1)} user`)
    throw new Error(apiError.userMessage)
  }
}

/**
 * Fetch user data for social contexts, handling permissions and privacy
 */
export const fetchUserDataForSocialContext = async (
  userId: string
): Promise<DocumentData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      return null
    }
    return userDoc.data()
  } catch (error: unknown) {
    if (isPermissionError(error) || isNotFoundError(error)) {
      return null
    }
    const apiError = handleError(error, 'Fetch user data')
    throw new Error(apiError.userMessage)
  }
}

/**
 * Build user details for comment display, handling private/inaccessible users
 */
export const buildCommentUserDetails = (userId: string, userData: DocumentData | null): User => {
  const fallbackUsername = `${PRIVATE_USER_USERNAME_PREFIX}-${userId.slice(0, 6)}`
  const createdAt = userData?.createdAt ? convertTimestamp(userData.createdAt) : new Date()
  const updatedAt = userData?.updatedAt ? convertTimestamp(userData.updatedAt) : new Date()

  return {
    id: userId,
    email: userData?.email || '',
    name: userData?.name || PRIVATE_USER_FALLBACK_NAME,
    username: userData?.username || fallbackUsername,
    bio: userData?.bio,
    location: userData?.location,
    profilePicture: userData?.profilePicture,
    createdAt,
    updatedAt,
  }
}
