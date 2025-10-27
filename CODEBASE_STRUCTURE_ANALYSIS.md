# Ambira Web Application - Comprehensive Codebase Analysis

**Last Updated:** 2025-10-25  
**Total Source Lines:** 67,574 (excluding tests)  
**Total Source Files:** 201 (excluding tests)  
**Test Files:** 36  
**Total Components:** 118  
**Exported Types:** 90

---

## 1. OVERALL DIRECTORY STRUCTURE

```
ambira-web/
├── .git/                          # Git repository
├── .next/                         # Next.js build artifacts (generated, tracked but should be .gitignore'd)
├── .cursor/                       # Cursor IDE rules
├── .vscode/                       # VS Code configuration
├── .playwright-mcp/               # Playwright MCP configuration
├── coverage/                      # Jest coverage reports (generated)
├── context/                       # Design and style documentation
├── node_modules/                  # Dependencies (not in scope)
├── public/                        # Static assets (favicons, manifests)
├── src/                           # Source code
├── Configuration Files (root)     # Various config files (detailed below)
└── Documentation Files            # Markdown documentation
```

### Root-Level Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `tsconfig.json` | TypeScript configuration with `@/*` path alias | ✅ Clean |
| `next.config.ts` | Next.js configuration with Sentry integration | ✅ Configured |
| `jest.config.js` | Jest testing configuration (80% coverage threshold) | ✅ Configured |
| `jest.setup.js` | Jest setup file | ✅ Present |
| `eslint.config.mjs` | ESLint configuration (FlatCompat format) | ✅ Configured |
| `.prettierrc` | Prettier code formatting rules | ✅ Configured |
| `.prettierignore` | Prettier ignore patterns | ✅ Configured |
| `firebase.json` | Firebase CLI configuration | ✅ Present |
| `firestore.rules` | Firestore security rules | ✅ Present (Recently modified) |
| `firestore.indexes.json` | Firestore composite indexes | ✅ Defined |
| `package.json` | Dependencies and scripts | ⚠️ Modified (unstaged) |
| `package-lock.json` | Lock file | ⚠️ Modified (unstaged) |
| `yarn.lock` | Yarn lock file (duplicate of package-lock?) | ⚠️ Modified (unstaged) |

### Build Artifacts & Generated Files

**These should be in `.gitignore` but are being tracked:**
- `.next/` - Next.js build output
- `coverage/` - Jest coverage reports
- `tsconfig.tsbuildinfo` - TypeScript build info
- `.vercel-rebuild` - Vercel rebuild marker
- `next-env.d.ts` - Auto-generated TypeScript definitions

---

## 2. SOURCE DIRECTORY STRUCTURE (`/src`)

### 2.1 App Router Pages (`/src/app`)

**Total Routes:** 39 main routes + dynamic segments  
**Architecture:** Next.js 15 App Router with clean separation

#### Route Organization

```
src/app/
├── layout.tsx                    # Root layout (all providers)
├── page.tsx                      # Home/Feed (clean routing only)
├── globals.css                   # Global Tailwind CSS
├── global-error.tsx              # Global error handler
├── loading.tsx                   # Root loading spinner
├── not-found.tsx                 # 404 handler
│
├── auth-related/
│   ├── login/
│   ├── signup/
│   ├── auth/                     # OAuth callback
│   └── profile/[username]/       # User profiles
│
├── activity-tracking/
│   ├── activities/               # Activity/Project list
│   ├── activities/[id]/          # Activity detail
│   ├── activities/[id]/edit/     # Activity editor
│   ├── activities/new/           # Create activity
│   ├── timer/                    # Active session timer (primary recording)
│   ├── record-session/           # (Legacy/Placeholder)
│   ├── record-manual/            # Manual session entry
│   ├── sessions/[id]/            # Session detail
│   ├── sessions/[id]/edit/       # Session editor
│   └── sessions/[id]/share/      # Session share/export
│
├── social-features/
│   ├── profile/                  # Authenticated user profile
│   ├── profile/[username]/       # Public user profiles (with [id] redirect)
│   ├── you/                      # Dashboard/Your profile
│   ├── search/                   # User/session search
│   ├── discover/people/          # User discovery
│   ├── notifications/            # Notification center
│   └── post/[id]/                # Session detail (legacy name)
│
├── groups-&-challenges/
│   ├── groups/                   # Groups list
│   ├── groups/new/               # Create group
│   ├── groups/[id]/              # Group detail
│   ├── groups/[id]/settings/     # Group settings (admin)
│   ├── invite/group/[groupId]/   # Group invite landing
│   ├── challenges/               # Challenges list
│   └── challenges/[id]/          # Challenge detail
│
├── settings-&-info/
│   ├── settings/                 # Settings hub (navigation)
│   ├── settings/privacy/         # Privacy controls
│   ├── settings/profile/         # (May be unused)
│   ├── settings/data/            # (May be unused)
│   ├── settings/display/         # (May be unused)
│   ├── settings/notifications/   # (May be unused)
│   ├── analytics/                # Analytics dashboard
│   ├── about/                    # About page
│   ├── features/                 # Features page
│   ├── help/                     # Help/FAQ
│   ├── contact/                  # Contact form
│   ├── privacy/                  # Privacy policy
│   ├── cookies/                  # Cookie policy
│   ├── terms/                    # Terms of service
│   └── feed/                     # (Legacy: redirects to /)
│
├── admin/
│   └── migrate-users/            # Admin migration tool
│
├── api/
│   └── sentry-example-api/       # Sentry test endpoint
│
└── Testing Support/
    └── activities/__tests__/     # Route-level tests
```

