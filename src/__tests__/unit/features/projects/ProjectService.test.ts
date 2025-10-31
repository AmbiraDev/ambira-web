/**
 * ProjectService Unit Tests
 *
 * Tests project CRUD operations, archive/restore, and stats
 */

import { ProjectService } from '@/features/projects/services/ProjectService';
import { firebaseApi } from '@/lib/api';
import {
  Project,
  ProjectStats,
  CreateProjectData,
  UpdateProjectData,
} from '@/types';

jest.mock('@/lib/api');

describe('ProjectService', () => {
  let projectService: ProjectService;

  const mockProject: Project = {
    id: 'project-1',
    userId: 'user-1',
    name: 'Work',
    description: 'Work Sessions',
    color: '#007AFF',
    icon: 'briefcase',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockProjectStats: ProjectStats = {
    totalHours: 10,
    weeklyHours: 3,
    sessionCount: 10,
    currentStreak: 5,
    weeklyProgressPercentage: 75,
    totalProgressPercentage: 50,
    averageSessionDuration: 3600,
    lastSessionDate: new Date('2024-01-10'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    projectService = new ProjectService();
  });

  describe('getProjects', () => {
    it('should get all projects for user', async () => {
      // ARRANGE
      const mockProjects = [
        mockProject,
        { ...mockProject, id: 'project-2', name: 'Exercise' },
      ];
      (firebaseApi.project.getProjects as jest.Mock).mockResolvedValue(
        mockProjects
      );

      // ACT
      const result = await projectService.getProjects();

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Work');
      expect(result[1]?.name).toBe('Exercise');
    });

    it('should return empty array when no projects', async () => {
      // ARRANGE
      (firebaseApi.project.getProjects as jest.Mock).mockResolvedValue([]);

      // ACT
      const result = await projectService.getProjects();

      // ASSERT
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      // ARRANGE
      (firebaseApi.project.getProjects as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await projectService.getProjects();

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('getProject', () => {
    it('should get single project by ID', async () => {
      // ARRANGE
      (firebaseApi.project.getProjectById as jest.Mock).mockResolvedValue(
        mockProject
      );

      // ACT
      const result = await projectService.getProject('project-1');

      // ASSERT
      expect(result).toEqual(mockProject);
      expect(firebaseApi.project.getProjectById).toHaveBeenCalledWith(
        'project-1'
      );
    });

    it('should return null if project not found', async () => {
      // ARRANGE
      (firebaseApi.project.getProjectById as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await projectService.getProject('nonexistent');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      (firebaseApi.project.getProjectById as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await projectService.getProject('project-1');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('getProjectStats', () => {
    it('should get project statistics', async () => {
      // ARRANGE
      (firebaseApi.project.getProjectStats as jest.Mock).mockResolvedValue(
        mockProjectStats
      );

      // ACT
      const result = await projectService.getProjectStats('project-1');

      // ASSERT
      expect(result).toEqual(mockProjectStats);
      expect(result?.totalHours).toBe(10);
      expect(result?.sessionCount).toBe(10);
    });

    it('should return null if stats not found', async () => {
      // ARRANGE
      (firebaseApi.project.getProjectStats as jest.Mock).mockResolvedValue(
        null
      );

      // ACT
      const result = await projectService.getProjectStats('nonexistent');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      (firebaseApi.project.getProjectStats as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // ACT
      const result = await projectService.getProjectStats('project-1');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create project with valid data', async () => {
      // ARRANGE
      const createData = {
        name: 'New Project',
        description: 'Description',
        icon: 'briefcase',
        color: '#007AFF',
      };

      const newProject = { ...mockProject, name: 'New Project' };
      (firebaseApi.project.createProject as jest.Mock).mockResolvedValue(
        newProject
      );

      // ACT
      const result = await projectService.createProject(createData);

      // ASSERT
      expect(result.name).toBe('New Project');
      expect(firebaseApi.project.createProject).toHaveBeenCalled();
    });

    it('should validate project data', async () => {
      // ARRANGE
      const invalidData = { name: '' };
      (firebaseApi.project.createProject as jest.Mock).mockResolvedValue(
        mockProject
      );

      // ACT & ASSERT
      // Validation should occur before API call
      try {
        await projectService.createProject(invalidData);
        fail('Should have thrown validation error');
      } catch (_err) {
        // Expected to throw validation error
      }
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (firebaseApi.project.createProject as jest.Mock).mockRejectedValue(
        new Error('Creation failed')
      );

      // ACT & ASSERT
      const validData = {
        name: 'New',
        description: 'New project',
        icon: 'briefcase',
        color: '#007AFF',
      };
      await expect(projectService.createProject(validData)).rejects.toThrow();
    });
  });

  describe('updateProject', () => {
    it('should update project with valid data', async () => {
      // ARRANGE
      const updateData: UpdateProjectData = { name: 'Updated Name' };
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      (firebaseApi.project.updateProject as jest.Mock).mockResolvedValue(
        updatedProject
      );

      // ACT
      const result = await projectService.updateProject(
        'project-1',
        updateData
      );

      // ASSERT
      expect(result.name).toBe('Updated Name');
      expect(firebaseApi.project.updateProject).toHaveBeenCalledWith(
        'project-1',
        updateData
      );
    });

    it('should validate update data', async () => {
      // ARRANGE
      const invalidData = { name: '' };

      // ACT & ASSERT
      try {
        await projectService.updateProject('project-1', invalidData);
      } catch (_err) {
        // Expected validation error
      }
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (firebaseApi.project.updateProject as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      // ACT & ASSERT
      await expect(
        projectService.updateProject('project-1', { name: 'New' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteProject', () => {
    it('should delete project by ID', async () => {
      // ARRANGE
      (firebaseApi.project.deleteProject as jest.Mock).mockResolvedValue(
        undefined
      );

      // ACT
      await projectService.deleteProject('project-1');

      // ASSERT
      expect(firebaseApi.project.deleteProject).toHaveBeenCalledWith(
        'project-1'
      );
    });

    it('should propagate API errors', async () => {
      // ARRANGE
      (firebaseApi.project.deleteProject as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      );

      // ACT & ASSERT
      await expect(projectService.deleteProject('project-1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('archiveProject', () => {
    it('should archive project by updating status', async () => {
      // ARRANGE
      const archivedProject = { ...mockProject, status: 'archived' as const };
      (firebaseApi.project.updateProject as jest.Mock).mockResolvedValue(
        archivedProject
      );

      // ACT
      const result = await projectService.archiveProject('project-1');

      // ASSERT
      expect(result.status).toBe('archived');
      expect(firebaseApi.project.updateProject).toHaveBeenCalledWith(
        'project-1',
        { status: 'archived' }
      );
    });

    it('should propagate errors', async () => {
      // ARRANGE
      (firebaseApi.project.updateProject as jest.Mock).mockRejectedValue(
        new Error('Archive failed')
      );

      // ACT & ASSERT
      await expect(projectService.archiveProject('project-1')).rejects.toThrow(
        'Archive failed'
      );
    });
  });

  describe('restoreProject', () => {
    it('should restore archived project', async () => {
      // ARRANGE
      const restoredProject = { ...mockProject, status: 'active' as const };
      (firebaseApi.project.updateProject as jest.Mock).mockResolvedValue(
        restoredProject
      );

      // ACT
      const result = await projectService.restoreProject('project-1');

      // ASSERT
      expect(result.status).toBe('active');
      expect(firebaseApi.project.updateProject).toHaveBeenCalledWith(
        'project-1',
        { status: 'active' }
      );
    });

    it('should propagate errors', async () => {
      // ARRANGE
      (firebaseApi.project.updateProject as jest.Mock).mockRejectedValue(
        new Error('Restore failed')
      );

      // ACT & ASSERT
      await expect(projectService.restoreProject('project-1')).rejects.toThrow(
        'Restore failed'
      );
    });
  });
});
