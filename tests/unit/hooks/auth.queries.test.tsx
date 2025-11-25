import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useAuth,
  useLogin,
  useSignup,
  useLogout,
  useGoogleSignIn,
  AUTH_KEYS,
} from '@/lib/react-query/auth.queries'

const mockRouterPush = jest.fn()
const loginMock = jest.fn()
const signupMock = jest.fn()
const googleMock = jest.fn()
const logoutMock = jest.fn()
const currentUserMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

jest.mock('@/lib/api/auth', () => ({
  firebaseAuthApi: {
    login: (...args: unknown[]) => loginMock(...args),
    signup: (...args: unknown[]) => signupMock(...args),
    signInWithGoogle: (...args: unknown[]) => googleMock(...args),
    logout: (...args: unknown[]) => logoutMock(...args),
    getCurrentUser: (...args: unknown[]) => currentUserMock(...args),
  },
}))

describe('auth react-query hooks', () => {
  const user = { id: 'user-1', email: 'test@example.com', name: 'Tester' }

  function createWrapper() {
    const queryClient = new QueryClient()
    return {
      queryClient,
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loads the current user via useAuth and caches the result', async () => {
    currentUserMock.mockResolvedValueOnce(user)
    const { queryClient, wrapper } = createWrapper()

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual(user))

    expect(queryClient.getQueryData(AUTH_KEYS.session())).toEqual(user)
  })

  it('logs in users and redirects home', async () => {
    loginMock.mockResolvedValueOnce({ user })
    const { queryClient, wrapper } = createWrapper()

    const { result } = renderHook(() => useLogin(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@example.com',
        password: 'secret',
      })
    })

    expect(queryClient.getQueryData(AUTH_KEYS.session())).toEqual(user)
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })

  it('signs up users and updates cache', async () => {
    signupMock.mockResolvedValueOnce({ user })
    const { queryClient, wrapper } = createWrapper()

    const { result } = renderHook(() => useSignup(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        email: 'new@example.com',
        password: 'secret',
        name: 'New User',
        username: 'new-user',
      })
    })

    expect(queryClient.getQueryData(AUTH_KEYS.session())).toEqual(user)
  })

  it('handles Google sign-in success and redirect', async () => {
    googleMock.mockResolvedValueOnce({ user })
    const { wrapper, queryClient } = createWrapper()
    const { result } = renderHook(() => useGoogleSignIn(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(queryClient.getQueryData(AUTH_KEYS.session())).toEqual(user)
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })

  it('logs out and clears caches', async () => {
    const { queryClient, wrapper } = createWrapper()
    queryClient.setQueryData(AUTH_KEYS.session(), user)

    const { result } = renderHook(() => useLogout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(logoutMock).toHaveBeenCalled()
    expect(queryClient.getQueryData(AUTH_KEYS.session())).toBeNull()
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })
})
