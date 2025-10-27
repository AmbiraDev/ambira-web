/**
 * Projects API Module
 * Handles project/activity management: CRUD operations and statistics
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Firebase imports
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// Local Firebase config
import { db, auth } from '@/lib/firebase';

// Error handling
import { handleError } from '@/lib/errorHandler';
import { checkRateLimit } from '@/lib/rateLimit';

// Shared utilities
import { convertTimestamp, removeUndefinedFields } from '../shared/utils';

// Types
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectStats,
} from '@/types';

export const firebaseProjectApi = {
  // Get all user's projects
  getProjects: async (): Promise<Project[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const projectsQuery = query(
        collection(db, 'projects', auth.currentUser.uid, 'userProjects'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(projectsQuery);
      const projects: Project[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          userId: auth.currentUser!.uid,
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          weeklyTarget: data.weeklyTarget,
          totalTarget: data.totalTarget,
          status: data.status || 'active',
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        });
      });

      return projects;
    } catch (error) {
      const apiError = handleError(error, 'Get projects', {
        defaultMessage: 'Failed to get projects',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Create new project
  createProject: async (data: CreateProjectData): Promise<Project> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Rate limitFn project creation
      checkRateLimit(auth.currentUser.uid, 'PROJECT_CREATE');

      const projectData = removeUndefinedFields({
        ...data,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(
        collection(db, 'projects', auth.currentUser.uid, 'userProjects'),
        projectData
      );

      return {
        id: docRef.id,
        userId: auth.currentUser.uid,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        weeklyTarget: data.weeklyTarget,
        totalTarget: data.totalTarget,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      const apiError = handleError(error, 'Create project', {
        defaultMessage: 'Failed to create project',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Update project
  updateProject: async (
    id: string,
    data: UpdateProjectData
  ): Promise<Project> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const updateData = removeUndefinedFields({
        ...data,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(
        doc(db, 'projects', auth.currentUser.uid, 'userProjects', id),
        updateData
      );

      // Get updated project
      const projectDoc = await getDoc(
        doc(db, 'projects', auth.currentUser.uid, 'userProjects', id)
      );
      const projectData = projectDoc.data()!;

      return {
        id,
        userId: auth.currentUser.uid,
        name: projectData.name,
        description: projectData.description,
        icon: projectData.icon,
        color: projectData.color,
        weeklyTarget: projectData.weeklyTarget,
        totalTarget: projectData.totalTarget,
        status: projectData.status || 'active',
        createdAt: convertTimestamp(projectData.createdAt),
        updatedAt: convertTimestamp(projectData.updatedAt),
      };
    } catch (error) {
      const apiError = handleError(error, 'Update project', {
        defaultMessage: 'Failed to update project',
      });
      throw new Error(apiError.userMessage);
    }
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      await deleteDoc(
        doc(db, 'projects', auth.currentUser.uid, 'userProjects', id)
      );
    } catch (error) {
      const apiError = handleError(error, 'Delete project', {
        defaultMessage: 'Failed to delete project',
      });
      throw new Error(apiError.userMessage);
    }
  },
};

// Firebase Session API
