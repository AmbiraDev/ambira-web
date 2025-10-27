/**
 * Search Groups Hook
 *
 * Optimized React Query hook for searching groups with:
 * - Client-side filtering from cached group list
 * - Automatic caching and deduplication
 * - Reduced Firebase reads
 */

import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query as firestoreQuery,
  orderBy,
  limit as limitFn,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CACHE_TIMES } from '@/lib/queryClient';

interface GroupSearchResult {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  memberCount: number;
  members: number;
  category?: string;
  location?: string;
}

interface UseSearchGroupsOptions {
  searchTerm: string;
  enabled?: boolean;
  limit?: number;
}

interface UseSearchGroupsReturn {
  groups: GroupSearchResult[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useSearchGroups({
  searchTerm,
  enabled = true,
  limit = 50,
}: UseSearchGroupsOptions): UseSearchGroupsReturn {
  const trimmedTerm = searchTerm.trim().toLowerCase();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', 'groups', trimmedTerm, limit],
    queryFn: async () => {
      // Fetch all groups once and cache them
      const groupsSnapshot = await getDocs(
        firestoreQuery(
          collection(db, 'groups'),
          orderBy('memberCount', 'desc'),
          limitFn(limit)
        )
      );

      const allGroups: GroupSearchResult[] = groupsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          memberCount: data.memberCount,
          members: data.memberCount,
          category: data.category,
          location: data.location,
        };
      });

      // Client-side filtering if there's a search term
      if (!trimmedTerm) {
        return allGroups;
      }

      return allGroups.filter(
        group =>
          group.name.toLowerCase().includes(trimmedTerm) ||
          group.description?.toLowerCase().includes(trimmedTerm)
      );
    },
    enabled,
    staleTime: CACHE_TIMES.LONG, // 15 minutes - groups don't change often
    gcTime: CACHE_TIMES.VERY_LONG, // 1 hour
    refetchOnWindowFocus: false,
  });

  return {
    groups: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
