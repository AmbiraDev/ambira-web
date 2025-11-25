/**
 * Project Hooks - Public API
 *
 * All project-related hooks exported from here.
 *
 * @example
 * import { useProjects, useProject, useCreateProject } from '@/features/projects/hooks';
 */

// Query hooks
export { useProjects, useProject, useProjectStats, PROJECT_KEYS } from './useProjects'

// Mutation hooks
export {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useArchiveProject,
  useRestoreProject,
  useInvalidateProject,
  useInvalidateAllProjects,
} from './useProjectMutations'
