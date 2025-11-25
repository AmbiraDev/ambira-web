/**
 * Activity Types Query Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for activity types.
 * All components should use these hooks instead of direct API calls.
 *
 * Cache Strategy:
 * - System activity types: 24 hours (rarely change)
 * - Custom activities: 15 minutes
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { ActivityType } from '@/types'
import { CACHE_TIMES } from '@/lib/queryClient'
import {
  getSystemActivityTypes,
  getUserCustomActivityTypes,
  getAllActivityTypes,
  createCustomActivityType,
  updateCustomActivityType,
  deleteCustomActivityType,
  type ActivityType as ApiActivityType,
  type CreateCustomActivityTypeData,
  type UpdateCustomActivityTypeData,
} from '@/lib/api/activityTypes'
import { useAuth } from './useAuth'

// ==================== TYPE CONVERTERS ====================

/**
 * Convert API ActivityType to shared ActivityType
 * Both now use the same structure (defaultColor and Date)
 */
function convertApiActivityType(apiType: ApiActivityType): ActivityType {
  return {
    id: apiType.id,
    name: apiType.name,
    category: apiType.category,
    icon: apiType.icon,
    defaultColor: apiType.defaultColor,
    isSystem: apiType.isSystem,
    userId: apiType.userId,
    order: apiType.order,
    description: apiType.description,
    createdAt: apiType.createdAt, // Already a Date
    updatedAt: apiType.updatedAt, // Already a Date
  }
}

// ==================== CACHE KEYS ====================

export const ACTIVITY_TYPE_KEYS = {
  all: () => ['activityTypes'] as const,
  system: () => [...ACTIVITY_TYPE_KEYS.all(), 'system'] as const,
  custom: (userId: string) => [...ACTIVITY_TYPE_KEYS.all(), 'custom', userId] as const,
  combined: (userId: string) => [...ACTIVITY_TYPE_KEYS.all(), 'combined', userId] as const,
}

// ==================== QUERY HOOKS ====================

/**
 * Get system activity types (10 defaults)
 *
 * Cached for 24 hours as system types rarely change.
 *
 * @example
 * const { data: systemTypes, isLoading } = useSystemActivityTypes();
 */
