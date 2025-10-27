/**
 * Project Mutation Hooks - React Query Boundary
 *
 * All write operations for projects (create, update, delete, archive).
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { ProjectService } from '../services/ProjectService';
import { PROJECT_KEYS } from './useProjects';
import { Project, CreateProjectData, UpdateProjectData } from '@/types';

const projectService = new ProjectService();

/**
 * Create a new project
 *
 * @example
 * const createMutation = useCreateProject();
 * createMutation.mutate({
 *   name: 'My Project',
 *   description: 'Project description',
 *   icon: '📚',
 *   color: '#3B82F6',
 *   weeklyTarget: 10
 * });
 */
export function useCreateProject(
  options?: Partial<UseMutationOptions<Project, Error, CreateProjectData>>
) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectData>({
    mutationFn: data => projectService.createProject(data),

    onMutate: async newProject => {
      await queryClient.cancelQueries({ queryKey: PROJECT_KEYS.list() });

      const previousProjects = queryClient.getQueryData(PROJECT_KEYS.list());

      // Optimistically add to the list
      queryClient.setQueryData<Project[]>(PROJECT_KEYS.list(), old => {
        if (!old) return old;

        const optimisticProject: Project = {
          id: `temp-${Date.now()}`,
          userId: '', // Will be set by server
          name: newProject.name,
          description: newProject.description,
          icon: newProject.icon,
          color: newProject.color,
          weeklyTarget: newProject.weeklyTarget,
          totalTarget: newProject.totalTarget,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return [...old, optimisticProject];
      });

      return { previousProjects };
    },

    onError: (error, variables, context: unknown) => {
      if (
        context &&
        typeof context === 'object' &&
        'previousProjects' in context &&
        context.previousProjects
      ) {
        queryClient.setQueryData(PROJECT_KEYS.list(), context.previousProjects);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list() });
    },

    ...options,
  });
}

/**
 * Update a project
 *
 * @example
 * const updateMutation = useUpdateProject();
 * updateMutation.mutate({
 *   projectId: 'abc123',
 *   data: { name: 'Updated Name', weeklyTarget: 15 }
 * });
 */
export function useUpdateProject(
  options?: Partial<
    UseMutationOptions<
      Project,
      Error,
      { projectId: string; data: UpdateProjectData }
    >
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    { projectId: string; data: UpdateProjectData }
  >({
    mutationFn: ({ projectId, data }) =>
      projectService.updateProject(projectId, data),

    onMutate: async ({ projectId, data }) => {
      await queryClient.cancelQueries({
        queryKey: PROJECT_KEYS.detail(projectId),
      });
      await queryClient.cancelQueries({ queryKey: PROJECT_KEYS.list() });

      const previousProject = queryClient.getQueryData(
        PROJECT_KEYS.detail(projectId)
      );
      const previousProjects = queryClient.getQueryData(PROJECT_KEYS.list());

      // Optimistically update project detail
      queryClient.setQueryData<Project | null>(
        PROJECT_KEYS.detail(projectId),
        old => {
          if (!old) return old;
          return { ...old, ...data, updatedAt: new Date() };
        }
      );

      // Optimistically update in project list
      queryClient.setQueryData<Project[]>(PROJECT_KEYS.list(), old => {
        if (!old) return old;
        return old.map(project =>
          project.id === projectId
            ? { ...project, ...data, updatedAt: new Date() }
            : project
        );
      });

      return { previousProject, previousProjects };
    },

    onError: (error, { projectId }, context: unknown) => {
      if (
        context &&
        typeof context === 'object' &&
        'previousProject' in context &&
        context.previousProject
      ) {
        queryClient.setQueryData(
          PROJECT_KEYS.detail(projectId),
          context.previousProject
        );
      }
      if (
        context &&
        typeof context === 'object' &&
        'previousProjects' in context &&
        context.previousProjects
      ) {
        queryClient.setQueryData(PROJECT_KEYS.list(), context.previousProjects);
      }
    },

    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.detail(projectId),
      });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list() });
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.stats(projectId),
      });
    },

    ...options,
  });
}

/**
 * Delete a project
 *
 * @example
 * const deleteMutation = useDeleteProject();
 * deleteMutation.mutate('project-123');
 */
