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
  Activity,
  CreateProjectData,
  UpdateProjectData,
  ProjectStats,
  ActivityStats,
} from '@/types';

export class ProjectService {
  /**
   * Get all projects (activities) for the current user
   */
  async getProjects(): Promise<Project[]> {
    try {
      return await firebaseApi.project.getProjects();
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    try {
      return await firebaseApi.project.getProjectById(projectId);
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<ProjectStats | null> {
    try {
      return await firebaseApi.project.getProjectStats(projectId);
    } catch (error) {
      console.error('Error getting project stats:', error);
      return null;
    }
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    return firebaseApi.project.createProject(data);
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, data: UpdateProjectData): Promise<Project> {
    return firebaseApi.project.updateProject(projectId, data);
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
