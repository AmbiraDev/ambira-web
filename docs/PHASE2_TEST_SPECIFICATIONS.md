# Phase 2: Detailed Test Specifications

**Target Coverage:** 40% | **Effort:** 40-50 hours | **Timeline:** 2-3 weeks

This document provides detailed test case specifications for Phase 2 coverage expansion focusing on critical API modules.

---

## Part 1: Sessions API Test Specifications

**File:** `src/lib/api/sessions/index.ts` (1,015 lines)
**Current Coverage:** 12.78%
**Target Coverage:** 45%
**Estimated Tests:** 70 tests
**Estimated Test Code:** 1,500 lines

### Unit Tests for Sessions API

#### Test Suite 1: Core CRUD Operations

```typescript
describe('Sessions API - CRUD Operations', () => {
  // CREATE OPERATIONS
  describe('createSession()', () => {
    it('should create a session with valid data', async () => {
      // Test basic session creation
      // Assert: Session ID generated, timestamps set, defaults applied
    });

    it('should strip undefined values before writing', async () => {
      // Critical for Firestore compatibility
      // Assert: Undefined fields removed from document
    });

    it('should set serverTimestamp for createdAt/updatedAt', async () => {
      // Ensure server-side timestamp consistency
      // Assert: Timestamps are Timestamp objects
    });

    it('should populate user and activity references', async () => {
      // Ensure ForeignKey relationships work
      // Assert: User and activity data included
    });

    it('should create with default visibility level', async () => {
      // Test default 'everyone' visibility
      // Assert: visibility === 'everyone'
    });

    it('should initialize engagement counters', async () => {
      // Test supportCount and commentCount default to 0
      // Assert: supportCount === 0, commentCount === 0
    });

    it('should validate required fields', async () => {
      // Test error when missing userId, activityId, duration
      // Assert: Throws validation error
    });

    it('should reject invalid session duration', async () => {
      // Test negative, zero, or NaN duration
      // Assert: Throws error for invalid duration
    });

    it('should reject invalid visibility values', async () => {
      // Test visibility only allows 'everyone', 'followers', 'private'
      // Assert: Throws validation error
    });

    it('should enforce rate limiting on session creation', async () => {
      // Test rate limit of N sessions per hour
      // Assert: Throws rate limit error
    });

    it('should handle activity reference that does not exist', async () => {
      // Test error when activityId doesn't exist
      // Assert: Throws appropriate error (may or may not block based on design)
    });
  });

  // READ OPERATIONS
  describe('getSession()', () => {
    it('should retrieve session by ID', async () => {
      // Basic retrieval
      // Assert: Returns matching session
    });

    it('should return null when session not found', async () => {
      // Test non-existent session ID
      // Assert: Returns null, not error
    });

    it('should populate user and activity data', async () => {
      // Test denormalization
      // Assert: user and activity fields populated
    });

    it('should include engagement data', async () => {
      // Test supportCount and commentCount
      // Assert: Engagement fields present
    });

    it('should handle deleted sessions', async () => {
      // Test sessions marked as deleted/archived
      // Assert: Returns session with deleted flag or null based on design
    });

    it('should handle session with missing user reference', async () => {
      // Test when user is deleted but session remains
      // Assert: Graceful handling (partial data or special value)
    });

    it('should handle session with missing activity reference', async () => {
      // Test when activity is deleted but session remains
      // Assert: Graceful handling
    });
  });

  // UPDATE OPERATIONS
  describe('updateSession()', () => {
    it('should update session title', async () => {
      // Test single field update
      // Assert: Title changed, other fields preserved
    });

    it('should update session description', async () => {
      // Test description change
      // Assert: Description updated
    });

    it('should update session visibility', async () => {
      // Test changing public/private status
      // Assert: Visibility changed
    });

    it('should update session duration', async () => {
      // Test duration modification
      // Assert: Duration updated
    });

    it('should set updatedAt timestamp', async () => {
      // Ensure any update sets updatedAt
      // Assert: updatedAt is server timestamp
    });

    it('should not update createdAt on modification', async () => {
      // createdAt should never change
      // Assert: createdAt unchanged
    });

    it('should not strip engagement counters on update', async () => {
      // Avoid overwriting supportCount/commentCount
      // Assert: Counters preserved
    });

    it('should prevent updating non-owned sessions', async () => {
      // Auth test
      // Assert: Throws permission error
    });

    it('should validate updated duration', async () => {
      // Test invalid duration on update
      // Assert: Throws validation error
    });

    it('should handle partial updates (no data loss)', async () => {
      // Test batched update instead of setDoc
      // Assert: Unspecified fields unchanged
    });

    it('should prevent updating archived sessions', async () => {
      // Test immutability of archived sessions
      // Assert: Throws error when attempting to modify archived
    });

    it('should handle concurrent updates', async () => {
      // Test two updates to same session simultaneously
      // Assert: One succeeds, other retries or fails gracefully
    });
  });

  // DELETE OPERATIONS
  describe('deleteSession()', () => {
    it('should delete session by ID', async () => {
      // Soft delete (set deleted flag) or hard delete
      // Assert: Session marked deleted or removed
    });

    it('should only allow session owner to delete', async () => {
      // Auth test
      // Assert: Non-owner gets permission error
    });

    it('should handle deleting non-existent session', async () => {
      // Test deleting already-deleted or never-existed session
      // Assert: Returns gracefully (idempotent)
    });

    it('should cascade delete comments on session', async () => {
      // Test if comments are deleted when session is deleted
      // Assert: Comments also deleted (or marked)
    });

    it('should cascade delete supports on session', async () => {
      // Test if supports are deleted
      // Assert: Supports also deleted
    });

    it('should remove session from feed queries', async () => {
      // Test deleted sessions don't appear in getFeedSessions
      // Assert: Deleted session not returned in queries
    });

    it('should archive instead of delete on soft-delete design', async () => {
      // If design uses soft-delete
      // Assert: isArchived or deleted flag set
    });
  });
});
```