#### Route Analysis

**Primary Routes (Heavily Used):**
- `/` - Home/Feed (landing page + authenticated feed)
- `/timer` - Session recording interface
- `/profile/[username]` - User profiles
- `/groups/[id]` - Group management
- `/challenges/[id]` - Challenge detail
- `/settings` - Settings navigation hub

**Secondary Routes (Moderate Use):**
- `/activities/[id]` - Project/Activity detail
- `/sessions/[id]` - Session detail (post detail)
- `/analytics` - User analytics dashboard
- `/discover/people` - User discovery

**Tertiary Routes (Lower Priority):**
- `/record-manual/` - Manual entry form (alternative to timer)
- `/search/` - Global search
- `/notifications/` - Notification panel
- `/you/` - Dashboard variant of authenticated profile

**Potential Unused/Legacy Routes:**
- `/post/[id]/` - Appears to be duplicate of `/sessions/[id]/`
- `/feed/` - Redirects to `/` (confirmed in `next.config.ts`)
- `/record-session/` - Placeholder, not fully implemented
- `/settings/profile`, `/settings/data`, `/settings/display`, `/settings/notifications` - May be superseded by `/settings` hub
- `/admin/migrate-users/` - Admin-only, for data migration

---

## 3. COMPONENT ARCHITECTURE

### 3.1 Component Organization

**Total Components:** 118 in `/src/components/`  
**UI Components:** 9 primitive components in `/src/components/ui/`  
**Feature Components:** ~109 business logic components

### 3.2 Largest/Most Complex Components

| Component | Lines | Complexity | Notes |
|-----------|-------|-----------|-------|
| `SessionTimerEnhanced.tsx` | 880 | High | Primary timer UI with image upload, project selection |
| `ManualSessionRecorder.tsx` | 578 | High | Alternative session recording interface |
| `ProfileStats.tsx` | 682 | High | User analytics visualization (charts, stats) |
| `LandingPage.tsx` | 1103 | High | Landing page content for unauthenticated users |
| `SessionCard.tsx` | ~500 | High | Session/activity feed card with interactions |
| `PersonalAnalyticsDashboard.tsx` | ~400 | Medium | User-specific analytics |
| `ChallengeLeaderboard.tsx` | ~400 | Medium | Challenge rankings display |

### 3.3 Post/Session Component Duplication Pattern

**Found:** Both `Post` and `Session` naming conventions exist

```
Post-related components:
├── Post.tsx                      # Wrapper for PostCard
├── PostCard.tsx                  # Main post display
├── PostCreationModal.tsx         # Create post dialog
├── PostInteractions.tsx          # Support/comment buttons
├── PostStats.tsx                 # View counts, stats
└── FeedPost.tsx                  # Feed-specific variant

Session-related components:
├── SessionCard.tsx               # Main session display (PREFERRED)
├── SessionHistory.tsx            # Historical sessions list
├── SessionInteractions.tsx        # Support/comment buttons
├── SessionStats.tsx              # Stat displays
├── SessionTimer.tsx              # Legacy timer (replaced by SessionTimerEnhanced)
├── SessionTimerEnhanced.tsx      # Modern timer (PREFERRED)
└── EditSessionModal.tsx          # Edit session
```

**Status:** According to CLAUDE.md, **Sessions ARE the posts** (Strava-like model). Post components are wrappers around Session components for backwards compatibility. This duplication is intentional but could be simplified.

### 3.4 Activity/Project Component Duplication

```
Activity-related (NEW naming):
├── ActivityCard.tsx              # Activity list item
├── ActivityChart.tsx             # Activity statistics
├── ActivityList.tsx              # Activity list container

Project-related (OLD naming, deprecated):
├── ProjectCard.tsx               # Project list item
├── ProjectList.tsx               # Project list container
└── ProjectAnalytics.tsx          # Project stats
```

**Status:** Types use `Activity` as primary, `Project` as backwards-compatible alias (see types/index.ts). Components use both names - potential refactoring opportunity.

### 3.5 UI Component Library (`/src/components/ui/`)

**Framework:** shadcn/ui + Radix UI + Tailwind CSS v4

**Primitives Provided:**
- `button.tsx` - Button component
- `card.tsx` - Card container
- `input.tsx` - Text input
- `label.tsx` - Form label
- `select.tsx` - Dropdown select
- `switch.tsx` - Toggle switch (with tests)
- `textarea.tsx` - Text area
- `badge.tsx` - Badge/tag component
- `settings-section.tsx` - Custom settings layout

**Usage:** Extensively used throughout components for consistent styling

### 3.6 High-Level Component Categories

**Feed/Social:**
- Feed, FeedCarousel, FeedFilterDropdown, FeedLayout, FeedPost
- SessionCard, PostCard, Post, SessionInteractions, PostInteractions
- CommentsModal, CommentList, CommentItem, CommentInput, TopComments
- LikesModal, CommentLikes

**User/Profile:**
- ProfileHeader, ProfileStats, ProfilePicture, ProfileTabs
- UnifiedProfileCard, UserCard, SearchUsers, SuggestedUsers
- SuggestedPeopleModal, SuggestedGroupsModal

**Groups:**
- GroupCard, GroupHeader, GroupListItem, GroupAvatar
- GroupTabs, GroupAnalytics, GroupChallenges, GroupInviteModal
- GroupSettings, GroupInviteLanding, BrowseGroups

**Challenges:**
- ChallengeCard, ChallengeDetail, ChallengeLeaderboard
- ChallengeProgress, CreateChallengeModal

