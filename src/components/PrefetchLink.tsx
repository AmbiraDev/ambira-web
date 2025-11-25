import React, { useCallback } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { firebaseUserApi } from '@/lib/api'
import { CACHE_KEYS } from '@/lib/queryClient'

interface PrefetchLinkProps extends React.ComponentProps<typeof Link> {
  prefetchProfile?: string // username to prefetch
  prefetchUserId?: string // user ID to prefetch stats
  children: React.ReactNode
}

/**
 * Enhanced Link component that prefetches data on hover for better UX.
 * Use this for profile links, group links, etc. to load data before navigation.
 */
export function PrefetchLink({
  prefetchProfile,
  prefetchUserId,
  children,
  ...linkProps
}: PrefetchLinkProps) {
  const queryClient = useQueryClient()

  const handleMouseEnter = useCallback(() => {
    // Prefetch user profile by username
    if (prefetchProfile) {
      queryClient.prefetchQuery({
        queryKey: ['user', 'profile', 'username', prefetchProfile],
        queryFn: () => firebaseUserApi.getUserProfile(prefetchProfile),
        staleTime: 15 * 60 * 1000, // 15 minutes
      })
    }

    // Prefetch user stats by ID
    if (prefetchUserId) {
      queryClient.prefetchQuery({
        queryKey: CACHE_KEYS.USER_STATS(prefetchUserId),
        queryFn: () => firebaseUserApi.getUserStats(prefetchUserId),
        staleTime: 60 * 60 * 1000, // 1 hour
      })
    }
  }, [prefetchProfile, prefetchUserId, queryClient])

  return (
    <Link {...linkProps} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  )
}
