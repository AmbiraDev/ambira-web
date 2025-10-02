'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Project, 
  ProjectStats, 
  CreateProjectData, 
  UpdateProjectData, 
  ProjectContextType 
} from '@/types';
import { firebaseProjectApi } from '@/lib/firebaseApi';
import { useAuth } from './AuthContext';

// Create context
const ProjectsContext = createContext<ProjectContextType | undefined>(undefined);

// Custom hook to use projects context
export const useProjects = (): ProjectContextType => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

// Custom hook to get a single project
export const useProject = (id: string): { project: Project | null; isLoading: boolean; error: string | null } => {
  const { projects, isLoading } = useProjects();
  const project = projects.find(p => p.id === id) || null;
  
  return {
    project,
    isLoading,
    error: null, // Could be enhanced to track individual project errors
  };
};

// Projects provider component
interface ProjectsProviderProps {
  children: ReactNode;
}

export const ProjectsProvider: React.FC<ProjectsProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch projects when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProjects();
    } else {
      setProjects([]);
      setError(null);
    }
  }, [isAuthenticated, user]);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedProjects = await firebaseProjectApi.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new project
  const createProject = async (data: CreateProjectData): Promise<Project> => {
    try {
      setError(null);
      
      const newProject = await firebaseProjectApi.createProject(data);
      
      // Add to local state
      setProjects(prev => [...prev, newProject]);
      
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update project
  const updateProject = async (id: string, data: UpdateProjectData): Promise<Project> => {
    try {
      setError(null);
      
      const updatedProject = await firebaseProjectApi.updateProject(id, data);
      
      // Update local state
      setProjects(prev => 
        prev.map(p => p.id === id ? updatedProject : p)
      );
      
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete project
  const deleteProject = async (id: string): Promise<void> => {
    try {
      setError(null);
      
      await firebaseProjectApi.deleteProject(id);
      
      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Archive project
  const archiveProject = async (id: string): Promise<Project> => {
    return updateProject(id, { status: 'archived' });
  };

  // Restore project
  const restoreProject = async (id: string): Promise<Project> => {
    return updateProject(id, { status: 'active' });
  };

  // Get project statistics
  const getProjectStats = async (id: string): Promise<ProjectStats> => {
    try {
      setError(null);
      
      // TODO: Implement Firebase project stats
      // For now, return default stats
      return {
        totalHours: 0,
        weeklyHours: 0,
        sessionCount: 0,
        currentStreak: 0,
        weeklyProgressPercentage: 0
      };
    } catch (err) {
      console.error('Error fetching project stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value: ProjectContextType = {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject,
    getProjectStats,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};