**Activities/Sessions:**
- ActivityCard, ActivityChart, ActivityList
- SessionCard, SessionHistory, SessionTimer, SessionTimerEnhanced
- SessionStats, EditSessionModal, SaveSession
- ManualSessionRecorder, ManualEntry

**Layouts & Navigation:**
- Header (HeaderComponent), Layout, SimpleLayout, FeedLayout
- LeftSidebar, RightSidebar, Sidebar, BottomNavigation
- MobileHeader, FABMenu, ActiveTimerBar
- ProtectedRoute, ErrorBoundary

**Modals & Overlays:**
- CommentsModal, LikesModal, CreateGroupModal, CreateChallengeModal
- CreateProjectModal, EditProfileModal, EditSessionModal
- PostCreationModal, ConfirmDialog

**Forms & Inputs:**
- LoginForm, SignupForm, ColorSelector, IconSelector, ImageUpload
- NotificationSettings, PrivacySettings, DataExport, DailyGoals

**Visualizations & Charts:**
- ActivityChart, HeatmapCalendar, StreakCalendar, WeekStreakCalendar
- ProgressRing, SidebarActivityGraph, AnalyticsWidget
- PersonalAnalyticsDashboard, ProjectAnalyticsDashboard
- ComparativeAnalytics, DayOverview

**Utilities:**
- PrefetchLink, IconRenderer, ImageGallery, ImageLightbox
- ShareSessionImage, PWAInstaller, PWAInstallPrompt
- ErrorBoundary, AuthDebugger, NotificationIcon, NotificationsPanel
- StreakNotification, AchievementUnlock, AchievementCard, TrophyCase

---

## 4. STATE MANAGEMENT & CONTEXTS

### 4.1 React Context Providers

**Location:** `/src/contexts/`  
**Total:** 6 contexts + 1 provider file

| Context | Purpose | Status |
|---------|---------|--------|
| `AuthContext.tsx` | User authentication, login/logout | ✅ Core |
| `ProjectsContext.tsx` | Project/Activity CRUD operations | ✅ Core |
| `TimerContext.tsx` | Active session timer state, persistence | ✅ Core |
| `NotificationsContext.tsx` | Notifications management | ✅ Core |
| `ToastContext.tsx` | Toast/notification UI system | ✅ Supporting |
| `ActivitiesContext.tsx` | Activities/Projects state | ⚠️ May duplicate ProjectsContext |

### 4.2 Provider Setup

**Location:** `src/app/layout.tsx`

**Provider Hierarchy (from layout):**
```
- AuthProvider
  - ProjectsProvider
    - TimerProvider
      - NotificationsProvider
        - QueryProvider (TanStack React Query)
          - ToastProvider
            - Content
```

**Status:** Deep nesting might impact performance - could benefit from provider consolidation.

### 4.3 Test Coverage

**Tested Contexts:**
- `TimerContext.test.tsx` - Timer state and operations

**Missing Test Coverage:**
- AuthContext
- ProjectsContext
- NotificationsContext
- ToastContext
- ActivitiesContext

---

## 5. HOOKS & CUSTOM HOOKS

### 5.1 Hook Organization

**Location:** `/src/hooks/`

| Hook | Purpose | Lines | Status |
|------|---------|-------|--------|
| `useCache.ts` | Data caching with TTL | 11K | ✅ Comprehensive |
| `useMutations.ts` | API mutation handling | 13K | ✅ Comprehensive |
| `useCommentLikeMutation.test.tsx` | Comment likes testing | | ⚠️ Test file in hooks dir |

**Feature-Specific Hooks (in `/src/features/`):**
- `useFeed.ts`, `useFeedMutations.ts` - Feed operations
- `useProfile.ts`, `useProfileMutations.ts` - Profile operations
- `useGroups.ts`, `useGroupDetails.ts`, `useGroupMutations.ts` - Groups
- `useTimer.ts`, `useTimerMutations.ts` - Timer
- Custom `useCallback`/`useMemo` in components for optimization

---

## 6. LIBRARY & UTILITIES

### 6.1 Firebase API Layer (DUAL STRUCTURE)

**Status:** REFACTORING IN PROGRESS - Two API structures coexist!

#### Legacy Monolithic API
**File:** `/src/lib/firebaseApi.ts` (7,763 lines)

**Structure:**
```
firebaseAuthApi
├── login()
├── signup()
├── signInWithGoogle()
├── logout()
└── ... (auth operations)

firebaseUserApi
├── getUserProfile()
├── updateUserProfile()
├── getUserStats()
├── searchUsers()
└── ... (user operations)

firebaseSessionApi
├── createSession()
├── getSession()
├── updateSession()
├── deleteSession()
└── ... (session operations)

firebaseCommentApi
├── getComments()
├── createComment()
├── deleteComment()
└── ... (comment operations)

firebaseChallengeApi
├── getChallenges()
├── createChallenge()
├── joinChallenge()
└── ... (challenge operations)

firebaseStreakApi
├── getStreak()
├── updateStreak()
└── ... (streak operations)

firebaseAchievementApi
├── getUserAchievements()
├── checkAchievements()
└── ... (achievement operations)

firebaseNotificationApi
├── getNotifications()
├── markAsRead()
└── ... (notification operations)
```

**Issues:**
- 7,763 lines (very large file)
- Difficult to navigate
- Merge conflicts frequent
- Hard to test in isolation
- All imports depend on this one file

#### New Modular API (In Progress)
**Location:** `/src/lib/api/`