#### Test Suite 2: Feed Operations

```typescript
describe('Sessions API - Feed Operations', () => {
  describe('getFeedSessions()', () => {
    it('should retrieve feed for authenticated user', async () => {
      // Get sessions from followed users
      // Assert: Returns sessions from followees
    });

    it('should respect visibility settings', async () => {
      // Test visibility filtering
      // Assert: Only 'everyone' and 'followers' sessions returned
    });

    it('should exclude private sessions from non-followers', async () => {
      // Test privacy enforcement
      // Assert: Private sessions filtered for non-followers
    });

    it('should include own private sessions in feed', async () => {
      // User should see their own private sessions
      // Assert: Own private sessions included
    });

    it('should order by newest first', async () => {
      // Test createdAt descending order
      // Assert: Sessions ordered by date descending
    });

    it('should handle pagination with limit and offset', async () => {
      // Test limit/offset parameters
      // Assert: Returns correct page of results
    });

    it('should return cursor for infinite scroll', async () => {
      // Test cursor-based pagination
      // Assert: Next cursor provided for pagination
    });

    it('should filter by activity type', async () => {
      // Test filtering sessions by activity
      // Assert: Only matching activity sessions returned
    });

    it('should handle empty following list', async () => {
      // Test user following nobody
      // Assert: Returns only own sessions or empty list
    });

    it('should handle large result sets efficiently', async () => {
      // Test performance with 1000+ sessions
      // Assert: Returns within time limit
    });

    it('should cache feed results', async () => {
      // Test caching of feed queries
      // Assert: Subsequent queries use cache
    });

    it('should invalidate cache on new session', async () => {
      // Test cache bust when new session created
      // Assert: New session appears in feed
    });

    it('should handle deleted sessions in feed', async () => {
      // Test deleted sessions don't appear
      // Assert: Deleted sessions filtered
    });

    it('should populate user and activity data in results', async () => {
      // Test denormalization in feed results
      // Assert: User and activity data included
    });
  });

  describe('getSessionsForUser()', () => {
    it('should retrieve all sessions for a user', async () => {
      // Get user's session history
      // Assert: All user sessions returned
    });

    it('should order by newest first', async () => {
      // Test ordering
      // Assert: Sessions ordered by date descending
    });

    it('should respect user privacy settings', async () => {
      // Test privacy enforcement for other users viewing profile
      // Assert: Only public sessions visible to others
    });

    it('should show all sessions to session owner', async () => {
      // Own sessions visible regardless of privacy
      // Assert: All own sessions returned to owner
    });

    it('should handle pagination', async () => {
      // Test large user session history
      // Assert: Pagination works with limit/offset
    });

    it('should include engagement counts', async () => {
      // Test supportCount and commentCount
      // Assert: Engagement fields populated
    });
  });

  describe('getSessionsForChallenge()', () => {
    it('should retrieve sessions for a challenge', async () => {
      // Get all sessions logged for a challenge
      // Assert: Challenge sessions returned
    });

    it('should order by date for leaderboard', async () => {
      // Test ordering for leaderboard generation
      // Assert: Sessions ordered appropriately
    });

    it('should only include challenge participants', async () => {
      // Filter to challenge members only
      // Assert: Only participant sessions returned
    });

    it('should aggregate session data for leaderboard', async () => {
      // Combine multiple sessions per user
      // Assert: Aggregated data provided
    });

    it('should handle challenge with no participants', async () => {
      // Test empty challenge
      // Assert: Returns empty list gracefully
    });
  });

  describe('getSessionsForTimePeriod()', () => {
    it('should retrieve sessions within date range', async () => {
      // Test filtering by date range
      // Assert: Only sessions in range returned
    });

    it('should handle daily sessions', async () => {
      // Test single day queries
      // Assert: Only same-day sessions returned
    });

    it('should handle weekly sessions', async () => {
      // Test week-long queries
      // Assert: 7-day range respected
    });

    it('should handle monthly aggregation', async () => {
      // Test entire month queries
      // Assert: Month range respected
    });

    it('should handle time zone conversions', async () => {
      // Test date boundaries with different timezones
      // Assert: Correct sessions returned accounting for timezone
    });

    it('should exclude future-dated sessions', async () => {
      // Sessions dated in future should be excluded
      // Assert: Future sessions not returned
    });
  });
});
```