export function useDeleteProject(
  options?: Partial<UseMutationOptions<void, Error, string>>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: projectId => projectService.deleteProject(projectId),

    onMutate: async projectId => {
      await queryClient.cancelQueries({ queryKey: PROJECT_KEYS.list() });

      const previousProjects = queryClient.getQueryData(PROJECT_KEYS.list());

      // Optimistically remove from list
      queryClient.setQueryData<Project[]>(PROJECT_KEYS.list(), old => {
        if (!old) return old;
        return old.filter(project => project.id !== projectId);
      });

      return { previousProjects };
    },

    onError: (error, projectId, context: unknown) => {
      if (
        context &&
        typeof context === 'object' &&
        'previousProjects' in context &&
        context.previousProjects
      ) {
        queryClient.setQueryData(PROJECT_KEYS.list(), context.previousProjects);
      }
    },

    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list() });
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.stats(projectId),
      });
    },

    ...options,
  });
}

/**
 * Archive a project
 *
 * @example
 * const archiveMutation = useArchiveProject();
 * archiveMutation.mutate('project-123');
 */
export function useArchiveProject(
  options?: Partial<UseMutationOptions<Project, Error, string>>
) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, string>({
    mutationFn: projectId => projectService.archiveProject(projectId),

    onMutate: async projectId => {
      await queryClient.cancelQueries({
        queryKey: PROJECT_KEYS.detail(projectId),
      });
      await queryClient.cancelQueries({ queryKey: PROJECT_KEYS.list() });

      const previousProject = queryClient.getQueryData(
        PROJECT_KEYS.detail(projectId)
      );
      const previousProjects = queryClient.getQueryData(PROJECT_KEYS.list());

      // Optimistically update status
      const updateStatus = (project: Project) => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          status: 'archived' as const,
          updatedAt: new Date(),
        };
      };

      queryClient.setQueryData<Project | null>(
        PROJECT_KEYS.detail(projectId),
        old => (old ? updateStatus(old) : old)
      );

      queryClient.setQueryData<Project[]>(PROJECT_KEYS.list(), old => {
        if (!old) return old;
        return old.map(updateStatus);
      });

      return { previousProject, previousProjects };
    },

    onError: (error, projectId, context: unknown) => {
      if (context && typeof context === 'object' && 'previousProject' in context && context.previousProject) {
        queryClient.setQueryData(
          PROJECT_KEYS.detail(projectId),
          context.previousProject
        );
      }
      if (context && typeof context === 'object' && 'previousProjects' in context && context.previousProjects) {
        queryClient.setQueryData(PROJECT_KEYS.list(), context.previousProjects);
      }
    },

    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.detail(projectId),
      });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list() });
    },

    ...options,
  });
}

/**
 * Restore an archived project
 *
 * @example
 * const restoreMutation = useRestoreProject();
 * restoreMutation.mutate('project-123');
 */
export function useRestoreProject(
  options?: Partial<UseMutationOptions<Project, Error, string>>
) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, string>({
    mutationFn: projectId => projectService.restoreProject(projectId),

    onMutate: async projectId => {
      await queryClient.cancelQueries({
        queryKey: PROJECT_KEYS.detail(projectId),
      });
      await queryClient.cancelQueries({ queryKey: PROJECT_KEYS.list() });

      const previousProject = queryClient.getQueryData(
        PROJECT_KEYS.detail(projectId)
      );
      const previousProjects = queryClient.getQueryData(PROJECT_KEYS.list());

      // Optimistically update status
      const updateStatus = (project: Project) => {
        if (project.id !== projectId) return project;
        return { ...project, status: 'active' as const, updatedAt: new Date() };
      };

      queryClient.setQueryData<Project | null>(
        PROJECT_KEYS.detail(projectId),
        old => (old ? updateStatus(old) : old)
      );

      queryClient.setQueryData<Project[]>(PROJECT_KEYS.list(), old => {
        if (!old) return old;
        return old.map(updateStatus);
      });

      return { previousProject, previousProjects };
    },

    onError: (error, projectId, context: unknown) => {
      if (context && typeof context === 'object' && 'previousProject' in context && context.previousProject) {
        queryClient.setQueryData(
          PROJECT_KEYS.detail(projectId),
          context.previousProject
        );
      }
      if (context && typeof context === 'object' && 'previousProjects' in context && context.previousProjects) {
        queryClient.setQueryData(PROJECT_KEYS.list(), context.previousProjects);
      }
    },

    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.detail(projectId),
      });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list() });
    },

    ...options,
  });
}

/**
 * Helper hook to invalidate project data
 *
 * @example
 * const invalidateProject = useInvalidateProject();
 * invalidateProject(projectId);
 */
export function useInvalidateProject() {
  const queryClient = useQueryClient();

  return (projectId: string) => {
    queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.stats(projectId) });
  };
}

/**
 * Helper hook to invalidate all projects
 *
 * @example
 * const invalidateAllProjects = useInvalidateAllProjects();
 * invalidateAllProjects();
 */
export function useInvalidateAllProjects() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all() });
  };
}
