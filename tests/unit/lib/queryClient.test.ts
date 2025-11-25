import { queryClient, CACHE_KEYS, CACHE_TIMES } from '@/lib/queryClient'

describe('lib/queryClient', () => {
  it('configures default query and mutation behaviour for the app shell', () => {
    const defaults = queryClient.getDefaultOptions()

    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000)
    expect(defaults.queries?.gcTime).toBe(10 * 60 * 1000)
    expect(defaults.queries?.retry).toBe(1)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true)
    expect(defaults.queries?.refetchOnMount).toBe(false)
    expect(defaults.queries?.refetchOnReconnect).toBe(false)

    expect(defaults.mutations?.retry).toBe(1)
  })

  it('creates deterministic cache keys without re-using array references', () => {
    const profileKeyA = CACHE_KEYS.USER_PROFILE('user-17')
    const profileKeyB = CACHE_KEYS.USER_PROFILE('user-17')
    const projectKey = CACHE_KEYS.PROJECT('project-9')
    const feedKey = CACHE_KEYS.FEED_SESSIONS(10, 'cursor-1', { filter: 'all' })

    expect(profileKeyA).toEqual(['user', 'profile', 'user-17'])
    expect(profileKeyB).toEqual(['user', 'profile', 'user-17'])
    expect(profileKeyA).not.toBe(profileKeyB)

    expect(projectKey).toEqual(['project', 'project-9'])
    expect(feedKey).toEqual(['feed', 'sessions', 10, 'cursor-1', { filter: 'all' }])
  })

  it('exposes shared cache time helpers for teams to re-use', () => {
    expect(CACHE_TIMES.REAL_TIME).toBe(30 * 1000)
    expect(CACHE_TIMES.SHORT).toBe(1 * 60 * 1000)
    expect(CACHE_TIMES.MEDIUM).toBe(5 * 60 * 1000)
    expect(CACHE_TIMES.LONG).toBe(15 * 60 * 1000)
    expect(CACHE_TIMES.VERY_LONG).toBe(60 * 60 * 1000)
    expect(CACHE_TIMES.INFINITE).toBe(Infinity)
  })
})
