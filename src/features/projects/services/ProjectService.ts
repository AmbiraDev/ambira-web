/**
 * Project Service - Business Logic Layer
 *
 * Orchestrates business workflows for projects (activities).
 * No React dependencies - pure TypeScript for testability.
 *
 * Note: Projects are now called "Activities" in the codebase,
 * but we maintain backwards compatibility with Project naming.
 */

import { firebaseApi } from '@/lib/api';
import {
  Project,
  // Activity,
  CreateProjectData,
  UpdateProjectData,
  ProjectStats,
  // ActivityStats,
} from '@/types';
import {
  validateOrThrow,
  CreateProjectSchema,
  UpdateProjectSchema,
} from '@/lib/validation';

export class ProjectService {
  /**
   * Get all projects (activities) for the current user
   */
  async getProjects(): Promise<Project[]> {
    try {
      return await firebaseApi.project.getProjects();
    } catch (_err) {
      console.error('Error getting projects:', _err);
      return [];
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    try {
      return await firebaseApi.project.getProjectById(projectId);
    } catch (_err) {
      console.error('Error getting project:', _err);
      return null;
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<ProjectStats | null> {
    try {
      return await firebaseApi.project.getProjectStats(projectId);
    } catch (_err) {
      console.error('Error getting project stats:', _err);
      return null;
    }
  }

  /**
   * Create a new project
   */
  async createProject(data: unknown): Promise<Project> {
    const validated = validateOrThrow(CreateProjectSchema, data);
    return firebaseApi.project.createProject(validated as CreateProjectData);
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, data: unknown): Promise<Project> {
    const validated = validateOrThrow(UpdateProjectSchema, data);
    return firebaseApi.project.updateProject(
      projectId,
      validated as UpdateProjectData
    );
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    return firebaseApi.project.deleteProject(projectId);
  }

  /**
   * Archive a project
   */
  async archiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { status: 'archived' });
  }

  /**
   * Restore an archived project
   */
  async restoreProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { status: 'active' });
  }
}