#### Test Suite 3: Error Handling

```typescript
describe('Sessions API - Error Handling', () => {
  describe('Error Cases', () => {
    it('should handle Firestore permission error', async () => {
      // Simulate permission denied from Firestore
      // Assert: Error caught, logged, thrown to caller
    });

    it('should handle Firestore quota exceeded', async () => {
      // Simulate quota exceeded error
      // Assert: Appropriate error message
    });

    it('should handle network timeout', async () => {
      // Simulate network failure
      // Assert: Error with timeout message
    });

    it('should handle Firestore document not found', async () => {
      // Test getSession on deleted document
      // Assert: Returns null or throws as designed
    });

    it('should handle invalid Firebase references', async () => {
      // Test with malformed document IDs
      // Assert: Validation error
    });

    it('should handle concurrent write conflicts', async () => {
      // Two simultaneous updates to same session
      // Assert: One succeeds, other retries or fails
    });

    it('should log errors for debugging', async () => {
      // Test error logging
      // Assert: Error logged with context
    });

    it('should provide user-friendly error messages', async () => {
      // Test error message quality
      // Assert: Messages are clear, not technical
    });

    it('should not expose sensitive data in errors', async () => {
      // Test error messages don't leak data
      // Assert: No credential/personal data in errors
    });

    it('should handle partial write failures', async () => {
      // Test batched operations with some failures
      // Assert: Appropriate error recovery
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce per-user rate limits', async () => {
      // Test creation rate limit
      // Assert: Error after N sessions in time period
    });

    it('should return rate limit status in error', async () => {
      // Test error includes retry-after info
      // Assert: Includes reset time or wait duration
    });

    it('should track rate limit per user', async () => {
      // Different users should have independent limits
      // Assert: User A limited doesn't affect User B
    });

    it('should reset rate limit on new time window', async () => {
      // Test rate limit resets
      // Assert: After time window passes, can create again
    });
  });

  describe('Validation Errors', () => {
    it('should reject sessions with null userId', async () => {
      // Missing userId
      // Assert: Validation error
    });

    it('should reject sessions with null activityId', async () => {
      // Missing activityId
      // Assert: Validation error
    });

    it('should reject sessions with negative duration', async () => {
      // Invalid duration
      // Assert: Validation error
    });

    it('should reject sessions with NaN duration', async () => {
      // NaN duration
      // Assert: Validation error
    });

    it('should reject sessions with zero duration', async () => {
      // Depending on design, zero may be invalid
      // Assert: Validation error or accepted
    });

    it('should reject sessions with invalid visibility', async () => {
      // Invalid visibility value
      // Assert: Validation error
    });

    it('should reject sessions with invalid timestamps', async () => {
      // Invalid or missing startTime
      // Assert: Validation error
    });
  });
});
```

#### Test Suite 4: Edge Cases

