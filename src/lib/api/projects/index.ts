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
} from 'firebase/firestore'

// Local Firebase config
import { db, auth } from '@/lib/firebase'

// Error handling
import { handleError } from '@/lib/errorHandler'
import { checkRateLimit } from '@/lib/rateLimit'

// Shared utilities
import { convertTimestamp, removeUndefinedFields } from '../shared/utils'

// Types
import type { Project, CreateProjectData, UpdateProjectData, ProjectStats } from '@/types'

export const firebaseProjectApi = {
  // Get all user's projects
  getProjects: async (): Promise<Project[]> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      const projectsQuery = query(
        collection(db, 'projects', auth.currentUser.uid, 'userProjects'),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(projectsQuery)
      const projects: Project[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
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
        })
      })

      return projects
    } catch (_error) {
      const apiError = handleError(_error, 'Get projects', {
        defaultMessage: 'Failed to get projects',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Create new project
  createProject: async (data: CreateProjectData): Promise<Project> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      // Rate limitFn project creation
      checkRateLimit(auth.currentUser.uid, 'PROJECT_CREATE')

      const projectData = removeUndefinedFields({
        ...data,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const docRef = await addDoc(
        collection(db, 'projects', auth.currentUser.uid, 'userProjects'),
        projectData
      )

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
      }
    } catch (_error) {
      const apiError = handleError(_error, 'Create project', {
        defaultMessage: 'Failed to create project',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Update project
  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      const updateData = removeUndefinedFields({
        ...data,
        updatedAt: serverTimestamp(),
      })

      await updateDoc(doc(db, 'projects', auth.currentUser.uid, 'userProjects', id), updateData)

      // Get updated project
      const projectDoc = await getDoc(doc(db, 'projects', auth.currentUser.uid, 'userProjects', id))
      const projectData = projectDoc.data() as {
        name: string
        description: string
        icon: string
        color: string
        weeklyTarget?: number
        totalTarget?: number
        status?: string
        createdAt: unknown
        updatedAt: unknown
      }

      return {
        id,
        userId: auth.currentUser.uid,
        name: projectData.name,
        description: projectData.description,
        icon: projectData.icon,
        color: projectData.color,
        weeklyTarget: projectData.weeklyTarget,
        totalTarget: projectData.totalTarget,
        status: (projectData.status as 'active' | 'completed' | 'archived') || 'active',
        createdAt: convertTimestamp(projectData.createdAt),
        updatedAt: convertTimestamp(projectData.updatedAt),
      }
    } catch (_error) {
      const apiError = handleError(_error, 'Update project', {
        defaultMessage: 'Failed to update project',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      await deleteDoc(doc(db, 'projects', auth.currentUser.uid, 'userProjects', id))
    } catch (_error) {
      const apiError = handleError(_error, 'Delete project', {
        defaultMessage: 'Failed to delete project',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Get project by ID
  getProjectById: async (id: string): Promise<Project | null> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      const projectDoc = await getDoc(doc(db, 'projects', auth.currentUser.uid, 'userProjects', id))

      if (!projectDoc.exists()) {
        return null
      }

      const data = projectDoc.data()
      return {
        id: projectDoc.id,
        userId: auth.currentUser.uid,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        weeklyTarget: data.weeklyTarget,
        totalTarget: data.totalTarget,
        status: data.status || 'active',
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      }
    } catch (_error) {
      const apiError = handleError(_error, 'Get project by ID', {
        defaultMessage: 'Failed to get project',
      })
      throw new Error(apiError.userMessage)
    }
  },

  // Get project stats
  getProjectStats: async (id: string): Promise<ProjectStats | null> => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      // Get all sessions for this project
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', auth.currentUser.uid),
        where('activityId', '==', id)
      )

      const querySnapshot = await getDocs(sessionsQuery)

      let totalHours = 0
      let weeklyHours = 0
      let sessionCount = 0
      let longestSession = 0
      let lastSessionDate: Date | undefined

      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const duration = data.duration || 0 // in seconds
        const startTime = convertTimestamp(data.startTime)

        totalHours += duration / 3600 // Convert to hours
        sessionCount++

        if (duration > longestSession) {
          longestSession = duration
        }

        if (startTime >= oneWeekAgo) {
          weeklyHours += duration / 3600
        }

        if (!lastSessionDate || startTime > lastSessionDate) {
          lastSessionDate = startTime
        }
      })

      const averageSessionDuration = sessionCount > 0 ? totalHours / sessionCount : 0

      // Calculate streak (simplified - just checks if there was activity in the last 2 days)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      const currentStreak = lastSessionDate && lastSessionDate >= twoDaysAgo ? 1 : 0

      // Get project to check targets
      const project = await firebaseProjectApi.getProjectById(id)
      const weeklyTarget = project?.weeklyTarget || 0
      const totalTarget = project?.totalTarget || 0

      const weeklyProgressPercentage = weeklyTarget > 0 ? (weeklyHours / weeklyTarget) * 100 : 0
      const totalProgressPercentage = totalTarget > 0 ? (totalHours / totalTarget) * 100 : 0

      return {
        totalHours,
        weeklyHours,
        sessionCount,
        currentStreak,
        weeklyProgressPercentage,
        totalProgressPercentage,
        averageSessionDuration,
        lastSessionDate,
      }
    } catch (_error) {
      const apiError = handleError(_error, 'Get project stats', {
        defaultMessage: 'Failed to get project stats',
      })
      throw new Error(apiError.userMessage)
    }
  },
}

// Firebase Session API
