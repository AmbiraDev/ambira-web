/**
 * SessionService Unit Tests
 *
 * Tests session CRUD operations, filtering, and business logic
 */

import { SessionService } from '@/features/sessions/services/SessionService'
import { firebaseApi } from '@/lib/api'
import { Session, SessionWithDetails } from '@/types'

jest.mock('@/lib/api')

describe('SessionService', () => {
  let sessionService: SessionService

  const mockSession: Session = {
    id: 'session-1',
    userId: 'user-1',
    projectId: 'project-1',
    activityId: 'activity-1',
    duration: 3600,
    startTime: new Date('2024-01-01T10:00:00'),
    title: 'Test Session',
    description: 'Test Description',
    visibility: 'everyone',
    supportCount: 5,
    commentCount: 2,
    isArchived: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockSessionWithDetails: SessionWithDetails = {
    ...mockSession,
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    activity: {
      id: 'activity-1',
      userId: 'user-1',
      name: 'Work',
      description: 'Work activities',
      icon: 'work',
      color: '#007AFF',
      status: 'active' as const,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    sessionService = new SessionService()
  })

  describe('getSession', () => {
    it('should get session by ID', async () => {
      // ARRANGE
      ;(firebaseApi.session.getSession as jest.Mock).mockResolvedValue(mockSession)

      // ACT
      const result = await sessionService.getSession('session-1')

      // ASSERT
      expect(result).toEqual(mockSession)
      expect(firebaseApi.session.getSession).toHaveBeenCalledWith('session-1')
    })

    it('should return null if session not found', async () => {
      // ARRANGE
      ;(firebaseApi.session.getSession as jest.Mock).mockResolvedValue(null)

      // ACT
      const result = await sessionService.getSession('nonexistent')

      // ASSERT
      expect(result).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      ;(firebaseApi.session.getSession as jest.Mock).mockRejectedValue(new Error('API Error'))

      // ACT
      const result = await sessionService.getSession('session-1')

      // ASSERT
      expect(result).toBeNull()
    })
  })

  describe('getSessionWithDetails', () => {
    it('should get session with populated details', async () => {
      // ARRANGE
      ;(firebaseApi.session.getSessionWithDetails as jest.Mock).mockResolvedValue(
        mockSessionWithDetails
      )

      // ACT
      const result = await sessionService.getSessionWithDetails('session-1')

      // ASSERT
      expect(result).toEqual(mockSessionWithDetails)
      expect(result?.user.name).toBe('Test User')
      expect(result?.activity.name).toBe('Work')
    })

    it('should return null if session not found', async () => {
      // ARRANGE
      ;(firebaseApi.session.getSessionWithDetails as jest.Mock).mockResolvedValue(null)

      // ACT
      const result = await sessionService.getSessionWithDetails('nonexistent')

      // ASSERT
      expect(result).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      // ARRANGE
      ;(firebaseApi.session.getSessionWithDetails as jest.Mock).mockRejectedValue(
        new Error('API Error')
      )

      // ACT
      const result = await sessionService.getSessionWithDetails('session-1')

      // ASSERT
      expect(result).toBeNull()
    })
  })

  describe('getUserSessions', () => {
    it('should get all sessions for a user', async () => {
      // ARRANGE
      const mockSessions = [mockSession, { ...mockSession, id: 'session-2' }]
      ;(firebaseApi.session.getSessions as jest.Mock).mockResolvedValue({
        sessions: mockSessions,
        hasMore: false,
      })

      // ACT
      const result = await sessionService.getUserSessions('user-1')

      // ASSERT
      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('session-1')
      expect(result[1]?.id).toBe('session-2')
    })

    it('should support filtering options', async () => {
      // ARRANGE
      const filters = { projectId: 'project-1' }
      ;(firebaseApi.session.getSessions as jest.Mock).mockResolvedValue({
        sessions: [mockSession],
        hasMore: false,
      })

      // ACT
      await sessionService.getUserSessions('user-1', filters)

      // ASSERT
      expect(firebaseApi.session.getSessions).toHaveBeenCalledWith(100, {
        userId: 'user-1',
        projectId: 'project-1',
      })
    })

    it('should return empty array on error', async () => {
      // ARRANGE
      ;(firebaseApi.session.getSessions as jest.Mock).mockRejectedValue(new Error('API Error'))

      // ACT
      const result = await sessionService.getUserSessions('user-1')

      // ASSERT
      expect(result).toEqual([])
    })
  })

  describe('deleteSession', () => {
    it('should delete session by ID', async () => {
      // ARRANGE
      ;(firebaseApi.session.deleteSession as jest.Mock).mockResolvedValue(undefined)

      // ACT
      await sessionService.deleteSession('session-1')

      // ASSERT
      expect(firebaseApi.session.deleteSession).toHaveBeenCalledWith('session-1')
    })

    it('should propagate API errors', async () => {
      // ARRANGE
      const error = new Error('Delete failed')
      ;(firebaseApi.session.deleteSession as jest.Mock).mockRejectedValue(error)

      // ACT & ASSERT
      await expect(sessionService.deleteSession('session-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('supportSession', () => {
    it('should support (like) a session', async () => {
      // ARRANGE
      ;(firebaseApi.post.supportSession as jest.Mock).mockResolvedValue(undefined)

      // ACT
      await sessionService.supportSession('session-1')

      // ASSERT
      expect(firebaseApi.post.supportSession).toHaveBeenCalledWith('session-1')
    })

    it('should propagate API errors', async () => {
      // ARRANGE
      ;(firebaseApi.post.supportSession as jest.Mock).mockRejectedValue(new Error('Support failed'))

      // ACT & ASSERT
      await expect(sessionService.supportSession('session-1')).rejects.toThrow('Support failed')
    })
  })

  describe('unsupportSession', () => {
    it('should remove support from a session', async () => {
      // ARRANGE
      ;(firebaseApi.post.removeSupportFromSession as jest.Mock).mockResolvedValue(undefined)

      // ACT
      await sessionService.unsupportSession('session-1')

      // ASSERT
      expect(firebaseApi.post.removeSupportFromSession).toHaveBeenCalledWith('session-1')
    })

    it('should propagate API errors', async () => {
      // ARRANGE
      ;(firebaseApi.post.removeSupportFromSession as jest.Mock).mockRejectedValue(
        new Error('Unsupport failed')
      )

      // ACT & ASSERT
      await expect(sessionService.unsupportSession('session-1')).rejects.toThrow('Unsupport failed')
    })
  })

  describe('updateSession', () => {
    it('should update session with valid data', async () => {
      // ARRANGE
      const updateData = { title: 'Updated Title' }
      ;(firebaseApi.session.updateSession as jest.Mock).mockResolvedValue(undefined)

      // ACT
      await sessionService.updateSession('session-1', updateData)

      // ASSERT
      expect(firebaseApi.session.updateSession).toHaveBeenCalledWith('session-1', updateData)
    })

    it('should validate update data', async () => {
      // ARRANGE
      const updateData = { title: 'Updated', visibility: 'followers' }
      ;(firebaseApi.session.updateSession as jest.Mock).mockResolvedValue(undefined)

      // ACT
      await sessionService.updateSession('session-1', updateData)

      // ASSERT
      expect(firebaseApi.session.updateSession).toHaveBeenCalled()
    })

    it('should propagate API errors', async () => {
      // ARRANGE
      ;(firebaseApi.session.updateSession as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      )

      // ACT & ASSERT
      await expect(sessionService.updateSession('session-1', { title: 'New' })).rejects.toThrow(
        'Update failed'
      )
    })
  })
})