```typescript
describe('Sessions API - Edge Cases', () => {
  describe('Null/Undefined Handling', () => {
    it('should handle session with null user reference', async () => {
      // User deleted, session remains
      // Assert: Graceful handling
    });

    it('should handle session with null activity reference', async () => {
      // Activity deleted, session remains
      // Assert: Graceful handling
    });

    it('should handle session with missing optional fields', async () => {
      // Optional fields like description missing
      // Assert: Treats as empty or uses defaults
    });

    it('should not write undefined values to Firestore', async () => {
      // Critical for Firestore
      // Assert: Undefined fields stripped
    });

    it('should handle null timestamps', async () => {
      // Missing or null timestamps
      // Assert: Server timestamp applied
    });
  });

  describe('Large Data Sets', () => {
    it('should handle feed with 1000+ sessions', async () => {
      // Large result set
      // Assert: Returns within time budget
    });

    it('should handle users with 1000+ followers', async () => {
      // Large follower list
      // Assert: Feed queries still performant
    });

    it('should handle sessions with 100+ comments', async () => {
      // Large comment count
      // Assert: Engagement data accurate
    });

    it('should handle sessions with 1000+ supports', async () => {
      // Large support count
      // Assert: Engagement data accurate
    });

    it('should paginate results for large sets', async () => {
      // Pagination for large result sets
      // Assert: Pagination works correctly
    });
  });

  describe('Timestamp Edge Cases', () => {
    it('should handle sessions with future timestamps', async () => {
      // Sessions dated in future
      // Assert: Handled appropriately (might exclude)
    });

    it('should handle sessions with very old timestamps', async () => {
      // Sessions from old app version
      // Assert: Still work correctly
    });

    it('should handle sessions spanning multiple days', async () => {
      // Sessions that cross day boundary
      // Assert: Timestamps correct
    });

    it('should handle timezone boundary issues', async () => {
      // Sessions at timezone boundaries
      // Assert: Correct timezone handling
    });

    it('should handle leap second edge case', async () => {
      // Rare but possible
      // Assert: Handles gracefully
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent session creation', async () => {
      // Multiple simultaneous creates
      // Assert: Both succeed, IDs unique
    });

    it('should handle concurrent updates to same session', async () => {
      // Two updates simultaneously
      // Assert: One succeeds, appropriate conflict handling
    });

    it('should handle create and delete race condition', async () => {
      // Create and delete happening simultaneously
      // Assert: Graceful handling
    });

    it('should handle engagement counter increments concurrently', async () => {
      // Multiple users supporting/commenting simultaneously
      // Assert: Counters accurate (no race condition)
    });
  });

  describe('Special Characters & Encoding', () => {
    it('should handle emoji in session title', async () => {
      // Title with emoji
      // Assert: Stored and retrieved correctly
    });

    it('should handle unicode in description', async () => {
      // Description with unicode
      // Assert: Preserved correctly
    });

    it('should handle very long titles', async () => {
      // Very long text
      // Assert: Handles or validates max length
    });

    it('should handle HTML/script in content', async () => {
      // Security test - potential XSS
      // Assert: Escaped or sanitized
    });

    it('should handle null bytes in text', async () => {
      // Edge case with null bytes
      // Assert: Handled safely
    });
  });
});
```

### Integration Tests for Sessions

```typescript
describe('Sessions API - Integration Tests', () => {
  describe('Session -> Activity Integration', () => {
    it('should increment activity usage count when session created', async () => {
      // Test activity preference update
      // Assert: useCount incremented
    });

    it('should update lastUsed timestamp for activity', async () => {
      // Test activity last used tracking
      // Assert: lastUsed updated
    });

    it('should create activity preference if not exists', async () => {
      // Test auto-create of preference
      // Assert: Preference created on first use
    });

    it('should handle activity preference creation race condition', async () => {
      // Multiple sessions creating same preference simultaneously
      // Assert: One created, others use existing
    });
  });

  describe('Session -> Challenge Integration', () => {
    it('should add session to challenge participation', async () => {
      // When user logs session for challenge
      // Assert: Challenge records the session
    });

    it('should update challenge progress', async () => {
      // Progress tracking for challenges
      // Assert: Progress updated correctly
    });

    it('should check challenge eligibility', async () => {
      // Validate session meets challenge requirements
      // Assert: Appropriate validation
    });
  });

  describe('Session -> Feed Integration', () => {
    it('should make session visible in followers feed', async () => {
      // Session should appear in follower feeds
      // Assert: Visible in getFeedSessions for followers
    });

    it('should respect session visibility in feed', async () => {
      // Private sessions should not appear to non-followers
      // Assert: Feed respects visibility
    });

    it('should update feed cache on new session', async () => {
      // New session should invalidate cache
      // Assert: New session appears immediately in feed
    });
  });

  describe('Session -> Social Integration', () => {
    it('should allow supports on session', async () => {
      // Users can support session
      // Assert: Support recorded and counted
    });

    it('should allow comments on session', async () => {
      // Users can comment on session
      // Assert: Comment recorded
    });

    it('should increment engagement counters', async () => {
      // Supports and comments increment counters
      // Assert: supportCount and commentCount updated
    });
  });
});
```

---

## Part 2: Users API Test Specifications

**File:** `src/lib/api/users/index.ts` (1,509 lines)
**Current Coverage:** 2.14%
**Target Coverage:** 45%
**Estimated Tests:** 70 tests
**Estimated Test Code:** 1,500 lines

### Unit Tests for Users API

#### Test Suite 1: User CRUD Operations

