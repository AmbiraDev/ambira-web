export const ERROR_MESSAGES = {
  // Session errors
  SESSION_SAVE_FAILED: 'Failed to save session. Please check your connection and try again.',
  SESSION_DELETE_FAILED: 'Failed to delete session. Please try again.',
  SESSION_LOAD_FAILED: 'Failed to load sessions. Please refresh the page.',
  SESSION_UPDATE_FAILED: 'Failed to update session. Please try again.',

  // User errors
  PROFILE_LOAD_FAILED: 'Failed to load profile. Please refresh the page.',
  PROFILE_UPDATE_FAILED: 'Failed to update profile. Please try again.',
  FOLLOW_FAILED: 'Failed to follow user. Please try again.',
  UNFOLLOW_FAILED: 'Failed to unfollow user. Please try again.',

  // Challenge errors
  CHALLENGE_JOIN_FAILED: 'Failed to join challenge. Please try again.',
  CHALLENGE_LEAVE_FAILED: 'Failed to leave challenge. Please try again.',
  CHALLENGE_LOAD_FAILED: 'Failed to load challenge details. Please refresh.',

  // Group errors
  GROUP_JOIN_FAILED: 'Failed to join group. Please try again.',
  GROUP_LEAVE_FAILED: 'Failed to leave group. Please try again.',
  GROUP_LOAD_FAILED: 'Failed to load group details. Please refresh.',

  // Comment errors
  COMMENT_POST_FAILED: 'Failed to post comment. Please try again.',
  COMMENT_DELETE_FAILED: 'Failed to delete comment. Please try again.',
  COMMENT_LOAD_FAILED: 'Failed to load comments. Please refresh.',

  // Upload errors
  IMAGE_UPLOAD_FAILED: 'Failed to upload image. Please try a smaller file.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image (JPG, PNG, or GIF).',

  // Auth errors
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  SIGNUP_FAILED: 'Signup failed. Please try again.',
  LOGOUT_FAILED: 'Logout failed. Please try again.',

  // Generic errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
}

/**
 * Timeout-specific error messages
 * Used when operations exceed their allowed time limits
 */
export const TIMEOUT_ERRORS = {
  /** Image upload timeout (30 seconds) */
  IMAGE_UPLOAD: 'Upload taking too long. Try a smaller image.',

  /** Firebase query timeout (10 seconds) */
  FIREBASE_QUERY: 'Request timed out. Please check your connection.',

  /** API request timeout (15 seconds) */
  API_REQUEST: 'Request timed out. Please try again.',

  /** General operation timeout */
  OPERATION_TIMEOUT: 'Operation timed out. Please try again.',
}