**Target Structure:**
```
src/lib/api/
├── auth/index.ts              # ✅ DONE (Auth operations)
├── users/index.ts             # 🚧 TODO (User operations)
├── sessions/index.ts          # 🚧 TODO (Session operations)
├── social/
│   ├── helpers.ts             # ✅ DONE (Social graph)
│   ├── comments.ts            # 🚧 TODO (Comments)
│   └── supports.ts            # 🚧 TODO (Supports/likes)
├── projects/index.ts          # 🚧 TODO (Projects/Activities)
├── challenges/index.ts        # 🚧 TODO (Challenges)
├── streaks/index.ts           # 🚧 TODO (Streaks)
├── achievements/index.ts      # 🚧 TODO (Achievements)
├── notifications/index.ts     # 🚧 TODO (Notifications)
├── shared/utils.ts            # ✅ DONE (Common utilities)
└── index.ts                   # ✅ DONE (Backward compatibility)
```

**Migration Status:**
- ✅ Phase 1 Foundation Complete (auth, shared, index.ts)
- 🚧 Phase 2 In Progress (extract remaining modules)
- ⏳ Phase 3 Pending (update all imports)
- ⏳ Phase 4 Pending (remove old file)

**What's Currently Used:**
- Both APIs coexist - components import from either
- `firebaseApi` from `firebaseApi.ts` is still primary
- New modules available but adoption incomplete

### 6.2 Other Library Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `api.ts` | Older API layer (being replaced) | 409 | ⚠️ Legacy |
| `cache.ts` | Data caching with TTL | 11K | ✅ Active |
| `firestoreCache.ts` | Firestore-specific cache | 9.2K | ✅ Active |
| `errorHandler.ts` | Centralized error handling | 8.9K | ✅ Active |
| `imageUpload.ts` | Firebase Storage image upload | 9.4K | ✅ Active |
| `rateLimit.ts` | Rate limiting utility | 7.3K | ✅ Active |
| `firebase.ts` | Firebase initialization | 1.1K | ✅ Minimal |
| `queryClient.ts` | TanStack React Query setup | 3.3K | ✅ Configured |
| `projectStats.ts` | Project statistics calculations | 5.5K | ✅ Utilities |
| `utils.ts` | General utilities | 888B | ✅ Minimal |
| `useSessionCompletion.ts` | Session completion hook | 1.9K | ✅ Utility |
| `challengeScheduler.ts` | Challenge scheduling logic | 2.5K | ✅ Utility |

### 6.3 Onboarding Module

**Location:** `/src/lib/onboarding/`
- `sampleProjects.ts` - Default activities for new users

---

## 7. TYPE DEFINITIONS

### 7.1 Central Type File

**File:** `/src/types/index.ts` (1,000 lines, 90 exported types)

**Type Categories:**

```typescript
// User & Auth
User, AuthUser, AuthResponse, LoginCredentials, SignupCredentials

// Activity/Project (Activity is primary, Project is alias)
Activity, Project (alias), ActivityStats, ProjectStats (alias)
ActivityData, WeeklyActivity, ProjectBreakdown

// Sessions (primary content type, replaces posts)
Session, SessionWithDetails, CreateSessionData, SessionFilters
SessionSort, SessionListResponse, SessionStats

// Posts (legacy, sessions ARE posts)
Post, PostWithDetails, CreatePostData, UpdatePostData

// Social Features
Follow, Follower, Following, PostSupport
Comment, CommentWithDetails, CommentLike
FeedResponse, FeedFilters

// Groups & Challenges
Group, CreateGroupData, GroupMembership, GroupStats
Challenge, CreateChallengeData, ChallengeParticipant
ChallengeProgress, ChallengeLeaderboard

// Notifications
Notification

// UI/Form Data Types
(Various data/form types for components)
```

**Status:** ✅ Well-organized, comprehensive type coverage

---

## 8. TESTING STRUCTURE

### 8.1 Test Files Count

**Total Test Files:** 36  
**Coverage Threshold:** 80% (branches, functions, lines, statements)  
**Jest Configuration:** `jest.config.js` with jsdom environment

### 8.2 Test Organization

**By Directory:**
```
src/__tests__/
├── auth/
│   └── google-signin.test.ts
├── integration/
│   ├── firebase-feed-images.test.tsx
│   ├── firebase-image-storage.test.ts
│   ├── image-upload-flow-simple.test.ts
│   ├── image-upload-flow.test.tsx
│   └── session-images-firestore.test.ts
├── setup/
│   └── firebaseMock.ts
├── challenges-manual.test.ts
└── notifications-manual.test.ts

src/components/__tests__/
├── accessibility-focus-states.test.tsx
├── accessibility-icon-buttons.test.tsx
├── accessibility-keyboard-navigation.test.tsx
├── ActivityCard.test.tsx
├── ActivityList.test.tsx
├── analytics-accessibility.test.tsx
├── CommentLikes.test.tsx
├── ImageGallery.test.tsx
├── LoginForm-simple.test.tsx
├── LoginForm.test.tsx
├── PostStats.test.tsx
├── ProtectedRoute.test.tsx
├── SessionCard-images.test.tsx
├── SessionTimerEnhanced-*.test.tsx (3 files)
└── SignupForm*.test.tsx (2 files)

src/lib/__tests__/
├── api-simple.test.ts
├── errorHandler.test.ts
├── imageUpload.test.ts
└── rateLimit.test.ts

src/contexts/__tests__/
└── TimerContext.test.tsx

src/hooks/__tests__/
└── useCommentLikeMutation.test.tsx

src/features/groups/domain/__tests__/
└── LeaderboardCalculator.test.ts
```

### 8.3 Test Coverage Gaps

