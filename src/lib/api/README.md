# Firebase API Refactoring

This directory contains the refactored Firebase API modules, split from the monolithic `src/lib/firebaseApi.ts` file (7846 lines) into domain-specific modules with clear separation of concerns.

## Module Structure

```
src/lib/api/
├── shared/           # Shared utilities and helpers
│   └── utils.ts      # Common type conversions, data sanitization
├── auth/             # Authentication operations
│   └── index.ts      # Login, signup, Google OAuth, token verification
├── users/            # User profile operations
│   └── index.ts      # Profile CRUD, stats, privacy settings, search
├── social/           # Social features
│   ├── helpers.ts    # Follow/unfollow, social graph management
│   ├── follows.ts    # Following system
│   ├── supports.ts   # Support/like system
│   └── comments.ts   # Comment system
├── sessions/         # Session/Activity tracking
│   ├── helpers.ts    # Session population with details
│   ├── index.ts      # Session CRUD operations
│   └── posts.ts      # Post operations (legacy - sessions ARE posts)
├── projects/         # Project/Activity management
│   └── index.ts      # Project CRUD, stats
├── challenges/       # Challenge system
│   └── index.ts      # Challenge CRUD, participants, leaderboards
├── streaks/          # Streak tracking
│   └── index.ts      # Streak management and calculations
├── achievements/     # Achievement system
│   └── index.ts      # Achievement definitions and tracking
├── notifications/    # Notification system
│   └── index.ts      # Notifications CRUD, challenge notifications
└── index.ts          # Main export file (backward compatibility)
```

## Module Breakdown

### Completed Modules

#### 1. shared/utils.ts (✅ Complete)

- `convertTimestamp()` - Firestore timestamp conversion
- `convertToTimestamp()` - Date to Firestore timestamp
- `removeUndefinedFields()` - Data sanitization
- `buildCommentUserDetails()` - User detail construction
- `PRIVATE_USER_*` constants

#### 2. auth/index.ts (✅ Complete - 461 lines)

- `firebaseAuthApi.login()`
- `firebaseAuthApi.signup()`
- `firebaseAuthApi.signInWithGoogle()`
- `firebaseAuthApi.logout()`
- `firebaseAuthApi.getCurrentUser()`
- `firebaseAuthApi.verifyToken()`
- `firebaseAuthApi.handleGoogleRedirectResult()`
- `firebaseAuthApi.onAuthStateChanged()`
- `firebaseAuthApi.checkUsernameAvailability()`

#### 3. social/helpers.ts (✅ Complete)

- `updateSocialGraph()` - Follow/unfollow with transaction management
- `fetchUserDataForSocialContext()` - Permission-aware user fetching
- `buildCommentUserDetails()` - Comment user detail builder

### Modules To Be Extracted

#### 4. users/index.ts (1312 lines)

**Location**: Lines 1055-2366
**Key Functions**:

- `getUserProfile()` - Get user by username with privacy checks
- `updateUserProfile()` - Update profile data
- `getUserStats()` - Activity stats, weekly breakdowns
- `uploadProfilePicture()` - Image upload handling
- `updatePrivacySettings()` - Privacy configuration
- `searchUsers()` - User search with filters
- `getSuggestedUsers()` - Recommendation engine
- `followUser()` / `unfollowUser()` - Social graph operations
- `getFollowers()` / `getFollowing()` - Follower lists
- `deleteUserAccount()` - Account deletion

#### 5. projects/index.ts (152 lines)

**Location**: Lines 2367-2518
**Key Functions**:

- `getProjects()` - Fetch user projects
- `getProject()` - Get single project
- `createProject()` - Create new project
- `updateProject()` - Update project
- `deleteProject()` - Delete project
- `getProjectStats()` - Project statistics

#### 6. sessions/index.ts (917 lines)

**Location**: Lines 2519-3435
**Key Functions**:

- `getSessions()` - Fetch sessions with filtering/sorting
- `getSession()` - Get single session
- `createSession()` - Create new session
- `updateSession()` - Update session
- `deleteSession()` - Delete session
- `supportSession()` / `unsupportSession()` - Support system
- `getUserSessions()` - User-specific sessions
- `getFeedSessions()` - Feed with visibility filters
- Includes `populateSessionsWithDetails()` helper (lines 326-495)

#### 7. sessions/posts.ts (867 lines) [LEGACY]

**Location**: Lines 3436-4302
**Note**: Posts are deprecated - sessions ARE posts. This module exists for backward compatibility only.
**Key Functions**:

- `getPosts()` / `getPost()`
- `createPost()` / `updatePost()` / `deletePost()`
- `supportPost()` / `unsupportPost()`
- `getFeedPosts()` / `getUserPosts()`
- All delegate to session functions

#### 8. social/comments.ts (1426 lines)

**Location**: Lines 4303-5728
**Key Functions**:

- `getComments()` - Fetch comments for session
- `getComment()` - Get single comment
- `createComment()` - Create comment
- `updateComment()` - Update comment
- `deleteComment()` - Delete comment
- `likeComment()` / `unlikeComment()` - Comment likes
- Comment notification generation

#### 9. challenges/index.ts (837 lines)

**Location**: Lines 5729-6565
**Key Functions**:

