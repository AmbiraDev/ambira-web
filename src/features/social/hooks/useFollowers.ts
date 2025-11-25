/**
 * useFollowers Hook
 *
 * Fetches the list of users who follow a given user.
 */

import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { STANDARD_CACHE_TIMES } from '@/lib/react-query'

export interface FollowerUser {
  id: string
  name: string
  username: string
  email: string
  profilePicture?: string
  bio?: string
}

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      // Try new social_graph structure first
      try {
        const inboundRef = collection(db, `social_graph/${userId}/inbound`)
        const inboundSnapshot = await getDocs(inboundRef)

        if (!inboundSnapshot.empty) {
          // Fetch user details for each follower
          const followerPromises = inboundSnapshot.docs.map(async (followerDoc) => {
            const followerId = followerDoc.id

            try {
              const userDoc = await getDoc(doc(db, 'users', followerId))

              if (!userDoc.exists()) {
                return null
              }

              const userData = userDoc.data()

              return {
                id: followerId,
                name: userData.name || 'Unknown User',
                username: userData.username || 'unknown',
                email: userData.email || '',
                profilePicture: userData.profilePicture,
                bio: userData.bio,
              } as FollowerUser
            } catch (_err) {
              // Failed to fetch follower user
              return null
            }
          })

          const followers = await Promise.all(followerPromises)
          return followers.filter((follower): follower is FollowerUser => follower !== null)
        }
      } catch (_err) {
        // If social_graph doesn't exist, fall through to old follows collection
      }

      // Fallback to old follows collection
      const followsRef = collection(db, 'follows')
      const followsQuery = query(followsRef, where('followingId', '==', userId))
      const followsSnapshot = await getDocs(followsQuery)

      const followerPromises = followsSnapshot.docs.map(async (followDoc) => {
        const followerId = followDoc.data().followerId

        try {
          const userDoc = await getDoc(doc(db, 'users', followerId))

          if (!userDoc.exists()) {
            return null
          }

          const userData = userDoc.data()

          return {
            id: followerId,
            name: userData.name || 'Unknown User',
            username: userData.username || 'unknown',
            email: userData.email || '',
            profilePicture: userData.profilePicture,
            bio: userData.bio,
          } as FollowerUser
        } catch (_err) {
          // Failed to fetch follower user
          return null
        }
      })

      const followers = await Promise.all(followerPromises)
      return followers.filter((follower): follower is FollowerUser => follower !== null)
    },
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes
    enabled: !!userId,
  })
}