export function useSystemActivityTypes(options?: Partial<UseQueryOptions<ActivityType[], Error>>) {
  return useQuery<ActivityType[], Error>({
    queryKey: ACTIVITY_TYPE_KEYS.system(),
    queryFn: async () => {
      const apiTypes = await getSystemActivityTypes()
      return apiTypes.map(convertApiActivityType)
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
    ...options,
  })
}

/**
 * Get user's custom activity types
 *
 * Cached for 15 minutes as custom types can change.
 *
 * @example
 * const { data: customTypes, isLoading } = useUserCustomActivityTypes(userId);
 */
export function useUserCustomActivityTypes(
  userId: string,
  options?: Partial<UseQueryOptions<ActivityType[], Error>>
) {
  return useQuery<ActivityType[], Error>({
    queryKey: ACTIVITY_TYPE_KEYS.custom(userId),
    queryFn: async () => {
      const apiTypes = await getUserCustomActivityTypes(userId)
      return apiTypes.map(convertApiActivityType)
    },
    staleTime: CACHE_TIMES.LONG, // 15 minutes
    gcTime: CACHE_TIMES.LONG,
    enabled: !!userId,
    ...options,
  })
}

/**
 * Get all activity types (system + custom)
 *
 * Combines system defaults and user custom activities.
 * Cached for 15 minutes (limited by custom types cache).
 *
 * @example
 * const { data: allTypes, isLoading } = useAllActivityTypes(userId);
 */
export function useAllActivityTypes(
  userId: string,
  options?: Partial<UseQueryOptions<ActivityType[], Error>>
) {
  return useQuery<ActivityType[], Error>({
    queryKey: ACTIVITY_TYPE_KEYS.combined(userId),
    queryFn: async () => {
      const apiTypes = await getAllActivityTypes(userId)
      return apiTypes.map(convertApiActivityType)
    },
    staleTime: CACHE_TIMES.LONG, // 15 minutes
    gcTime: CACHE_TIMES.LONG,
    enabled: !!userId,
    ...options,
  })
}

// ==================== MUTATION HOOKS ====================

// Context types for mutation rollbacks
type CreateCustomActivityContext = {
  previousCustomTypes: unknown
  previousCombinedTypes: unknown
}
type UpdateCustomActivityContext = {
  previousCustomTypes: unknown
  previousCombinedTypes: unknown
}
type DeleteCustomActivityContext = {
  previousCustomTypes: unknown
  previousCombinedTypes: unknown
}

/**
 * Create a custom activity type
 *
 * @example
 * const createMutation = useCreateCustomActivity();
 * createMutation.mutate({
 *   name: 'Guitar Practice',
 *   icon: '🎸',
 *   color: '#FF6B6B',
 *   description: 'Practice guitar and music theory'
 * });
 */
export function useCreateCustomActivity(
  options?: Partial<
    UseMutationOptions<
      ActivityType,
      Error,
      CreateCustomActivityTypeData,
      CreateCustomActivityContext
    >
  >
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<
    ActivityType,
    Error,
    CreateCustomActivityTypeData,
    CreateCustomActivityContext
  >({
    mutationFn: async (data) => {
      if (!user) throw new Error('User not authenticated')
      const apiType = await createCustomActivityType(user.id, data)
      return convertApiActivityType(apiType)
    },

    onMutate: async (newActivity) => {
      if (!user) return { previousCustomTypes: null, previousCombinedTypes: null }

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_TYPE_KEYS.custom(user.id),
      })
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_TYPE_KEYS.combined(user.id),
      })

      // Snapshot previous values
      const previousCustomTypes = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
      const previousCombinedTypes = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.combined(user.id))

      // Optimistically add to custom types
      queryClient.setQueryData<ActivityType[]>(ACTIVITY_TYPE_KEYS.custom(user.id), (old) => {
        if (!old) return old

        const optimisticActivity: ActivityType = {
          id: `temp-${Date.now()}`,
          name: newActivity.name,
          category: newActivity.category || 'productivity',
          icon: newActivity.icon,
          defaultColor: newActivity.defaultColor,
          description: newActivity.description,
          isSystem: false,
          userId: user.id,
          order: 100, // Custom activities start at 100
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        return [...old, optimisticActivity]
      })

      // Optimistically add to combined types
      queryClient.setQueryData<ActivityType[]>(ACTIVITY_TYPE_KEYS.combined(user.id), (old) => {
        if (!old) return old

        const optimisticActivity: ActivityType = {
          id: `temp-${Date.now()}`,
          name: newActivity.name,
          category: newActivity.category || 'productivity',
          icon: newActivity.icon,
          defaultColor: newActivity.defaultColor,
          description: newActivity.description,
          isSystem: false,
          userId: user.id,
          order: 100, // Custom activities start at 100
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        return [...old, optimisticActivity]
      })

      return { previousCustomTypes, previousCombinedTypes }
    },

    onError: (error, variables, context) => {
      if (!user || !context) return

      // Rollback on error
      if (context.previousCustomTypes) {
        queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), context.previousCustomTypes)
      }
      if (context.previousCombinedTypes) {
        queryClient.setQueryData(
          ACTIVITY_TYPE_KEYS.combined(user.id),
          context.previousCombinedTypes
        )
      }
    },

    onSuccess: () => {
      if (!user) return

      // Invalidate to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_TYPE_KEYS.custom(user.id),
      })
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_TYPE_KEYS.combined(user.id),
      })
    },

    ...options,
  })
}

/**
 * Update a custom activity type
 *
 * @example
 * const updateMutation = useUpdateCustomActivity();
 * updateMutation.mutate({
 *   typeId: 'guitar',
 *   data: { name: 'Guitar & Music', color: '#FF5555' }
 * });
 */