**Well-Tested Areas:**
- Components: LoginForm, SignupForm, SessionTimerEnhanced, SessionCard, ActivityCard
- Features: Image upload, accessibility, Firebase integration
- Hooks: useCommentLikeMutation
- Domains: LeaderboardCalculator

**Missing Test Coverage:**
- Most utility functions in `/src/lib/`
- All context providers except TimerContext
- Most feature hooks (useProfile, useGroups, useFeed, useTimer, etc.)
- Component interactions and state management
- API functions (firebaseApi) - no unit tests
- Error scenarios and edge cases
- Integration tests for major features

**Coverage Reality:**
- 80% threshold set in jest.config.js
- Many components have no tests
- Integration tests exist but are limited
- Manual testing mentioned in CLAUDE.md

---

## 9. FEATURES ARCHITECTURE

### 9.1 Feature Modules Organization

**Location:** `/src/features/` (new architecture pattern)

```
src/features/
├── feed/
│   ├── components/
│   │   ├── FeedPageContent.tsx    # Main feed component
│   │   └── LandingPageContent.tsx # Landing page
│   ├── hooks/
│   │   ├── useFeed.ts             # Feed data queries
│   │   └── useFeedMutations.ts    # Feed mutations
│   ├── services/
│   │   └── FeedService.ts         # Business logic
│   └── hooks/index.ts             # Exports
│
├── groups/
│   ├── components/
│   │   └── GroupDetailPage.tsx
│   ├── domain/
│   │   ├── LeaderboardCalculator.ts
│   │   └── LeaderboardCalculator.test.ts
│   ├── hooks/
│   │   ├── useGroups.ts
│   │   ├── useGroupDetails.ts
│   │   └── useGroupMutations.ts
│   ├── services/
│   │   └── GroupService.ts
│   ├── types/
│   │   └── groups.types.ts
│   └── hooks/index.ts
│
├── profile/
│   ├── components/
│   │   └── OwnProfilePageContent.tsx (1069 lines)
│   ├── domain/
│   │   └── ProfileStatsCalculator.ts
│   ├── hooks/
│   │   ├── useProfile.ts
│   │   └── useProfileMutations.ts
│   ├── services/
│   │   └── ProfileService.ts
│   └── hooks/index.ts
│
├── settings/
│   ├── components/
│   │   └── SettingsPageContent.tsx (732 lines)
│   └── components/
│
├── timer/
│   ├── hooks/
│   │   ├── useTimer.ts
│   │   └── useTimerMutations.ts
│   ├── services/
│   │   └── TimerService.ts
│   └── hooks/index.ts
└── hooks/
    └── index.ts
```

**Status:** Clean, modular architecture emerging with domain-driven design

**Largest Features:**
- `feed/` - Feed system (dominant feature)
- `profile/` - User profile (1069 lines in main component)
- `settings/` - Settings system (732 lines)

---

## 10. CONFIGURATION FILES ANALYSIS

### 10.1 Next.js Configuration

**File:** `next.config.ts`

```typescript
- Redirect /feed to / (permanent)
- ESLint: Disabled during builds (runs via npm run lint)
- TypeScript: Errors disabled during builds
- Image Optimization:
  - Remote patterns: Firebase Storage + Google profiles
  - Supported formats: WebP only
  - Cache TTL: 60 seconds minimum
```

**Concerns:**
- ESLint and TypeScript errors ignored during build
- Could hide problems in production builds
- But: CLAUDE.md recommends this pattern for development workflow

### 10.2 Prettier Configuration

**File:** `.prettierrc`
- Standard formatting rules
- Minimal configuration (defers to defaults)

### 10.3 Tailwind CSS v4

**Used throughout** for styling  
**CSS Variables support** for theming  
**Colors:** Electric blue (#007AFF), brand orange (#FC4C02), success green (#34C759)

### 10.4 Firebase Configuration

**Files:** `firebase.json`, `firestore.rules`, `firestore.indexes.json`

**Firestore Rules:** Recently modified (Oct 22, 23:34)
**Firestore Indexes:** Defined for complex queries

### 10.5 Environment Variables

**Required in `.env.local`:**
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)

**Status:** Not in version control (correctly)

---

## 11. DOCUMENTATION

### 11.1 Root Documentation Files

| File | Purpose | Size | Status |
|------|---------|------|--------|
| `README.md` | Project overview | 9.8K | ✅ Current |
| `CLAUDE.md` | AI assistant instructions | 9.6K | ✅ Current (Project guidelines) |
| `DATA_ARCHITECTURE.md` | Data model documentation | 13K | ⚠️ May be outdated |
| `coding-guidelines.md` | Development guidelines | 1.3K | ✅ Brief |
| `prompts.md` | AI prompts for development | 6.1K | ✅ Development aid |
| `team-resources.md` | Team links (minimal) | 582B | ✅ Minimal |

### 11.2 Design & Style Documentation

**Location:** `context/`

- `design-principles.md` - Design guidelines
- `design_principles.md` - (Duplicate of above, different spelling)
- `style-guide.md` - Visual style guide

**Status:** ⚠️ Duplicate file with different naming convention

### 11.3 API Documentation

**Location:** `src/lib/api/`

- `README.md` - API refactoring overview (11K)
- `MIGRATION_GUIDE.md` - Step-by-step migration instructions (10K)
- `QUICK_START.md` - Quick reference (4K)

**Purpose:** Document the ongoing refactoring from monolithic `firebaseApi.ts` to modular structure

### 11.4 Test/Performance Documentation

