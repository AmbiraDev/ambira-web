import {
  createApiError,
  handleError,
  withErrorHandling,
  withNullOnError,
  isPermissionError,
  isNotFoundError,
  isAuthError,
  isNetworkError,
  ErrorSeverity,
} from '@/lib/errorHandler'
import { debug } from '@/lib/debug'

jest.mock('@/lib/debug', () => ({
  debug: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  isDevelopment: true,
}))

describe('lib/errorHandler', () => {
  const mockedDebug = debug as unknown as {
    log: jest.Mock
    warn: jest.Mock
    error: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates standardized errors with friendly messaging when code is known', () => {
    const firebaseError = {
      code: 'auth/invalid-email',
      message: 'raw message',
    }
    const apiError = createApiError(firebaseError, 'Sign in flow')

    expect(apiError).toMatchObject({
      code: 'auth/invalid-email',
      message: 'Sign in flow: raw message',
      userMessage: 'Please enter a valid email address.',
      originalError: firebaseError,
    })
  })

  it('creates fallback user messaging for unknown errors', () => {
    const unknownError = { message: 'Something odd happened' }
    const apiError = createApiError(unknownError, 'Load dashboard')

    expect(apiError.userMessage).toBe('An error occurred. Please try again.')
    expect(apiError.message).toBe('Load dashboard: Something odd happened')
  })

  it('logs errors with severity when handling errors and returns ApiError', () => {
    const error = { code: 'storage/unknown', message: 'Upload exploded' }
    const apiError = handleError(error, 'Upload avatar', {
      severity: ErrorSeverity.WARNING,
      logContext: { userId: 'user-1' },
    })

    expect(apiError.userMessage).toBe('An error occurred while uploading. Please try again.')
    expect(mockedDebug.warn).toHaveBeenCalledWith(expect.stringContaining('"severity":"warning"'))
  })

  it('supports silent handling without logging', () => {
    const error = { code: 'auth/user-disabled', message: 'Disabled' }
    handleError(error, 'Fetch profile', { silent: true })

    expect(mockedDebug.error).not.toHaveBeenCalled()
    expect(mockedDebug.warn).not.toHaveBeenCalled()
    expect(mockedDebug.log).not.toHaveBeenCalled()
  })

  it('wraps async operations and rethrows user-friendly errors', async () => {
    const result = await withErrorHandling(async () => 'success', 'Test op')
    expect(result).toBe('success')

    const onError = jest.fn()
    const failing = async () => {
      throw { code: 'permission-denied', message: 'nope' }
    }

    await expect(withErrorHandling(failing, 'Secure action', { onError })).rejects.toThrow(
      "You don't have permission to perform this action."
    )

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'permission-denied',
        userMessage: "You don't have permission to perform this action.",
      })
    )
    expect(mockedDebug.error).toHaveBeenCalled()
  })

  it('returns null for permission or not found errors when requested', async () => {
    const permissionResult = await withNullOnError(
      async () => {
        throw { code: 'permission-denied' }
      },
      'Read sensitive doc',
      { nullOnPermissionDenied: true }
    )
    expect(permissionResult).toBeNull()

    const notFoundResult = await withNullOnError(
      async () => {
        throw { code: 'storage/object-not-found' }
      },
      'Read file',
      { nullOnNotFound: true }
    )
    expect(notFoundResult).toBeNull()

    await expect(
      withNullOnError(async () => {
        throw { code: 'something-else' }
      }, 'Read file')
    ).rejects.toThrow('An error occurred. Please try again.')
  })

  it('identifies common Firebase error categories', () => {
    expect(isPermissionError({ code: 'permission-denied' })).toBe(true)
    expect(isNotFoundError({ code: 'not-found' })).toBe(true)
    expect(isAuthError({ code: 'auth/wrong-password' })).toBe(true)
    expect(
      isNetworkError({
        code: 'auth/network-request-failed',
        message: 'Network went down',
      })
    ).toBe(true)
  })
})
