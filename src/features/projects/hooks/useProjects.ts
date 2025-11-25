/**
 * Project Query Hooks - React Query Boundary
 *
 * This is the ONLY place where React Query should be used for projects.
 * All components should use these hooks instead of direct React Query or firebaseApi calls.
 *
 * Note: Projects are now called "Activities" in the codebase but we maintain
 * backwards compatibility with Project naming.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { ProjectService } from '../services/ProjectService'
import { Project, ProjectStats } from '@/types'
import { STANDARD_CACHE_TIMES } from '@/lib/react-query'

const projectService = new ProjectService()

// ==================== CACHE KEYS ====================

export const PROJECT_KEYS = {
  all: () => ['projects'] as const,
  lists: () => [...PROJECT_KEYS.all(), 'list'] as const,
  list: () => [...PROJECT_KEYS.lists()] as const,
  details: () => [...PROJECT_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...PROJECT_KEYS.details(), id] as const,
  stats: (id: string) => [...PROJECT_KEYS.detail(id), 'stats'] as const,
}

// ==================== QUERY HOOKS ====================

/**
 * Get all projects for the current user
 *
 * @example
 * const { data: projects, isLoading, error } = useProjects();
 */
export function useProjects(options?: Partial<UseQueryOptions<Project[], Error>>) {
  return useQuery<Project[], Error>({
    queryKey: PROJECT_KEYS.list(),
    queryFn: () => projectService.getProjects(),
    staleTime: STANDARD_CACHE_TIMES.LONG, // 15 minutes - projects don't change often
    ...options,
  })
}

/**
 * Get a single project by ID
 *
 * @example
 * const { data: project, isLoading } = useProject(projectId);
 */
export function useProject(
  projectId: string,
  options?: Partial<UseQueryOptions<Project | null, Error>>
) {
  return useQuery<Project | null, Error>({
    queryKey: PROJECT_KEYS.detail(projectId),
    queryFn: () => projectService.getProject(projectId),
    staleTime: STANDARD_CACHE_TIMES.LONG,
    enabled: !!projectId,
    ...options,
  })
}

/**
 * Get project statistics
 *
 * @example
 * const { data: stats, isLoading } = useProjectStats(projectId);
 */
export function useProjectStats(
  projectId: string,
  options?: Partial<UseQueryOptions<ProjectStats | null, Error>>
) {
  return useQuery<ProjectStats | null, Error>({
    queryKey: PROJECT_KEYS.stats(projectId),
    queryFn: () => projectService.getProjectStats(projectId),
    staleTime: STANDARD_CACHE_TIMES.MEDIUM, // 5 minutes - stats change more frequently
    enabled: !!projectId,
    ...options,
  })
}
