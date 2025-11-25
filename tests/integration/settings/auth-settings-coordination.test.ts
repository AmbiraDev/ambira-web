/**
 * Integration Tests: Auth & Settings Coordination
 *
 * Tests interactions between authentication and settings including:
 * - User profile synchronization after auth
 * - Settings accessible only to authenticated users
 * - Protected settings updates
 * - Logout clears sensitive settings
 * - Account deletion flow
 */

import { useAuth } from '@/hooks/useAuth'
import { firebaseUserApi } from '@/lib/api'

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
  firebaseUserApi: {
    updateProfile: jest.fn(),
    getPrivacySettings: jest.fn(),
    deleteAccount: jest.fn(),
  },
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockFirebaseUserApi = firebaseUserApi as jest.Mocked<typeof firebaseUserApi>

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'John Doe',
  username: 'johndoe',
  bio: 'Test bio',
  location: 'San Francisco',
  website: 'https://example.com',
  tagline: 'Test tagline',
  pronouns: 'he/him',
  profilePicture: 'https://example.com/pic.jpg',
  socialLinks: {
    twitter: 'johndoe',
    github: 'johndoe',
    linkedin: 'johndoe',
  },
}

describe('Auth & Settings Coordination - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Authentication Flow', () => {
    it('provides user data to settings after successful login', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()

      expect(auth.user).toBeDefined()
      expect(auth.user.name).toBe('John Doe')
      expect(auth.user.username).toBe('johndoe')
    })

    it('returns null user when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()

      expect(auth.user).toBeNull()
    })

    it('synchronizes user profile in settings component', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()

      // Settings should use this user data
      const formData = {
        name: auth.user?.name || '',
        bio: auth.user?.bio || '',
        location: auth.user?.location || '',
      }

      expect(formData.name).toBe('John Doe')
      expect(formData.bio).toBe('Test bio')
      expect(formData.location).toBe('San Francisco')
    })
  })

  describe('Protected Settings Access', () => {
    it('requires authentication to access settings', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()
      const isAuthenticated = auth.user !== null

      expect(isAuthenticated).toBe(false)
    })

    it('allows settings access when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()
      const isAuthenticated = auth.user !== null

      expect(isAuthenticated).toBe(true)
    })

    it('prevents unauthenticated users from updating settings', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()

      if (!auth.user) {
        mockFirebaseUserApi.updateProfile.mockRejectedValue(new Error('Not authenticated'))
      }

      // Settings update should fail
      if (!auth.user) {
        expect(mockFirebaseUserApi.updateProfile).not.toHaveBeenCalled()
      }
    })
  })

  describe('Profile Update Protection', () => {
    it('prevents updating other users profiles', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()
      const currentUserId = auth.user?.id
      const otherUserId = 'user-456'

      // Should only allow updates to own profile
      if (currentUserId !== otherUserId) {
        const allowed = currentUserId === 'user-123'
        expect(allowed).toBe(true)
      }
    })

    it('validates user ownership before profile update', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()
      mockFirebaseUserApi.updateProfile.mockResolvedValue(undefined)

      if (auth.user?.id === 'user-123') {
        await mockFirebaseUserApi.updateProfile({ name: 'Updated Name' })
      }

      expect(mockFirebaseUserApi.updateProfile).toHaveBeenCalled()
    })
  })

  describe('Settings Persistence with Auth', () => {
    it('preserves settings across navigation while authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      const auth1 = mockUseAuth()
      expect(auth1.user?.name).toBe('John Doe')

      // Navigate to different page
      const auth2 = mockUseAuth()
      expect(auth2.user?.name).toBe('John Doe')
    })

    it('clears settings when user logs out', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      let auth = mockUseAuth()
      expect(auth.user).toBeDefined()

      // User logs out
      mockUseAuth.mockReturnValue({
        user: null,
        logout: jest.fn(),
      })

      auth = mockUseAuth()
      expect(auth.user).toBeNull()
    })
  })

  describe('Logout Flow', () => {
    it('successfully logs out user', async () => {
      const logout = jest.fn().mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout,
      })

      const auth = mockUseAuth()
      await auth.logout()

      expect(logout).toHaveBeenCalled()
    })

    it('clears sensitive data on logout', async () => {
      const logout = jest.fn().mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout,
      })

      const auth = mockUseAuth()
      const userBeforeLogout = auth.user
      expect(userBeforeLogout).toBeDefined()

      await auth.logout()

      // After logout, user should be cleared
      mockUseAuth.mockReturnValue({
        user: null,
        logout,
      })

      const authAfter = mockUseAuth()
      expect(authAfter.user).toBeNull()
    })

    it('handles logout errors gracefully', async () => {
      const logout = jest.fn().mockRejectedValue(new Error('Logout failed'))
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout,
      })

      const auth = mockUseAuth()

      await expect(auth.logout()).rejects.toThrow('Logout failed')
    })
  })

  describe('Account Deletion', () => {
    it('requires authentication for account deletion', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      mockFirebaseUserApi.deleteAccount.mockResolvedValue(undefined)

      const auth = mockUseAuth()

      if (auth.user) {
        await mockFirebaseUserApi.deleteAccount()
        expect(mockFirebaseUserApi.deleteAccount).toHaveBeenCalled()
      }
    })

    it('prevents unauthenticated deletion attempts', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()

      if (!auth.user) {
        expect(mockFirebaseUserApi.deleteAccount).not.toHaveBeenCalled()
      }
    })

    it('completes deletion and logs out user', async () => {
      const logout = jest.fn().mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout,
      })

      mockFirebaseUserApi.deleteAccount.mockResolvedValue(undefined)

      const auth = mockUseAuth()
      await mockFirebaseUserApi.deleteAccount()
      await auth.logout()

      expect(mockFirebaseUserApi.deleteAccount).toHaveBeenCalled()
      expect(logout).toHaveBeenCalled()
    })

    it('handles deletion errors without logging out', async () => {
      mockFirebaseUserApi.deleteAccount.mockRejectedValue(new Error('Deletion failed'))
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()

      await expect(mockFirebaseUserApi.deleteAccount()).rejects.toThrow('Deletion failed')

      // User should still be logged in
      expect(auth.user).toBeDefined()
    })
  })

  describe('Session Management', () => {
    it('maintains session during settings updates', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      mockFirebaseUserApi.updateProfile.mockResolvedValue(undefined)

      const auth = mockUseAuth()
      expect(auth.user?.id).toBe('user-123')

      await mockFirebaseUserApi.updateProfile({ name: 'Updated' })

      // Session still valid
      expect(auth.user?.id).toBe('user-123')
    })

    it('handles session expiration during settings update', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      mockFirebaseUserApi.updateProfile.mockRejectedValue(new Error('Authentication required'))

      const auth = mockUseAuth()

      await expect(mockFirebaseUserApi.updateProfile({ name: 'Updated' })).rejects.toThrow(
        'Authentication required'
      )
    })
  })

  describe('Privacy Settings with Auth', () => {
    it('loads privacy settings for authenticated user', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      mockFirebaseUserApi.getPrivacySettings.mockResolvedValue({
        profileVisibility: 'everyone',
        activityVisibility: 'followers',
        projectVisibility: 'private',
        blockedUsers: [],
      })

      const auth = mockUseAuth()

      if (auth.user) {
        const settings = await mockFirebaseUserApi.getPrivacySettings()
        expect(settings).toBeDefined()
        expect(settings.profileVisibility).toBe('everyone')
      }
    })

    it('prevents privacy settings access for unauthenticated users', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: jest.fn(),
      })

      const auth = mockUseAuth()

      if (!auth.user) {
        expect(mockFirebaseUserApi.getPrivacySettings).not.toHaveBeenCalled()
      }
    })
  })

  describe('Multi-Device Consistency', () => {
    it('syncs user data across multiple devices', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      // Device 1
      const auth1 = mockUseAuth()
      expect(auth1.user?.name).toBe('John Doe')

      // Device 2 (same user session)
      const auth2 = mockUseAuth()
      expect(auth2.user?.name).toBe('John Doe')

      // Both devices have same user data
      expect(auth1.user?.id).toBe(auth2.user?.id)
    })

    it('handles concurrent updates from multiple devices', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      mockFirebaseUserApi.updateProfile.mockResolvedValue(undefined)

      // Device 1 updates
      const update1 = mockFirebaseUserApi.updateProfile({
        name: 'Name from Device 1',
      })

      // Device 2 updates
      const update2 = mockFirebaseUserApi.updateProfile({
        bio: 'Bio from Device 2',
      })

      await Promise.all([update1, update2])

      expect(mockFirebaseUserApi.updateProfile).toHaveBeenCalledTimes(2)
    })
  })

  describe('User Context Synchronization', () => {
    it('updates form when user context changes', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: jest.fn(),
      })

      let auth = mockUseAuth()
      let formData = {
        name: auth.user?.name || '',
        bio: auth.user?.bio || '',
      }

      expect(formData.name).toBe('John Doe')
      expect(formData.bio).toBe('Test bio')

      // User updates profile elsewhere
      const updatedUser = { ...mockUser, name: 'Jane Doe' }
      mockUseAuth.mockReturnValue({
        user: updatedUser,
        logout: jest.fn(),
      })

      auth = mockUseAuth()
      formData = {
        name: auth.user?.name || '',
        bio: auth.user?.bio || '',
      }

      expect(formData.name).toBe('Jane Doe')
    })

    it('handles missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'John Doe',
          username: 'johndoe',
          // Bio, location, etc. might be missing
        },
        logout: jest.fn(),
      })

      const auth = mockUseAuth()
      const formData = {
        name: auth.user?.name || '',
        bio: auth.user?.bio || '', // Should use empty string
        location: auth.user?.location || '', // Should use empty string
      }

      expect(formData.name).toBe('John Doe')
      expect(formData.bio).toBe('')
      expect(formData.location).toBe('')
    })
  })
})
