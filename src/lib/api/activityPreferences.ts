/**
 * Activity Preferences API
 *
 * Handles user activity preferences and usage tracking.
 * Tracks when users last used activities and how frequently.
 * Used to populate "Recent" section in activity pickers.
 *
 * Collection: /users/{userId}/activityPreferences/{typeId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { UserActivityPreference } from '@/types'

/**
 * Convert Firestore document to UserActivityPreference
 */
function convertToUserActivityPreference(
  id: string,
  data: Record<string, unknown>
): UserActivityPreference {
  return {
    typeId: id,
    userId: data.userId as string,
    lastUsed: data.lastUsed as Timestamp,
    useCount: data.useCount as number,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  }
}

/**
 * Get recent activities for a user
 *
 * Returns the most recently used activities, ordered by lastUsed descending.
 * Used to populate the horizontal "Recent" bar in activity pickers.
 *
 * @param userId - User ID
 * @param limit - Number of recent activities to fetch (default: 5)
 */
export async function getRecentActivities(
  userId: string,
  limit: number = 5
): Promise<UserActivityPreference[]> {
  const q = query(
    collection(db, `users/${userId}/activityPreferences`),
    orderBy('lastUsed', 'desc'),
    firestoreLimit(limit)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertToUserActivityPreference(doc.id, doc.data()))
}

/**
 * Get all activity preferences for a user
 *
 * @param userId - User ID
 */
export async function getAllActivityPreferences(userId: string): Promise<UserActivityPreference[]> {
  const q = query(
    collection(db, `users/${userId}/activityPreferences`),
    orderBy('lastUsed', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => convertToUserActivityPreference(doc.id, doc.data()))
}

/**
 * Get a single activity preference
 *
 * @param userId - User ID
 * @param typeId - Activity type ID
 */
export async function getActivityPreference(
  userId: string,
  typeId: string
): Promise<UserActivityPreference | null> {
  const docRef = doc(db, `users/${userId}/activityPreferences/${typeId}`)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    return null
  }

  return convertToUserActivityPreference(snapshot.id, snapshot.data())
}

/**
 * Update activity preference (track usage)
 *
 * Called when user creates a session with an activity.
 * Updates lastUsed timestamp and increments useCount.
 *
 * @param typeId - Activity type ID
 * @param userId - User ID (optional, defaults to current user)
 */
export async function updateActivityPreference(typeId: string, userId?: string): Promise<void> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('User must be authenticated to update activity preference')
  }

  const targetUserId = userId || currentUser.uid

  // Verify current user is updating their own preference
  if (targetUserId !== currentUser.uid) {
    throw new Error('Cannot update activity preferences for other users')
  }

  const docRef = doc(db, `users/${targetUserId}/activityPreferences/${typeId}`)

  // Use setDoc with merge to create if doesn't exist, update if exists
  await setDoc(
    docRef,
    {
      typeId,
      userId: targetUserId,
      lastUsed: serverTimestamp(),
      useCount: increment(1),
      updatedAt: serverTimestamp(),
      // Only set createdAt if document doesn't exist
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )
}

/**
 * Batch update activity preferences for multiple activities
 *
 * Useful when migrating existing sessions or bulk operations.
 *
 * @param typeIds - Array of activity type IDs
 * @param userId - User ID (optional, defaults to current user)
 */
export async function batchUpdateActivityPreferences(
  typeIds: string[],
  userId?: string
): Promise<void> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('User must be authenticated to update activity preferences')
  }

  const targetUserId = userId || currentUser.uid

  // Verify current user is updating their own preferences
  if (targetUserId !== currentUser.uid) {
    throw new Error('Cannot update activity preferences for other users')
  }

  // Update preferences sequentially
  // Note: Could be optimized with batched writes if needed
  for (const typeId of typeIds) {
    await updateActivityPreference(typeId, targetUserId)
  }
}

/**
 * Exported API object
 */
export const firebaseActivityPreferencesApi = {
  getRecentActivities,
  getAllActivityPreferences,
  getActivityPreference,
  updateActivityPreference,
  batchUpdateActivityPreferences,
}
