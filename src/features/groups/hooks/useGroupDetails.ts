/**
 * useGroupDetails Hook
 *
 * React hook for fetching group details using the GroupService.
 * Provides loading states and error handling.
 */

import { useState, useEffect } from 'react';
import { Group } from '@/domain/entities/Group';
import { GroupService } from '../services/GroupService';

interface UseGroupDetailsResult {
  group: Group | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useGroupDetails(groupId: string): UseGroupDetailsResult {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const groupService = new GroupService();

  const fetchGroup = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedGroup = await groupService.getGroupDetails(groupId);
      setGroup(fetchedGroup);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch group');
      setError(error);
      console.error('Error fetching group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  return {
    group,
    isLoading,
    error,
    refetch: fetchGroup
  };
}