- `ACTIVITIES_PAGE_VISUAL_VALIDATION_REPORT.md` - 36K
- `ANALYTICS_ACCESSIBILITY_REPORT.md` - 11K
- `ANALYTICS_ARIA_LABELS_SUMMARY.md` - 3.8K
- `ANALYTICS_FOCUS_INDICATORS_FINAL_REPORT.md` - 15K
- `CORE_WEB_VITALS_TEST_REPORT.md` - 18K
- `CONTRAST_RATIO_VERIFICATION.md` - 6.7K
- `FOCUS_INDICATORS_IMPLEMENTATION_REPORT.md` - 10K
- `FOCUS_INDICATORS_SUMMARY.md` - Summary
- `MANUAL_PERFORMANCE_TESTING_GUIDE.md` - 10K
- `PERFORMANCE_AUDIT_REPORT.md`
- `PERFORMANCE_OPTIMIZATION_SUMMARY.md`

**Status:** ⚠️ Many accessibility/performance reports suggest recent work in this area, but these files are quite large and scattered

### 11.5 Other Documentation

- `MOBILE_OAUTH_FIX.md` - Mobile OAuth workaround
- `accDeletion.md` - Account deletion process
- `build-output.log` - Build log artifact

---

## 12. GIT & BUILD ARTIFACTS

### 12.1 Tracked Files That Should Be Ignored

**Build Artifacts:**
- `.next/` - Next.js build directory (120KB)
- `.swc/` - SWC compiler cache
- `.vercel-rebuild` - Vercel marker file

**Test Artifacts:**
- `coverage/` - Jest coverage reports

**Auto-Generated:**
- `tsconfig.tsbuildinfo` - TypeScript build info
- `next-env.d.ts` - Auto-generated types

**Staging Area Changes (Modified):**
```
M firestore.rules       # Security rules
M package-lock.json     # Dependencies lock
M package.json          # Package config
M src/app/groups/[id]/page.tsx
M src/app/profile/[username]/page.tsx
M src/app/profile/page.tsx
M src/lib/firebaseApi.ts
M yarn.lock
```

**Recommendation:** Add `.next/`, `coverage/`, `.swc/` to `.gitignore`

---

## 13. LEGACY & DEPRECATED PATTERNS

### 13.1 Post vs. Session Naming

**Status:** Both exist; Sessions are primary (Strava-like model)

**Impact:**
- `Post.tsx` wraps `PostCard.tsx` (thin wrapper)
- Components use both `SessionWithDetails` and `PostWithDetails`
- Firestore uses `sessions` collection (posts delegated to sessions)
- All new code should use `Session` naming

**Action:** Remove Post components once migration complete (backwards compat maintained)

### 13.2 Project vs. Activity Naming

**Status:** Activity is primary; Project is alias in types

**Impact:**
- Components use both names: `ActivityCard` vs `ProjectCard`
- Type system uses: `Activity` (primary) with `type Project = Activity`
- Routes use `/activities/` but components may reference "projects"

**Action:** Standardize on Activity in all components

### 13.3 Legacy Settings Routes

**Routes Found:**
- `/settings/profile/` - Probably unused
- `/settings/data/` - Probably unused
- `/settings/display/` - Probably unused
- `/settings/notifications/` - Probably unused

**Status:** May be superseded by unified `/settings` hub  
**Action:** Verify usage and consolidate

### 13.4 Placeholder/Incomplete Routes

**Route:** `/record-session/` - Appears to be a placeholder  
**Status:** `/timer/` is primary session recording interface  
**Action:** Verify and remove if unused

### 13.5 Legacy API References

**In Code:**
- `firebaseApi.session.createSessionWithPost()` - Methods referencing both names
- Both `firebaseUserApi` and `firebaseAuthApi` exist separately

**Status:** Intentional backwards compatibility during refactoring

---

## 14. REFACTORING OPPORTUNITIES

### 14.1 High Priority Refactoring

1. **Monolithic firebaseApi.ts (7,763 lines)**
   - Current State: Being refactored into `/src/lib/api/` modules
   - Action: Complete the migration (Phase 2 in progress)
   - Impact: Reduce file size by 80%, improve maintainability
   - Effort: Medium (extraction + testing + import updates)

2. **Post/Session Duplication**
   - Current State: Both naming conventions active
   - Action: Remove Post components, use Session only
   - Impact: Simplify codebase, reduce confusion
   - Effort: Medium (safe, backwards compatible)

3. **Project/Activity Naming Inconsistency**
   - Current State: Both names used in components
   - Action: Standardize on Activity everywhere
   - Impact: Clearer intent, fewer naming conflicts
   - Effort: Low-Medium (mostly find-and-replace)

### 14.2 Medium Priority Refactoring

4. **Settings Route Consolidation**
   - Current State: `/settings` hub + multiple unused sub-routes
   - Action: Verify routes actually used, delete unused ones
   - Impact: Cleaner routing, fewer dead code paths
   - Effort: Low (verification + deletion)

5. **Test Coverage Expansion**
   - Current State: 36 test files, but gaps in coverage
   - Missing: Context tests, hook tests, utility tests
   - Action: Add unit tests for most-used modules
   - Impact: Better reliability, easier refactoring
   - Effort: High (extensive test writing)

6. **Provider Consolidation**
   - Current State: Deep nesting of 6+ providers
   - Action: Consider combining related providers
   - Impact: Cleaner code, potentially better performance
   - Effort: Medium (careful refactoring needed)

### 14.3 Low Priority / Technical Debt

7. **Git Cleanup**
   - Action: Add build artifacts to `.gitignore`
   - Remove tracked `.next/`, `coverage/`, etc.
   - Impact: Cleaner repository history
   - Effort: Low