```typescript
describe('Users API - CRUD Operations', () => {
  describe('getUser()', () => {
    it('should retrieve user by ID', async () => {
      // Basic user fetch
      // Assert: User data returned
    });

    it('should return null for non-existent user', async () => {
      // Fetch deleted or never-existed user
      // Assert: Returns null
    });

    it('should include follower/following counts', async () => {
      // Test count fields
      // Assert: Counts included
    });

    it('should include user statistics', async () => {
      // Sessions count, streak info, etc.
      // Assert: Stats included
    });

    it('should respect privacy visibility settings', async () => {
      // Other users viewing profile should see privacy restrictions
      // Assert: Profile data filtered based on visibility
    });

    it('should show full profile to user owner', async () => {
      // User seeing own profile
      // Assert: All data visible
    });

    it('should include profile picture URL', async () => {
      // Test image data
      // Assert: Picture URL included or default
    });

    it('should include user preferences', async () => {
      // Privacy, notification preferences
      // Assert: Preferences included
    });
  });

  describe('getUserByUsername()', () => {
    it('should retrieve user by username', async () => {
      // Query by unique username
      // Assert: User returned
    });

    it('should be case-insensitive if designed', async () => {
      // Test case handling
      // Assert: Correct behavior per design
    });

    it('should return null for non-existent username', async () => {
      // Non-existent username
      // Assert: Returns null
    });

    it('should handle usernames with special characters', async () => {
      // Usernames can have dots, dashes, etc.
      // Assert: Handled correctly
    });
  });

  describe('updateUser()', () => {
    it('should update user name', async () => {
      // Change display name
      // Assert: Name updated
    });

    it('should update user bio/description', async () => {
      // Bio updates
      // Assert: Bio updated
    });

    it('should update profile picture', async () => {
      // Picture changes
      // Assert: Picture URL updated
    });

    it('should update privacy settings', async () => {
      // Visibility and privacy changes
      // Assert: Privacy settings updated
    });

    it('should update notification preferences', async () => {
      // Notification settings
      // Assert: Preferences updated
    });

    it('should set updatedAt timestamp', async () => {
      // Every update sets updatedAt
      // Assert: updatedAt is current timestamp
    });

    it('should not allow changing userId', async () => {
      // Security - can't change user ID
      // Assert: Throws error or ignores
    });

    it('should not allow changing username if taken', async () => {
      // Username uniqueness
      // Assert: Throws error if username taken
    });

    it('should allow changing username if available', async () => {
      // Username uniqueness
      // Assert: Allows if available
    });

    it('should not change createdAt on update', async () => {
      // createdAt immutable
      // Assert: createdAt unchanged
    });

    it('should only allow user to update own profile', async () => {
      // Auth test
      // Assert: Other users get permission error
    });
  });

  describe('deleteUser()', () => {
    it('should delete user account', async () => {
      // Account deletion
      // Assert: User marked deleted or removed
    });

    it('should only allow user to delete own account', async () => {
      // Auth test
      // Assert: Other users get permission error
    });

    it('should cascade delete user sessions', async () => {
      // Test if sessions deleted with user
      // Assert: Sessions handled appropriately
    });

    it('should cascade delete user comments', async () => {
      // Comments deleted with user
      // Assert: Comments removed or preserved
    });

    it('should handle deleting already-deleted user', async () => {
      // Idempotent delete
      // Assert: Returns gracefully
    });

    it('should unfollow user from all followers', async () => {
      // Remove user from follower lists
      // Assert: Follower relationships cleaned up
    });

    it('should remove user from all groups', async () => {
      // Remove from group memberships
      // Assert: Group relationships cleaned up
    });
  });
});
```

#### Test Suite 2: User Search and Discovery

```typescript
describe('Users API - Search & Discovery', () => {
  describe('searchUsers()', () => {
    it('should search users by name', async () => {
      // Search by display name
      // Assert: Matching users returned
    });

    it('should search users by username', async () => {
      // Search by username
      // Assert: Matching users returned
    });

    it('should search users by bio keywords', async () => {
      // Search in bio/description
      // Assert: Bio matches returned
    });

    it('should be case-insensitive', async () => {
      // Case handling
      // Assert: Case-insensitive matches
    });

    it('should handle partial matches', async () => {
      // Prefix/substring matching
      // Assert: Partial matches work
    });

    it('should return relevant results first', async () => {
      // Relevance ranking
      // Assert: Better matches ranked higher
    });

    it('should paginate search results', async () => {
      // Large result sets
      // Assert: Pagination works
    });

    it('should exclude deleted users', async () => {
      // Deleted users not in results
      // Assert: Only active users returned
    });

    it('should respect privacy for search results', async () => {
      // Private profiles might not be searchable (depends on design)
      // Assert: Privacy respected in results
    });

    it('should handle empty search query', async () => {
      // Empty or null search
      // Assert: Returns recent/popular users or empty
    });

    it('should handle special characters in search', async () => {
      // Special characters in search term
      // Assert: Handled safely
    });
  });

  describe('getUserSuggestions()', () => {
    it('should return suggested users to follow', async () => {
      // Follow suggestions
      // Assert: Relevant users suggested
    });

    it('should exclude already-followed users', async () => {
      // Don't suggest users already followed
      // Assert: Only new users suggested
    });

    it('should exclude self from suggestions', async () => {
      // Don't suggest user to themselves
      // Assert: User not in own suggestions
    });

    it('should use follower-of-follower algorithm', async () => {
      // Suggest friends of friends
      // Assert: Appropriate algorithm used
    });

    it('should be personalized by user history', async () => {
      // Suggestions based on activities, interests
      // Assert: Personalized suggestions
    });

    it('should have reasonable diversity', async () => {
      // Not all suggestions from same group
      // Assert: Diverse suggestions
    });

    it('should handle new users with no follows', async () => {
      // New user should get suggestions
      // Assert: Popular or default users suggested
    });

    it('should update as user follows more', async () => {
      // Suggestions should change as follows change
      // Assert: Suggestions update appropriately
    });
  });
});
```