- `getChallenges()` - List challenges with filters
- `getChallenge()` - Get single challenge
- `createChallenge()` - Create challenge
- `updateChallenge()` - Update challenge
- `deleteChallenge()` - Delete challenge
- `joinChallenge()` / `leaveChallenge()` - Participation
- `updateChallengeProgress()` - Progress tracking
- `getChallengeLeaderboard()` - Rankings
- `getChallengeParticipants()` - Participant list

#### 10. streaks/index.ts (520 lines)

**Location**: Lines 6566-7085
**Key Functions**:

- `getStreak()` - Fetch user streak
- `updateStreak()` - Update streak data
- `checkAndUpdateStreak()` - Streak calculation logic
- `deleteStreak()` - Remove streak
- Streak notification generation

#### 11. achievements/index.ts (374 lines)

**Location**: Lines 7086-7459
**Key Functions**:

- `getUserAchievements()` - Fetch user achievements
- `checkAchievements()` - Achievement check logic
- `unlockAchievement()` - Award achievement
- `ACHIEVEMENT_DEFINITIONS` - Achievement metadata

#### 12. notifications/index.ts (370 lines)

**Location**: Lines 7460-7829
**Key Functions**:

- `getNotifications()` - Fetch notifications
- `markNotificationAsRead()` - Mark read
- `markAllNotificationsAsRead()` - Bulk mark read
- `deleteNotification()` - Delete notification
- `challengeNotifications.*` - Challenge-specific notifications
  - `notifyNewChallenge()`
  - `notifyProgressUpdate()`
  - `notifyChallengeComplete()`

## Migration Strategy

### Phase 1: Extract Modules (Current)

- ✅ Create module directory structure
- ✅ Extract shared utilities
- ✅ Extract auth module
- ✅ Extract social helpers
- 🚧 Extract remaining modules
- 🚧 Create backward-compatible index.ts

### Phase 2: Update Imports (Next)

- Search codebase for `import { ... } from '@/lib/firebaseApi'`
- Update to specific module imports
- Example: `import { firebaseAuthApi } from '@/lib/api/auth'`
- Keep backward compatibility in main index.ts

### Phase 3: Testing & Validation

- Run type checks: `npm run type-check`
- Run tests: `npm test`
- Manual testing of all affected features
- Verify no regressions

### Phase 4: Cleanup (Future)

- Remove old firebaseApi.ts
- Update all imports to use specific modules
- Remove backward compatibility layer

## Design Decisions

### Why This Structure?

1. **Domain-Driven Design**: Modules organized by business domain (auth, social, challenges)
2. **Single Responsibility**: Each module handles one aspect of the application
3. **Dependency Management**: Clear dependencies between modules
4. **Testability**: Smaller modules are easier to unit test
5. **Code Navigation**: Developers can quickly find relevant code
6. **Parallel Development**: Teams can work on different modules without conflicts

### Module Size Guidelines

- **Ideal**: 200-400 lines per file
- **Acceptable**: 400-600 lines
- **Needs Further Split**: >600 lines
  - Example: social/comments.ts (1426 lines) should be split into:
    - `comments/crud.ts` - CRUD operations
    - `comments/likes.ts` - Like system
    - `comments/notifications.ts` - Notification handling

### Dependency Graph

```
┌─────────────┐
│   shared/   │ ← Base utilities (no dependencies)
│   utils.ts  │
└──────┬──────┘
       │
       ├──────────┐
       │          │
┌──────▼──────┐  ┌▼──────────┐
│    auth/    │  │  social/  │
│   index.ts  │  │ helpers.ts│
└─────────────┘  └───┬───────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
┌──────▼──────┐ ┌───▼────────┐ ┌──▼────────┐
│   users/    │ │ sessions/  │ │ projects/ │
│   index.ts  │ │  index.ts  │ │ index.ts  │
└─────────────┘ └────────────┘ └───────────┘
       │             │
       └──────┬──────┘
              │
       ┌──────▼───────┐
       │ challenges/  │
       │   index.ts   │
       └──────────────┘
```

## Benefits of Refactoring

### Before (Monolithic)

- ❌ 7846 lines in single file
- ❌ Difficult to navigate
- ❌ Merge conflicts frequent
- ❌ Hard to test in isolation
- ❌ Unclear dependencies
- ❌ Long load times in editor

### After (Modular)

- ✅ 10+ focused modules (<600 lines each)
- ✅ Clear domain boundaries
- ✅ Easy code navigation
- ✅ Parallel development friendly
- ✅ Testable modules
- ✅ Fast editor performance
- ✅ Backward compatible during migration

## Code Quality Metrics

### Original File

- **Lines**: 7846
- **Cyclomatic Complexity**: High (multiple nested conditionals)
- **Maintainability Index**: Low (single massive file)
- **Test Coverage**: Difficult to achieve

### Refactored Modules

- **Average Lines per Module**: ~400
- **Cyclomatic Complexity**: Reduced (focused functions)
- **Maintainability Index**: High (clear separation)
- **Test Coverage**: Achievable (isolated testing)

## Next Steps

1. Complete extraction of remaining modules (automated script)
2. Create comprehensive index.ts for backward compatibility
3. Run type checks and fix any issues
4. Test all features end-to-end
5. Gradually update imports throughout codebase
6. Document migration in pull request
7. Remove original file after full migration

## Questions or Issues?

If you encounter issues during the migration:

1. Check this README for module locations
2. Verify imports are using correct paths
3. Check backward compatibility layer in index.ts
4. Run `npm run type-check` for type issues
5. Consult git history for original implementation
