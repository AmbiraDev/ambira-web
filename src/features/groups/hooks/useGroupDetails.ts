/**
 * @deprecated Use the new React Query hooks from './useGroups' instead
 *
 * MIGRATION GUIDE:
 * Old: const { group, isLoading, error } = useGroupDetails(groupId);
 * New: const { data: group, isLoading, error } = useGroupDetails(groupId);
 *
 * The new hook is imported from the same location but uses React Query for caching.
 * This file is kept for backwards compatibility and will be removed in a future version.
 */

import { useGroupDetails as useGroupDetailsNew } from './useGroups'

/**
 * @deprecated Import from './useGroups' or '@/features/groups/hooks' instead
 */
export function useGroupDetails(groupId: string) {
  const { data, isLoading, error, refetch } = useGroupDetailsNew(groupId)

  return {
    group: data,
    isLoading,
    error,
    refetch,
  }
}