8. **Documentation Consolidation**
   - Action: Merge duplicate design-principles files
   - Consolidate scattered test reports
   - Impact: Better documentation organization
   - Effort: Low

9. **Type Splitting**
   - Current State: 90 types in one 1000-line file
   - Action: Consider domain-specific type files if types grow
   - Impact: Better organization at scale
   - Effort: Low-Medium (deferred unless needed)

10. **Large Component Splitting**
    - Components >800 lines: SessionTimerEnhanced, LandingPage, ManualSessionRecorder
    - Action: Extract sub-components if they grow further
    - Impact: Easier testing, reusability
    - Effort: Medium-High (only if complexity increases)

---

## 15. BUILD & DEPENDENCY ANALYSIS

### 15.1 Key Dependencies

**Core Framework:**
- `next@15.5.4` - Full-stack React framework
- `react@19.1.0`, `react-dom@19.1.0` - React library
- `typescript@^5` - TypeScript compiler

**Firebase:**
- `firebase@^12.3.0` - Firebase SDK
- `firebase-admin@^13.5.0` - Server-side admin SDK
- `firebase-tools@^14.21.0` - Firebase CLI

**UI & Styling:**
- `tailwindcss@^4` - CSS framework
- `lucide-react@^0.544.0` - Icon library
- `recharts@^3.2.1` - Charting library
- `class-variance-authority@^0.7.1` - CSS-in-JS utilities
- `clsx@^2.1.1` - Class name merging

**State & Data:**
- `@tanstack/react-query@^5.90.2` - Server state management
- `date-fns@^4.1.0` - Date utilities

**Notifications & Toasts:**
- `react-hot-toast@^2.6.0` - Toast notifications
- `sonner@^2.0.7` - Alternative toast system

**Other:**
- `@sentry/nextjs@^10.19.0` - Error tracking
- `@vercel/analytics@^1.5.0` - Analytics
- `@vercel/speed-insights@^1.2.0` - Performance monitoring
- `axios@^1.12.2` - HTTP client
- `html-to-image@^1.11.13` - Canvas rendering
- `qrcode.react@^4.2.0` - QR code generation

### 15.2 Development Dependencies

**Testing:**
- `jest@^30.2.0` - Test runner
- `@testing-library/react@^16.3.0` - React testing
- `@testing-library/jest-dom@^6.9.1` - Custom matchers
- `jest-environment-jsdom@^30.2.0` - DOM environment

**Code Quality:**
- `eslint@^9` - Linter
- `prettier@^3.6.2` - Code formatter
- `@typescript-eslint/eslint-plugin@^8.45.0` - TS linting

**Build Tools:**
- `tailwindcss@^4` - CSS compilation
- `sharp@^0.34.4` - Image processing

**E2E & Performance:**
- `playwright@^1.56.1` - Browser testing
- `lighthouse@^12.8.2` - Performance auditing
- `puppeteer@^24.26.0` - Browser automation

---

## 16. PERFORMANCE METRICS

### 16.1 Codebase Size

| Metric | Value | Assessment |
|--------|-------|-----------|
| Total Source Lines | 67,574 | Moderate size for a full-stack app |
| Largest File | 7,763 (firebaseApi.ts) | ❌ Too large (refactoring in progress) |
| Largest Component | 1,103 (LandingPage.tsx) | ⚠️ Large but acceptable |
| Component Count | 118 | Good granularity |
| Test Files | 36 | Moderate coverage |
| Type Definitions | 90 | Well-defined types |

### 16.2 Build Configuration

**Next.js Optimization:**
- ESLint: Disabled during builds (checked separately)
- TypeScript: Errors disabled during builds (but type-check runs)
- Image formats: WebP only
- Image cache: 60+ seconds minimum

**Concerns:**
- Disabling checks during build could hide issues
- Consider enabling for production

---

## 17. SUMMARY OF FINDINGS

### Key Strengths

✅ **Well-Organized Structure**
- Clear separation of concerns (components, lib, contexts, types)
- Feature-based organization emerging in `/src/features/`
- Modular library architecture (in progress)

✅ **Comprehensive Type System**
- 90+ well-defined types
- TypeScript strict mode enabled
- Good backwards compatibility aliases (Project = Activity)

✅ **Modern Tech Stack**
- Next.js 15 with App Router
- React 19
- TanStack React Query for state
- Tailwind CSS v4
- Firebase Firestore + Auth + Storage

✅ **Social Features Implemented**
- Following/followers system
- Groups & challenges
- Comments and likes
- Feed with visibility controls
- User profiles and discovery

✅ **Design System**
- UI component library (shadcn/ui based)
- Consistent styling with Tailwind
- Accessibility considerations evident

### Key Weaknesses

❌ **Monolithic firebaseApi.ts**
- 7,763 lines in single file
- Refactoring in progress but incomplete
- Both old and new API structures coexist

❌ **Post/Session Duplication**
- Both naming conventions active
- Unnecessary wrapper components
- Should consolidate once migration complete

⚠️ **Test Coverage Gaps**
- 36 test files but significant gaps
- Missing: Context tests, utility tests, integration tests
- 80% threshold set but not achieved

