/**
 * useGroupLeaderboard Hook Unit Tests
 *
 * Tests the optimized group leaderboard data fetching with batched queries.
 * The hook uses Firestore 'in' operator to batch user and session queries,
 * avoiding the N+1 query problem.
 */

// Mock Firebase Firestore BEFORE imports
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  documentId: jest.fn(() => '__name__'),
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useGroupLeaderboard, LeaderboardEntry } from '@/features/groups/hooks/useGroupLeaderboard'
import { STANDARD_CACHE_TIMES } from '@/lib/react-query'
import { getDoc, getDocs, collection, query, where, doc, documentId } from 'firebase/firestore'

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockWhere = where as jest.MockedFunction<typeof where>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockDocumentId = documentId as jest.MockedFunction<typeof documentId>

describe('useGroupLeaderboard - Optimized with Batched Queries', () => {
  let queryClient: QueryClient

  function createWrapper() {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })

    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('batched queries optimization', () => {
    it('should fetch leaderboard with batched user and session queries', async () => {
      // ARRANGE
      const groupId = 'group-1'
      const memberIds = ['user-1', 'user-2', 'user-3']

      // Mock group document
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ memberIds }),
      } as any)

      // Mock batched user documents query (1 query for all 3 users)
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              name: 'Alice',
              username: 'alice',
              profilePicture: 'pic1.jpg',
            }),
          },
          {
            id: 'user-2',
            data: () => ({
              name: 'Bob',
              username: 'bob',
            }),
          },
          {
            id: 'user-3',
            data: () => ({
              name: 'Charlie',
              username: 'charlie',
            }),
          },
        ],
      } as any)

      // Mock batched sessions query (1 query for all users' sessions)
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ userId: 'user-1', duration: 7200 }) }, // 2h
          { data: () => ({ userId: 'user-1', duration: 3600 }) }, // 1h
          { data: () => ({ userId: 'user-2', duration: 14400 }) }, // 4h
          { data: () => ({ userId: 'user-3', duration: 7200 }) }, // 2h
          { data: () => ({ userId: 'user-3', duration: 7200 }) }, // 2h
          { data: () => ({ userId: 'user-3', duration: 3600 }) }, // 1h
        ],
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT
      const leaderboard = result.current.data
      expect(leaderboard).toHaveLength(3)

      // Verify sorted by total hours (descending)
      expect(leaderboard?.[0]).toMatchObject({
        userId: 'user-3',
        name: 'Charlie',
        username: 'charlie',
        totalHours: 5, // 7200 + 7200 + 3600 = 18000s = 5h
        sessionCount: 3,
        rank: 1,
      })

      expect(leaderboard?.[1]).toMatchObject({
        userId: 'user-2',
        name: 'Bob',
        username: 'bob',
        totalHours: 4, // 14400s = 4h
        sessionCount: 1,
        rank: 2,
      })

      expect(leaderboard?.[2]).toMatchObject({
        userId: 'user-1',
        name: 'Alice',
        username: 'alice',
        totalHours: 3, // 7200 + 3600 = 10800s = 3h
        sessionCount: 2,
        rank: 3,
      })

      // Verify only 3 total queries were made:
      // 1. Group document (getDoc)
      // 2. Batched user documents (getDocs with 'in')
      // 3. Batched sessions (getDocs with 'in')
      expect(mockGetDoc).toHaveBeenCalledTimes(1)
      expect(mockGetDocs).toHaveBeenCalledTimes(2)
    })

    it('should handle empty group', async () => {
      // ARRANGE
      const groupId = 'group-1'

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ memberIds: [] }),
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT
      expect(result.current.data).toEqual([])
      expect(mockGetDoc).toHaveBeenCalledTimes(1)
      expect(mockGetDocs).not.toHaveBeenCalled() // No member queries needed
    })

    it('should handle nonexistent group', async () => {
      // ARRANGE
      const groupId = 'nonexistent-group'

      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT
      expect(result.current.data).toEqual([])
    })
  })

  describe('timeframe filtering', () => {
    it('should filter sessions by week timeframe', async () => {
      // ARRANGE
      const groupId = 'group-1'
      const memberIds = ['user-1']

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ memberIds }),
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              name: 'Alice',
              username: 'alice',
            }),
          },
        ],
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ userId: 'user-1', duration: 3600 }) }],
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId, 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT - verify date filter was applied
      expect(mockWhere).toHaveBeenCalled()
      const whereCall = mockWhere.mock.calls.find((call) => call[0] === 'createdAt')
      expect(whereCall).toBeDefined()
      expect(whereCall?.[1]).toBe('>=')
    })
  })

  describe('React Query integration', () => {
    it('should use correct cache key with groupId and timeframe', async () => {
      // ARRANGE
      const groupId = 'group-1'
      const memberIds = ['user-1']

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ memberIds }),
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              name: 'Alice',
              username: 'alice',
            }),
          },
        ],
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ userId: 'user-1', duration: 3600 }) }],
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId, 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT
      const query = queryClient.getQueryState(['group-leaderboard', groupId, 'week'])
      expect(query?.data).toBeDefined()
      expect(STANDARD_CACHE_TIMES.SHORT).toBe(60 * 1000)
    })

    it('should be disabled when groupId is empty', () => {
      // ARRANGE
      const groupId = ''

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId), {
        wrapper: createWrapper(),
      })

      // ASSERT
      // Query should be disabled (enabled: false) - data should be undefined
      expect(result.current.data).toBeUndefined()
      // Query should not make any actual calls
      expect(mockGetDoc).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle missing users gracefully', async () => {
      // ARRANGE
      const groupId = 'group-1'
      const memberIds = ['user-1', 'user-2']

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ memberIds }),
      } as any)

      // Only user-1 exists in the batch result
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              name: 'Alice',
              username: 'alice',
            }),
          },
        ],
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ userId: 'user-1', duration: 3600 }) }],
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT - only user-1 should be in leaderboard
      const leaderboard = result.current.data
      expect(leaderboard).toHaveLength(1)
      expect(leaderboard?.[0]?.userId).toBe('user-1')
    })
  })

  describe('data aggregation', () => {
    it('should calculate total hours and session count correctly', async () => {
      // ARRANGE
      const groupId = 'group-1'
      const memberIds = ['user-1']

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ memberIds }),
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              name: 'Alice',
              username: 'alice',
            }),
          },
        ],
      } as any)

      // 5 sessions with various durations
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ userId: 'user-1', duration: 1800 }) }, // 30min
          { data: () => ({ userId: 'user-1', duration: 3600 }) }, // 1h
          { data: () => ({ userId: 'user-1', duration: 5400 }) }, // 1.5h
          { data: () => ({ userId: 'user-1', duration: 7200 }) }, // 2h
          { data: () => ({ userId: 'user-1', duration: 10800 }) }, // 3h
        ],
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT
      const entry = result.current.data?.[0]
      expect(entry?.sessionCount).toBe(5)
      expect(entry?.totalHours).toBe((1800 + 3600 + 5400 + 7200 + 10800) / 3600)
    })

    it('should handle missing duration field', async () => {
      // ARRANGE
      const groupId = 'group-1'
      const memberIds = ['user-1']

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ memberIds }),
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              name: 'Alice',
              username: 'alice',
            }),
          },
        ],
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { data: () => ({ userId: 'user-1' }) }, // Missing duration
          { data: () => ({ userId: 'user-1', duration: 3600 }) },
        ],
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT
      const entry = result.current.data?.[0]
      expect(entry?.sessionCount).toBe(2)
      expect(entry?.totalHours).toBe(1) // Only the valid session counts
    })
  })

  describe('user data defaults', () => {
    it('should use default values for missing user fields', async () => {
      // ARRANGE
      const groupId = 'group-1'
      const memberIds = ['user-1']

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ memberIds }),
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-1',
            data: () => ({}), // Missing all fields
          },
        ],
      } as any)

      mockGetDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ userId: 'user-1', duration: 3600 }) }],
      } as any)

      // ACT
      const { result } = renderHook(() => useGroupLeaderboard(groupId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // ASSERT
      const entry = result.current.data?.[0]
      expect(entry?.name).toBe('Unknown User')
      expect(entry?.username).toBe('unknown')
      expect(entry?.profilePicture).toBeUndefined()
    })
  })
})
