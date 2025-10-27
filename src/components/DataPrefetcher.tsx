'use client';

/**
 * DataPrefetcher Component
 *
 * Prefetches commonly needed data in the background to improve perceived performance.
 * This component doesn't render anything - it just triggers data fetching.
 */

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFollowingList } from '@/features/search/hooks/useFollowingList';

export function DataPrefetcher() {
  const { user } = useAuth();

  // Prefetch following list immediately when user is authenticated
  // This ensures it's available instantly when they navigate to search
  useFollowingList({
    userId: user?.id,
    enabled: !!user,
  });

  return null; // This component doesn't render anything
}