⚠️ **Legacy Routes & Components**
- Unused/placeholder routes (/record-session, /settings/*)
- Old API (api.ts) still exists
- Post vs Session component duplication

⚠️ **Documentation Scattered**
- Large test/performance reports not well organized
- Duplicate design-principles files
- Could be consolidated better

⚠️ **Build Configuration**
- ESLint/TypeScript errors ignored during builds
- Could hide problems in production
- Though this is intentional per development workflow

### Medium Concerns

⚠️ **Provider Nesting**
- 6+ providers in hierarchy
- Could impact performance
- Consolidation might help

⚠️ **Large Components**
- SessionTimerEnhanced (880 lines)
- LandingPage (1103 lines)
- ManualSessionRecorder (578 lines)
- Could be split further if complexity grows

⚠️ **Duplicate Naming**
- Activity vs Project
- Post vs Session
- Confusing for new developers

⚠️ **Git Hygiene**
- Build artifacts tracked (.next, coverage, etc.)
- Should be in .gitignore
- Clean up in next commit

---

## 18. RECOMMENDED ACTIONS (PRIORITY ORDER)

### Immediate (This Week)

1. Add `.next/`, `coverage/`, `.swc/` to `.gitignore`
2. Consolidate duplicate `design-principles.md` files
3. Document current API usage (which imports use old vs new)

### Short Term (This Month)

1. Complete Phase 2 of firebaseApi.ts refactoring (extract remaining modules)
2. Update components to use new `/lib/api/` modules
3. Remove unused routes (/record-session, old /settings/* variants)
4. Remove Post component wrappers once Session migration complete
5. Write tests for most-used hooks and utilities

### Medium Term (This Quarter)

1. Standardize on Activity naming (remove Project naming)
2. Add missing context tests (AuthContext, ProjectsContext, etc.)
3. Evaluate and potentially consolidate providers
4. Merge scattered performance reports into documentation
5. Consider splitting very large components (>800 lines)

### Long Term (Next Quarters)

1. Achieve 80%+ test coverage across codebase
2. Completely remove old firebaseApi.ts
3. Split large type file if it grows beyond 1000+ types
4. Consider domain-specific type modules
5. Performance optimization based on profiling

---

## 19. CODEBASE MAP - QUICK REFERENCE

```
Ambira Web Codebase
│
├── 📁 src/ (67,574 lines)
│   ├── 📁 app/ (39+ routes)
│   │   ├── page.tsx (Home/Feed)
│   │   ├── timer/ (Session recording)
│   │   ├── activities/ (Project management)
│   │   ├── profile/ (User profiles)
│   │   ├── groups/ (Groups & membership)
│   │   ├── challenges/ (Competition system)
│   │   ├── settings/ (User preferences)
│   │   └── ... (15+ more routes)
│   │
│   ├── 📁 components/ (118 components)
│   │   ├── ui/ (9 primitive components)
│   │   ├── Feed, SessionCard, PostCard (Social)
│   │   ├── SessionTimer, ManualEntry (Recording)
│   │   ├── ProfileHeader, GroupCard (Social entities)
│   │   ├── ChallengeLeaderboard (Challenges)
│   │   └── ... (90+ more feature components)
│   │
│   ├── 📁 features/ (Modular architecture)
│   │   ├── feed/ (Feed system)
│   │   ├── profile/ (User profiles)
│   │   ├── groups/ (Groups)
│   │   ├── settings/ (Settings)
│   │   └── timer/ (Timer)
│   │
│   ├── 📁 lib/ (Core utilities)
│   │   ├── firebaseApi.ts (7,763 lines - legacy)
│   │   ├── api/ (Modular refactoring)
│   │   │   ├── auth/ (✅ Done)
│   │   │   ├── users/ (🚧 TODO)
│   │   │   ├── sessions/ (🚧 TODO)
│   │   │   ├── challenges/ (🚧 TODO)
│   │   │   └── ... (9+ modules)
│   │   ├── cache.ts, errorHandler.ts, rateLimit.ts
│   │   └── imageUpload.ts
│   │
│   ├── 📁 contexts/ (6 providers)
│   │   ├── AuthContext.tsx
│   │   ├── TimerContext.tsx
│   │   ├── ProjectsContext.tsx
│   │   └── ... (3 more)
│   │
│   ├── 📁 hooks/ (Custom hooks)
│   │   ├── useCache.ts
│   │   └── useMutations.ts
│   │
│   ├── 📁 types/ (90 types)
│   │   └── index.ts (1,000 lines)
│   │
│   ├── 📁 __tests__/ (36 test files)
│   │   ├── components/ (Component tests)
│   │   ├── lib/ (Utility tests)
│   │   ├── integration/ (E2E tests)
│   │   └── auth/ (Auth tests)
│   │
│   ├── 📁 styles/
│   │   └── staticPages.ts
│   │
│   └── 📁 providers/
│       └── QueryProvider.tsx
│
├── 📄 Configuration Files
│   ├── tsconfig.json
│   ├── next.config.ts (Sentry, image optimization)
│   ├── jest.config.js (80% coverage threshold)
│   ├── eslint.config.mjs
│   ├── .prettierrc
│   ├── firebase.json
│   └── firestore.rules, firestore.indexes.json
│
├── 📄 Documentation
│   ├── CLAUDE.md (AI guidelines)
│   ├── README.md (Project overview)
│   ├── DATA_ARCHITECTURE.md
│   ├── context/ (Design docs)
│   └── src/lib/api/ (Migration guides)
│
└── 📁 public/ (Static assets)
    └── Favicons, manifest.json
```

---

## END OF ANALYSIS

This comprehensive analysis covers all major areas of the Ambira web application codebase, from high-level architecture to specific files, with actionable recommendations for improvements.

For questions or clarifications about specific areas, refer to:
- `CLAUDE.md` for project guidelines
- `src/lib/api/README.md` for API refactoring details
- `context/design-principles.md` for design system