#### Test Suite 3: Social Graph Operations

```typescript
describe('Users API - Social Graph', () => {
  describe('getFollowers()', () => {
    it('should retrieve followers of a user', async () => {
      // Get user's followers
      // Assert: Follower list returned
    });

    it('should return follower count', async () => {
      // Total follower count
      // Assert: Count accurate
    });

    it('should paginate large follower lists', async () => {
      // Users with many followers
      // Assert: Pagination works
    });

    it('should respect privacy settings', async () => {
      // Private accounts might hide follower list (design dependent)
      // Assert: Privacy respected
    });

    it('should show follower relationship status', async () => {
      // Whether current user follows back
      // Assert: Relationship status included
    });
  });

  describe('getFollowing()', () => {
    it('should retrieve users being followed', async () => {
      // Get user's following list
      // Assert: Following list returned
    });

    it('should return following count', async () => {
      // Total following count
      // Assert: Count accurate
    });

    it('should paginate large following lists', async () => {
      // Users following many people
      // Assert: Pagination works
    });

    it('should respect privacy settings', async () => {
      // Private accounts might hide following (design dependent)
      // Assert: Privacy respected
    });
  });

  describe('getFollowingIds()', () => {
    it('should return array of following user IDs', async () => {
      // Efficient IDs-only fetch
      // Assert: Returns ID array
    });

    it('should handle user with no following', async () => {
      // New user following nobody
      // Assert: Returns empty array
    });

    it('should be efficient for large followings', async () => {
      // Optimized query
      // Assert: Returns quickly even for 1000+ following
    });
  });

  describe('isFollowing()', () => {
    it('should return true if user is followed', async () => {
      // Check follow status
      // Assert: Returns true when following
    });

    it('should return false if user is not followed', async () => {
      // Check follow status
      // Assert: Returns false when not following
    });

    it('should handle checking own user', async () => {
      // User is always following self? (design dependent)
      // Assert: Appropriate behavior
    });
  });
});
```

#### Test Suite 4: Statistics and Analytics

```typescript
describe('Users API - Statistics', () => {
  describe('getUserStats()', () => {
    it('should return session count', async () => {
      // Total sessions
      // Assert: Count accurate
    });

    it('should return total session duration', async () => {
      // Total time spent
      // Assert: Duration accurate
    });

    it('should return current streak', async () => {
      // Active streak info
      // Assert: Streak accurate
    });

    it('should return longest streak', async () => {
      // Historical longest streak
      // Assert: Streak accurate
    });

    it('should return activity breakdown', async () => {
      // Sessions by activity type
      // Assert: Breakdown accurate
    });

    it('should return engagement stats', async () => {
      // Supports received, comments received
      // Assert: Engagement counts accurate
    });

    it('should return time period statistics', async () => {
      // Stats by week, month, year
      // Assert: Period stats accurate
    });

    it('should handle user with no sessions', async () => {
      // New user no activity
      // Assert: Returns zero stats gracefully
    });

    it('should handle deleted sessions in stats', async () => {
      // Deleted sessions shouldn't count
      // Assert: Stats exclude deleted sessions
    });
  });

  describe('getUserActivity()', () => {
    it('should return activity counts by type', async () => {
      // How many sessions per activity
      // Assert: Counts accurate
    });

    it('should return favorite activity', async () => {
      // Most-used activity
      // Assert: Correct activity identified
    });

    it('should handle user with single activity', async () => {
      // User only doing one activity type
      // Assert: Handled correctly
    });
  });
});
```

#### Test Suite 5: Error Handling