export function useUpdateCustomActivity(
  options?: Partial<
    UseMutationOptions<
      ActivityType,
      Error,
      {
        typeId: string
        data: UpdateCustomActivityTypeData
      },
      UpdateCustomActivityContext
    >
  >
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<
    ActivityType,
    Error,
    {
      typeId: string
      data: UpdateCustomActivityTypeData
    },
    UpdateCustomActivityContext
  >({
    mutationFn: async ({ typeId, data }) => {
      if (!user) throw new Error('User not authenticated')
      const apiType = await updateCustomActivityType(typeId, user.id, data)
      return convertApiActivityType(apiType)
    },

    onMutate: async ({ typeId, data }) => {
      if (!user) return { previousCustomTypes: null, previousCombinedTypes: null }

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_TYPE_KEYS.custom(user.id),
      })
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_TYPE_KEYS.combined(user.id),
      })

      // Snapshot previous values
      const previousCustomTypes = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
      const previousCombinedTypes = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.combined(user.id))

      // Optimistically update custom types
      queryClient.setQueryData<ActivityType[]>(ACTIVITY_TYPE_KEYS.custom(user.id), (old) => {
        if (!old) return old
        return old.map((activity) =>
          activity.id === typeId
            ? {
                ...activity,
                ...data,
                updatedAt: new Date(),
              }
            : activity
        )
      })

      // Optimistically update combined types
      queryClient.setQueryData<ActivityType[]>(ACTIVITY_TYPE_KEYS.combined(user.id), (old) => {
        if (!old) return old
        return old.map((activity) =>
          activity.id === typeId
            ? {
                ...activity,
                ...data,
                updatedAt: new Date(),
              }
            : activity
        )
      })

      return { previousCustomTypes, previousCombinedTypes }
    },

    onError: (error, variables, context) => {
      if (!user || !context) return

      // Rollback on error
      if (context.previousCustomTypes) {
        queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), context.previousCustomTypes)
      }
      if (context.previousCombinedTypes) {
        queryClient.setQueryData(
          ACTIVITY_TYPE_KEYS.combined(user.id),
          context.previousCombinedTypes
        )
      }
    },

    onSuccess: () => {
      if (!user) return

      // Invalidate to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_TYPE_KEYS.custom(user.id),
      })
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_TYPE_KEYS.combined(user.id),
      })
    },

    ...options,
  })
}

/**
 * Delete a custom activity type
 *
 * @example
 * const deleteMutation = useDeleteCustomActivity();
 * deleteMutation.mutate('guitar-practice-123');
 */
export function useDeleteCustomActivity(
  options?: Partial<UseMutationOptions<void, Error, string, DeleteCustomActivityContext>>
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<void, Error, string, DeleteCustomActivityContext>({
    mutationFn: (typeId) => {
      if (!user) throw new Error('User not authenticated')
      return deleteCustomActivityType(typeId, user.id)
    },

    onMutate: async (typeId) => {
      if (!user) return { previousCustomTypes: null, previousCombinedTypes: null }

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_TYPE_KEYS.custom(user.id),
      })
      await queryClient.cancelQueries({
        queryKey: ACTIVITY_TYPE_KEYS.combined(user.id),
      })

      // Snapshot previous values
      const previousCustomTypes = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.custom(user.id))
      const previousCombinedTypes = queryClient.getQueryData(ACTIVITY_TYPE_KEYS.combined(user.id))

      // Optimistically remove from custom types
      queryClient.setQueryData<ActivityType[]>(ACTIVITY_TYPE_KEYS.custom(user.id), (old) => {
        if (!old) return old
        return old.filter((activity) => activity.id !== typeId)
      })

      // Optimistically remove from combined types
      queryClient.setQueryData<ActivityType[]>(ACTIVITY_TYPE_KEYS.combined(user.id), (old) => {
        if (!old) return old
        return old.filter((activity) => activity.id !== typeId)
      })

      return { previousCustomTypes, previousCombinedTypes }
    },

    onError: (error, typeId, context) => {
      if (!user || !context) return

      // Rollback on error
      if (context.previousCustomTypes) {
        queryClient.setQueryData(ACTIVITY_TYPE_KEYS.custom(user.id), context.previousCustomTypes)
      }
      if (context.previousCombinedTypes) {
        queryClient.setQueryData(
          ACTIVITY_TYPE_KEYS.combined(user.id),
          context.previousCombinedTypes
        )
      }
    },

    onSuccess: () => {
      if (!user) return

      // Invalidate to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_TYPE_KEYS.custom(user.id),
      })
      queryClient.invalidateQueries({
        queryKey: ACTIVITY_TYPE_KEYS.combined(user.id),
      })
    },

    ...options,
  })
}

// Export individual API functions if needed
export {
  getSystemActivityTypes,
  getUserCustomActivityTypes,
  getAllActivityTypes,
  createCustomActivityType,
  updateCustomActivityType,
  deleteCustomActivityType,
}
