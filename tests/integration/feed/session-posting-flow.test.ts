/**
 * Session Posting Flow Integration Tests
 *
 * Tests that newly posted sessions appear in the feed immediately,
 * regardless of the feed filter setting (like Instagram).
 */

import { FeedService } from '@/features/feed/services/FeedService'
import { FeedRepository } from '@/infrastructure/firebase/repositories/FeedRepository'
import { SocialGraphRepository } from '@/infrastructure/firebase/repositories/SocialGraphRepository'
import { SessionRepository } from '@/infrastructure/firebase/repositories/SessionRepository'
import { Session } from '@/domain/entities/Session'

jest.mock('@/infrastructure/firebase/repositories/FeedRepository')
jest.mock('@/infrastructure/firebase/repositories/SocialGraphRepository')
jest.mock('@/infrastructure/firebase/repositories/SessionRepository')

describe('Session Posting Flow - Integration', () => {
  let feedService: FeedService
  let mockFeedRepoInstance: jest.Mocked<FeedRepository>
  let mockSocialGraphRepoInstance: jest.Mocked<SocialGraphRepository>
  let mockSessionRepoInstance: jest.Mocked<SessionRepository>

  const currentUserId = 'current-user'

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock instances
    mockFeedRepoInstance = {
      getPublicFeed: jest.fn(),
      getFeedForFollowing: jest.fn(),
      getFeedForGroupMembersUnfollowed: jest.fn(),
    } as any

    mockSocialGraphRepoInstance = {
      getFollowingIds: jest.fn(),
      getGroupMemberIds: jest.fn(),
    } as any

    mockSessionRepoInstance = {
      findByUserId: jest.fn(),
      findByGroupId: jest.fn(),
    } as any

    // Mock the constructors
    ;(FeedRepository as jest.MockedClass<typeof FeedRepository>).mockImplementation(
      () => mockFeedRepoInstance
    )
    ;(SocialGraphRepository as jest.MockedClass<typeof SocialGraphRepository>).mockImplementation(
      () => mockSocialGraphRepoInstance
    )
    ;(SessionRepository as jest.MockedClass<typeof SessionRepository>).mockImplementation(
      () => mockSessionRepoInstance
    )

    feedService = new FeedService()
  })

  describe('User posts a session and views feed', () => {
    it('should show newly posted session in following feed immediately', async () => {
      // ARRANGE
      // User is following some people but not themselves
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue(['friend-1', 'friend-2'])

      // Mock sessions from followed users + current user's new post
      const userNewSession = new Session(
        'new-session-123',
        currentUserId,
        'project-1',
        'activity-1',
        3600,
        new Date(),
        'Just finished a great session!',
        'Description',
        'everyone',
        0,
        0,
        []
      )

      const friendSession = new Session(
        'friend-session-1',
        'friend-1',
        'project-2',
        'activity-2',
        1800,
        new Date(Date.now() - 3600000), // 1 hour ago
        'Friend session',
        'Description',
        'everyone',
        5,
        2,
        []
      )

      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue({
        sessions: [userNewSession, friendSession],
        hasMore: false,
      })

      // ACT
      const result = await feedService.getFeed(currentUserId, {
        type: 'following',
      })

      // ASSERT
      // 1. Verify current user is included in the query (along with friends)
      expect(mockFeedRepoInstance.getFeedForFollowing).toHaveBeenCalledWith(
        expect.arrayContaining([currentUserId, 'friend-1', 'friend-2']),
        20,
        undefined
      )

      // 2. Verify new session appears in results
      expect(result.sessions).toHaveLength(2)
      const newSession = result.sessions.find((s) => s.id === 'new-session-123')
      expect(newSession).toBeDefined()
      expect(newSession?.userId).toBe(currentUserId)
    })

    it('should show own posts even when not following anyone', async () => {
      // ARRANGE
      // User doesn't follow anyone (new user scenario)
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue([])

      // User just posted their first session
      const firstSession = new Session(
        'first-session',
        currentUserId,
        'project-1',
        'activity-1',
        3600,
        new Date(),
        'My first session!',
        'Description',
        'everyone',
        0,
        0,
        []
      )

      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue({
        sessions: [firstSession],
        hasMore: false,
      })

      // ACT
      const result = await feedService.getFeed(currentUserId, {
        type: 'following',
      })

      // ASSERT
      // 1. Even though following list is empty, current user should be included
      expect(mockFeedRepoInstance.getFeedForFollowing).toHaveBeenCalledWith(
        [currentUserId],
        20,
        undefined
      )

      // 2. User's session should appear
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0]?.id).toBe('first-session')
    })

    it('should show own private sessions in following feed', async () => {
      // ARRANGE
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue(['friend-1'])

      // User posts a private session
      const privateSession = new Session(
        'private-session',
        currentUserId,
        'project-1',
        'activity-1',
        3600,
        new Date(),
        'Private work session',
        'Description',
        'private', // Private visibility
        0,
        0,
        []
      )

      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue({
        sessions: [privateSession],
        hasMore: false,
      })

      // ACT
      const result = await feedService.getFeed(currentUserId, {
        type: 'following',
      })

      // ASSERT
      // User should see their own private sessions in feed
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0]?.visibility).toBe('private')
    })

    it('should show own followers-only sessions in following feed', async () => {
      // ARRANGE
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue(['friend-1'])

      // User posts a followers-only session
      const followersSession = new Session(
        'followers-session',
        currentUserId,
        'project-1',
        'activity-1',
        3600,
        new Date(),
        'Followers only session',
        'Description',
        'followers', // Followers visibility
        0,
        0,
        []
      )

      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue({
        sessions: [followersSession],
        hasMore: false,
      })

      // ACT
      const result = await feedService.getFeed(currentUserId, {
        type: 'following',
      })

      // ASSERT
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0]?.visibility).toBe('followers')
    })
  })

  describe('Edge cases', () => {
    it('should handle case where user follows themselves', async () => {
      // ARRANGE
      // User somehow follows themselves (edge case)
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue([currentUserId, 'friend-1'])

      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue({
        sessions: [],
        hasMore: false,
      })

      // ACT
      await feedService.getFeed(currentUserId, { type: 'following' })

      // ASSERT
      // Should deduplicate current user
      const calledWith = mockFeedRepoInstance.getFeedForFollowing.mock.calls[0]?.[0] as string[]
      const uniqueUserIds = new Set(calledWith)

      expect(calledWith.length).toBe(uniqueUserIds.size)
      expect(uniqueUserIds.has(currentUserId)).toBe(true)
      expect(uniqueUserIds.has('friend-1')).toBe(true)
      expect(uniqueUserIds.size).toBe(2) // Only 2 unique users
    })

    it('should maintain chronological order with own posts', async () => {
      // ARRANGE
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue(['friend-1'])

      const now = Date.now()
      const sessions = [
        new Session(
          'session-1',
          currentUserId,
          'p1',
          'a1',
          3600,
          new Date(now),
          'Latest',
          'Desc',
          'everyone',
          0,
          0,
          []
        ),
        new Session(
          'session-2',
          'friend-1',
          'p2',
          'a2',
          3600,
          new Date(now - 3600000),
          'Older',
          'Desc',
          'everyone',
          0,
          0,
          []
        ),
        new Session(
          'session-3',
          currentUserId,
          'p3',
          'a3',
          3600,
          new Date(now - 7200000),
          'Oldest',
          'Desc',
          'everyone',
          0,
          0,
          []
        ),
      ]

      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValue({
        sessions,
        hasMore: false,
      })

      // ACT
      const result = await feedService.getFeed(currentUserId, {
        type: 'following',
      })

      // ASSERT
      // Own posts should appear in chronological order with others
      expect(result.sessions).toHaveLength(3)
      expect(result.sessions.map((s) => s.id)).toEqual(['session-1', 'session-2', 'session-3'])
    })
  })

  describe('Real-world scenario: Post session → Redirect → See in feed', () => {
    it('should simulate full flow of posting and viewing', async () => {
      // ARRANGE
      // Step 1: User follows 2 friends
      mockSocialGraphRepoInstance.getFollowingIds.mockResolvedValue(['friend-1', 'friend-2'])

      // Step 2: Initial feed before posting
      const initialSessions = [
        new Session(
          'friend-session-1',
          'friend-1',
          'p1',
          'a1',
          3600,
          new Date(Date.now() - 3600000),
          'Friend post',
          'Desc',
          'everyone',
          5,
          2,
          []
        ),
      ]

      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValueOnce({
        sessions: initialSessions,
        hasMore: false,
      })

      // User views feed before posting
      const beforePost = await feedService.getFeed(currentUserId, {
        type: 'following',
      })
      expect(beforePost.sessions).toHaveLength(1)

      // Step 3: User posts a new session
      const newSession = new Session(
        'new-session-just-posted',
        currentUserId,
        'p2',
        'a2',
        3600,
        new Date(),
        'Just completed!',
        'Desc',
        'everyone',
        0,
        0,
        []
      )

      // Step 4: Feed after posting (includes new session)
      mockFeedRepoInstance.getFeedForFollowing.mockResolvedValueOnce({
        sessions: [newSession, ...initialSessions],
        hasMore: false,
      })

      // User refreshes/navigates to feed after posting
      const afterPost = await feedService.getFeed(currentUserId, {
        type: 'following',
      })

      // ASSERT
      // 1. Feed now includes user's new post
      expect(afterPost.sessions).toHaveLength(2)

      // 2. New post appears first (most recent)
      expect(afterPost.sessions[0]?.id).toBe('new-session-just-posted')
      expect(afterPost.sessions[0]?.userId).toBe(currentUserId)

      // 3. Friend's post is still visible
      expect(afterPost.sessions[1]?.userId).toBe('friend-1')
    })
  })
})