```typescript
describe('Users API - Error Handling', () => {
  describe('Error Cases', () => {
    it('should handle Firestore permission error', async () => {
      // Simulate permission denied
      // Assert: Error caught and handled
    });

    it('should handle user not found', async () => {
      // Non-existent user
      // Assert: Returns null or throws as designed
    });

    it('should handle network timeout', async () => {
      // Network failure
      // Assert: Error with timeout message
    });

    it('should handle corrupted user data', async () => {
      // Missing required fields
      // Assert: Graceful handling
    });

    it('should handle concurrent profile updates', async () => {
      // Two updates simultaneously
      // Assert: One succeeds, appropriate conflict handling
    });

    it('should not expose sensitive data in errors', async () => {
      // Error privacy
      // Assert: No sensitive data leaked
    });

    it('should log errors appropriately', async () => {
      // Error logging
      // Assert: Errors logged with context
    });
  });

  describe('Validation Errors', () => {
    it('should validate username format', async () => {
      // Username validation rules
      // Assert: Invalid usernames rejected
    });

    it('should validate email format', async () => {
      // Email validation
      // Assert: Invalid emails rejected
    });

    it('should enforce username uniqueness', async () => {
      // Can't have duplicate usernames
      // Assert: Throws error for duplicates
    });

    it('should validate profile picture URL', async () => {
      // Image URL validation
      // Assert: Invalid URLs rejected
    });

    it('should validate privacy settings values', async () => {
      // Only valid privacy values allowed
      // Assert: Invalid values rejected
    });
  });
});
```

### Integration Tests for Users

```typescript
describe('Users API - Integration Tests', () => {
  describe('User -> Following Integration', () => {
    it('should update follower count when user is followed', async () => {
      // Follower count increment
      // Assert: Count updated
    });

    it('should update following count when user follows', async () => {
      // Following count increment
      // Assert: Count updated
    });

    it('should maintain consistency between forward and backward relationships', async () => {
      // If A follows B, then B should know A is a follower
      // Assert: Bidirectional consistency
    });
  });

  describe('User -> Sessions Integration', () => {
    it('should update user stats when session created', async () => {
      // Session count, duration, streak updated
      // Assert: Stats updated
    });

    it('should include user data in session feed results', async () => {
      // Sessions should have denormalized user data
      // Assert: User data included in sessions
    });
  });

  describe('User -> Group Integration', () => {
    it('should remove user from groups when account deleted', async () => {
      // User deletion cleans up group memberships
      // Assert: User removed from all groups
    });
  });

  describe('User -> Challenge Integration', () => {
    it('should remove user from challenges when account deleted', async () => {
      // User deletion cleans up challenge participation
      // Assert: User removed from all challenges
    });
  });
});
```

---

## Part 3: Challenges API Test Specifications

**File:** `src/lib/api/challenges/index.ts` (881 lines)
**Current Coverage:** 2.34%
**Target Coverage:** 40%
**Estimated Tests:** 50 tests
**Estimated Test Code:** 1,000 lines

### High-Priority Test Cases

```typescript
describe('Challenges API', () => {
  describe('createChallenge()', () => {
    it('should create global challenge', async () => {
      // Create challenge visible to all users
      // Assert: Challenge created with correct settings
    });

    it('should create group-specific challenge', async () => {
      // Create challenge for group only
      // Assert: Challenge scoped to group
    });

    it('should set challenge type correctly', async () => {
      // Types: most-activity, fastest-effort, longest-session, group-goal
      // Assert: Type set correctly
    });

    it('should set challenge dates correctly', async () => {
      // Start and end dates
      // Assert: Dates set and valid
    });

    it('should require valid type', async () => {
      // Invalid challenge type
      // Assert: Throws validation error
    });

    it('should require start before end', async () => {
      // Date validation
      // Assert: Throws if end before start
    });

    it('should only allow group admin to create group challenge', async () => {
      // Auth test
      // Assert: Non-admin gets error
    });

    it('should initialize participant tracking', async () => {
      // Participant count starts at 0
      // Assert: Tracking initialized
    });
  });

  describe('joinChallenge()', () => {
    it('should add user to challenge participants', async () => {
      // User joins challenge
      // Assert: User added to participants
    });

    it('should prevent duplicate participation', async () => {
      // User already in challenge
      // Assert: Throws error when joining twice
    });

    it('should increment participant count', async () => {
      // Participant counter updates
      // Assert: Count incremented
    });

    it('should validate user can join (not expired, etc.)', async () => {
      // Join validation
      // Assert: Validates appropriately
    });

    it('should initialize participant progress', async () => {
      // Create challenge participant record
      // Assert: Progress initialized
    });
  });

  describe('getLeaderboard()', () => {
    it('should return ranked participants', async () => {
      // Participants ranked by activity/time
      // Assert: Ranked list returned
    });

    it('should rank by activity count for most-activity', async () => {
      // Challenge type: most-activity
      // Assert: Ranked by session count
    });

    it('should rank by duration for longest-session', async () => {
      // Challenge type: longest-session
      // Assert: Ranked by max session duration
    });

    it('should rank by speed for fastest-effort', async () => {
      // Challenge type: fastest-effort
      // Assert: Ranked by completion speed
    });

    it('should rank by goal progress for group-goal', async () => {
      // Challenge type: group-goal
      // Assert: Ranked by progress toward goal
    });

    it('should handle ties correctly', async () => {
      // Multiple participants with same score
      // Assert: Tie-breaking applied (tie_break_at, etc.)
    });

    it('should paginate results', async () => {
      // Large leaderboards
      // Assert: Pagination works
    });

    it('should exclude non-participants', async () => {
      // Only participants on leaderboard
      // Assert: Non-participants excluded
    });

    it('should show current user position', async () => {
      // User's rank highlighted
      // Assert: User position included
    });

    it('should show progress for active challenges', async () => {
      // Active challenges show current progress
      // Assert: Progress included in results
    });

    it('should show final scores for completed challenges', async () => {
      // Completed challenges show final results
      // Assert: Final scores shown
    });
  });

  describe('updateProgress()', () => {
    it('should update participant progress', async () => {
      // Log activity counts/duration
      // Assert: Progress updated
    });

    it("should validate progress doesn't exceed limits", async () => {
      // Can't report more than actual
      // Assert: Validates progress
    });

    it('should update participant ranking', async () => {
      // Leaderboard recalculates
      // Assert: Ranking updated
    });

    it('should handle concurrent progress updates', async () => {
      // Multiple updates to same participant
      // Assert: All updates counted
    });

    it('should prevent progress updates on completed challenges', async () => {
      // Can't update after challenge ends
      // Assert: Throws error
    });
  });

  describe('completeChallenge()', () => {
    it('should mark challenge as completed', async () => {
      // Challenge finished
      // Assert: Status set to completed
    });

    it('should prevent further progress updates', async () => {
      // Completed challenges read-only
      // Assert: Updates rejected
    });

    it('should lock final leaderboard', async () => {
      // Leaderboard finalized
      // Assert: Leaderboard frozen
    });

    it('should award rewards to winners', async () => {
      // If rewards system exists
      // Assert: Rewards calculated and distributed
    });

    it('should archive completed challenge', async () => {
      // Challenge moved to archive
      // Assert: Not shown in active challenges
    });

    it('should preserve challenge history', async () => {
      // Archive maintains data
      // Assert: Historical data preserved
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid challenge type', async () => {
      // Invalid type
      // Assert: Validation error
    });

    it('should handle challenge not found', async () => {
      // Non-existent challenge
      // Assert: Returns null or error
    });

    it('should handle concurrent joins', async () => {
      // Multiple users joining simultaneously
      // Assert: One succeeds, others get duplicate error
    });

    it('should handle network failures', async () => {
      // Network timeout
      // Assert: Error with appropriate message
    });

    it('should handle permission errors', async () => {
      // User not allowed to join
      // Assert: Permission error
    });
  });
});
```

---

## Part 4: Testing Implementation Guidelines

### Test File Organization

```
tests/unit/lib/api/
├── sessions/
│   ├── index.test.ts (800 lines)
│   ├── helpers.test.ts (400 lines)
│   └── posts.test.ts (200 lines)
├── users/
│   ├── index.test.ts (800 lines)
│   └── getFollowingIds.test.ts (200 lines)
├── challenges/
│   ├── index.test.ts (600 lines)
│   └── leaderboard.test.ts (300 lines)
└── groups/
    └── index.test.ts (400 lines)

tests/integration/
├── sessions/
│   ├── feed-flow.test.ts
│   └── challenge-integration.test.ts
├── users/
│   ├── social-graph.test.ts
│   └── discovery-flow.test.ts
└── challenges/
    └── participation-flow.test.ts
```

### Mock Setup Template

```typescript
// tests/unit/lib/api/sessions/__mocks__/firebase.ts
export const mockDb = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
};

export const mockAuth = {
  currentUser: { uid: 'test-user-id' },
};

jest.mock('@/lib/firebase', () => ({
  db: mockDb,
  auth: mockAuth,
}));
```

### Test Execution Commands

```bash
# Run Phase 2 tests
npm test -- tests/unit/lib/api/

# Run with coverage
npm test -- tests/unit/lib/api/ --coverage

# Run specific module
npm test -- tests/unit/lib/api/sessions/

# Watch mode for development
npm run test:watch -- tests/unit/lib/api/
```

---

## Success Criteria for Phase 2

- [ ] 300+ new tests written
- [ ] 4,000+ lines of test code
- [ ] 40% statement coverage achieved
- [ ] All tests passing (824 + 300 = 1,124 passing)
- [ ] <10 second execution time
- [ ] Zero coverage regressions
- [ ] Test patterns documented
- [ ] PR ready for main branch

---

**Estimated Effort:** 40-50 developer hours (2-3 weeks)
**Estimated Team:** 2 developers
**Start Date:** Recommended immediately
**Target Completion:** December 15, 2025
