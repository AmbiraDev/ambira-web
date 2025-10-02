# Building a Social Productivity Tracking App: Implementation Blueprint

## High-Level Architecture Overview

This application is a social productivity tracker that gamifies focused work through streaks, challenges, and leaderboards. The core value proposition is transforming solitary productivity into a shareable, competitive experience.

### Technical Foundation
- **Frontend**: React with Vite, using React Router for navigation
- **State Management**: React state only (no localStorage/sessionStorage)
- **Styling**: Tailwind CSS for responsive design
- **Database**: PostgreSQL with appropriate indexes
- **Authentication**: JWT-based with OAuth support
- **API**: RESTful endpoints

## Iteration 1: Foundation and Core Infrastructure

### Phase 1.1: Project Setup and Basic Routing
- Initialize React app with Vite
- Set up Tailwind CSS
- Configure React Router with basic routes
- Create layout components (header, navigation, containers)
- Implement responsive navigation structure

### Phase 1.2: Authentication System
- Create auth context and hooks
- Build login/signup forms
- Implement JWT token management
- Add protected route wrapper
- Create basic user profile structure

### Phase 1.3: Database Schema and API Foundation
- Design core database tables (users, projects, sessions, tasks)
- Create API endpoint structure
- Implement basic CRUD operations
- Set up API client with interceptors

## Iteration 2: Core Productivity Features

### Phase 2.1: Projects Management
- Project creation and listing
- Project detail pages
- Project settings and targets
- Archive/delete functionality

### Phase 2.2: Timer System
- Active timer component with start/pause/finish
- Timer persistence in database
- Network resilience handling
- Session completion flow

### Phase 2.3: Manual Entry and Task Management
- Manual session entry form
- Task creation and management within projects
- Task completion tracking during sessions
- Session-task relationship handling

## Iteration 3: Social Features

### Phase 3.1: User Profiles and Following
- Public profile pages
- Following/follower system
- Profile statistics display
- Privacy settings

### Phase 3.2: Social Feed
- Post creation from sessions
- Feed algorithm implementation
- Support and comment system
- Post privacy controls

### Phase 3.3: Groups
- Group creation and discovery
- Group membership management
- Group-specific feeds
- Group leaderboards

## Iteration 4: Gamification and Analytics

### Phase 4.1: Streaks and Achievements
- Streak calculation logic
- Achievement system
- Trophy display
- Notification triggers

### Phase 4.2: Challenges
- Challenge creation for groups
- Challenge participation
- Leaderboard calculations
- Progress tracking

### Phase 4.3: Analytics Dashboard
- Personal analytics views
- Project statistics
- Progress visualizations
- Goal projections

---

## Detailed Implementation Prompts

### Prompt 1: Project Foundation
```text
Create a new React application using Vite with TypeScript. Set up the following foundation:

1. Initialize a Vite React TypeScript project
2. Install and configure Tailwind CSS with a productivity-focused color scheme (primary orange, secondary blue, success green)
3. Install React Router DOM and create a basic routing structure with these routes:
   - / (Home/Feed)
   - /login and /signup (Authentication)
   - /projects and /projects/:id (Project management)
   - /profile/:username (User profiles)
   - /groups and /groups/:id (Groups)
   - /settings (User settings)

4. Create a responsive layout component with:
   - Desktop: Fixed header with navigation, main content area, optional sidebars
   - Mobile: Bottom navigation bar with core actions
   - A floating action button (FAB) for quick session start

5. Implement a basic theme context for light/dark mode support

Include TypeScript interfaces for core data types (User, Project, Session, Task). Set up ESLint and Prettier for code consistency. Create a simple home page that displays "Welcome to Productivity Tracker" to verify everything works.
```

### Prompt 2: Authentication Foundation
```text
Build a complete authentication system with the following requirements:

1. Create an AuthContext that provides:
   - Current user state
   - Login, logout, and signup methods
   - Token management (store in memory, not localStorage)
   - isAuthenticated boolean
   - Loading state during auth checks

2. Implement login and signup forms with:
   - Email/password fields with validation
   - Error message display
   - Loading states during submission
   - Redirect to home after successful auth

3. Create a ProtectedRoute component that:
   - Checks authentication status
   - Redirects to login if not authenticated
   - Preserves intended destination for post-login redirect

4. Add an API service layer with:
   - Axios instance with baseURL configuration
   - Request interceptor to add auth token
   - Response interceptor to handle 401 errors
   - Methods for login, signup, logout endpoints

5. Create mock API responses for testing (can be replaced with real backend later)

Test the flow: User can sign up, log in, access protected routes, and log out. Include proper TypeScript types for all auth-related data.
```

### Prompt 3: Projects and Core Data Models
```text
Implement the projects feature with full CRUD operations:

1. Create Project interfaces and types:
   - Project: id, name, description, icon, color, weeklyTarget, totalTarget, status, createdAt, updatedAt
   - ProjectStats: totalHours, weeklyHours, sessionCount, currentStreak
   
2. Build project management components:
   - ProjectList: Grid/list view of user's projects with progress indicators
   - ProjectCard: Display project name, icon, color, weekly progress bar
   - CreateProjectModal: Form with name, description, icon picker (10 preset icons), color picker (8 preset colors), optional targets
   - ProjectDetailPage: Header with project info, tabs for Overview/Tasks/Sessions

3. Implement project context and hooks:
   - useProjects(): Returns all user projects
   - useProject(id): Returns single project with stats
   - createProject, updateProject, deleteProject methods
   - Archive/restore functionality

4. Add API integration:
   - GET /api/projects - List user's projects
   - POST /api/projects - Create new project
   - GET /api/projects/:id - Get project details
   - PUT /api/projects/:id - Update project
   - DELETE /api/projects/:id - Delete project

5. Create project statistics calculation:
   - Weekly hours tracking
   - Total hours accumulation
   - Progress percentage calculations
   - Target completion estimates

Wire this into the existing routing so users can navigate to /projects, create projects, and view project details. Include loading states and error handling.
```

### Prompt 4: Timer System Core
```text
Build the timer system with database persistence:

1. Create Timer components:
   - TimerDisplay: Shows elapsed time in HH:MM:SS format
   - TimerControls: Start, Pause, Resume, Finish buttons
   - ActiveTimerBar: Persistent bar showing active timer (appears in header)
   - SessionTimer: Full-page timer view with project selection and task list

2. Implement timer state management:
   - Create TimerContext for global timer state
   - Store: isRunning, startTime, pausedDuration, currentProject, selectedTasks
   - Calculate elapsed time from startTime (not local state counting)
   - Handle pause/resume with duration tracking

3. Build database persistence:
   - POST /api/sessions/start - Creates active timer record with startTime
   - PUT /api/sessions/active - Updates active timer (for pause/resume)
   - GET /api/sessions/active - Retrieves any active timer on app load
   - POST /api/sessions/finish - Completes timer and creates session

4. Add network resilience:
   - On disconnect: Timer continues (calculated from startTime)
   - On reconnect: Fetch active timer and update display
   - Auto-save timer state every 30 seconds
   - Show connection status indicator

5. Integrate with projects:
   - Project selector in timer view
   - Load project's tasks when selected
   - Task checkbox list during timer
   - Track which tasks completed during session

Test the complete flow: Start timer → Leave page → Return → Timer still running → Pause → Resume → Finish → Session saved. Handle edge cases like browser refresh and network interruptions.
```

### Prompt 5: Session Management and Manual Entry
```text
Complete the session management system:

1. Create Session interfaces:
   - Session: id, projectId, title, description, duration, startTime, tasks, tags, visibility, isArchived
   - SessionForm: Interface for both timer completion and manual entry
   
2. Build SaveSession component (used after timer finishes):
   - Auto-populated fields from timer (duration, project, completed tasks)
   - Editable title (with smart placeholder based on time of day)
   - Description textarea for notes
   - Tag selector (Study/Work/Side Project/Reading/Learning)
   - Privacy dropdown (Everyone/Followers/Only You)
   - "How did it feel" rating (1-5 stars, private)
   - Private notes field (never shown publicly)

3. Implement ManualEntry component:
   - Same fields as SaveSession
   - Date picker (defaults to today)
   - Time picker (30-minute intervals)
   - Duration input (separate hours/minutes/seconds inputs)
   - Manual task entry (textarea, parse line breaks)

4. Create session management features:
   - POST /api/sessions - Create manual session
   - GET /api/sessions - List user's sessions with filtering
   - PUT /api/sessions/:id - Edit session
   - DELETE /api/sessions/:id - Delete session (removes from stats)
   - PUT /api/sessions/:id/archive - Archive session (hides but keeps stats)

5. Build session history view:
   - List of sessions with date, duration, project, tasks
   - Filter by project, date range, tags
   - Sort by date, duration
   - Edit/Archive/Delete actions
   - Pagination for large lists

Connect this to the timer system so finishing a timer leads to SaveSession, and add Manual Entry option to the FAB menu. Include validation and error handling.
```

### Prompt 6: Task Management System
```text
Implement the complete task management system:

1. Create Task interfaces and components:
   - Task: id, projectId, name, status (active/completed/archived), createdAt, completedAt
   - TaskList: Displays tasks with checkboxes, grouped by status
   - TaskInput: Simple text input with add button
   - TaskItem: Individual task with edit/archive/delete actions

2. Build task management within projects:
   - Tasks tab in ProjectDetailPage
   - Three sub-tabs: Active, Completed, Archived
   - Bulk actions: Complete all, Archive completed
   - Inline editing of task names
   - Drag to reorder (optional, use react-beautiful-dnd)

3. Integrate tasks with timer:
   - Load project tasks when timer starts
   - Real-time task checking during timer
   - Add new tasks during timer (saved immediately)
   - Track which tasks completed in this session
   - Show completed count in timer view

4. Implement task API:
   - GET /api/projects/:id/tasks - List project tasks
   - POST /api/projects/:id/tasks - Create task
   - PUT /api/tasks/:id - Update task (name, status)
   - DELETE /api/tasks/:id - Delete task
   - POST /api/tasks/bulk - Bulk status update

5. Create task statistics:
   - Tasks completed per session
   - Tasks completed per day/week
   - Average tasks per session
   - Most productive task completion times

Wire tasks into the existing project and timer systems. Tasks checked during timer should be marked as completed in that session. Include optimistic updates for better UX.
```

### Prompt 7: User Profiles and Following System
```text
Build the social foundation with user profiles and following:

1. Create Profile components:
   - ProfileHeader: Avatar, name, bio, location, stats (followers, following, total hours)
   - ProfileTabs: Overview, Achievements, Following, Posts
   - ProfileStats: Week/month activity charts, calendar heatmap
   - EditProfileModal: Update name, bio, location, avatar

2. Implement following system:
   - POST /api/users/:id/follow - Follow user
   - DELETE /api/users/:id/follow - Unfollow user
   - GET /api/users/:id/followers - List followers
   - GET /api/users/:id/following - List following
   - Follow/Unfollow button with optimistic updates

3. Build user discovery:
   - SearchUsers component with real-time search
   - UserCard: Compact display with follow button
   - SuggestedUsers: Algorithm-based recommendations
   - GET /api/users/search?q=query - Search users
   - GET /api/users/suggested - Get suggestions

4. Create profile statistics:
   - Activity calendar (heatmap of daily hours)
   - Weekly activity chart (bar graph)
   - Project breakdown (pie chart of time per project)
   - Streak display with calendar visualization

5. Implement privacy settings:
   - Profile visibility (Everyone/Followers/Private)
   - Activity visibility defaults
   - Blocked users management
   - Hide specific projects from public view

Add routing for /profile/:username and link from user names throughout the app. Include loading states and handle non-existent users gracefully.
```

### Prompt 8: Social Feed and Posts
```text
Implement the social feed system:

1. Create Post components:
   - Post: Full post display with session data, description, interactions
   - PostCard: Compact card for feed display
   - PostStats: Duration, tasks completed, project badge
   - PostInteractions: Support button, comment count, share

2. Build the feed algorithm:
   - GET /api/feed - Fetch personalized feed
   - Algorithm factors: Recency, following status, interaction history
   - Pagination with infinite scroll
   - Pull-to-refresh functionality
   - "New posts" indicator at top

3. Implement post interactions:
   - Support system (like/heart):
     - POST /api/posts/:id/support - Give support
     - DELETE /api/posts/:id/support - Remove support
     - Optimistic updates with rollback on error
   - Share functionality:
     - Copy link to clipboard
     - Native share API on mobile

4. Create the feed layout:
   - Desktop: Three-column layout
     - Left: Personal stats widget
     - Center: Post feed
     - Right: Suggestions and discovery
   - Mobile: Single column with collapsed sidebars
   - Responsive breakpoints

5. Build post creation flow:
   - Auto-create post when session saved (if visibility not "Only You")
   - Option to add description before posting
   - Tag other users with @mentions
   - Edit post after creation
   - Delete/Archive post options

Connect posts to sessions - when a session is completed, it creates a post (respecting privacy settings). Include real-time updates for support counts.
```

### Prompt 9: Comments System
```text
Add commenting functionality to posts:

1. Create Comment components:
   - CommentList: Nested comment tree with replies
   - CommentItem: Individual comment with actions
   - CommentInput: Text input with @mention support
   - CommentThread: Collapsible reply threads

2. Implement comment data model:
   - Comment: id, postId, userId, parentId (for replies), content, createdAt
   - Nested structure for reply threads
   - Maximum nesting depth of 3 levels

3. Build comment API:
   - GET /api/posts/:id/comments - Fetch comments (paginated)
   - POST /api/posts/:id/comments - Create comment
   - PUT /api/comments/:id - Edit comment
   - DELETE /api/comments/:id - Delete comment
   - POST /api/comments/:id/like - Like comment

4. Add @mention functionality:
   - Autocomplete dropdown while typing @
   - Search users in real-time
   - Create notification for mentioned user
   - Highlight mentions in rendered comments
   - Click mention to view profile

5. Implement comment features:
   - Real-time comment count updates
   - "Load more comments" pagination
   - Collapsible threads for long discussions
   - Edit history (show "edited" label)
   - Report comment option

Integrate with existing post system. Add comment notification preferences to settings. Include optimistic updates and proper error handling.
```

### Prompt 10: Groups System
```text
Build the groups (clubs) feature:

1. Create Group components:
   - GroupCard: Display for browse/search results
   - GroupHeader: Banner, name, description, member count
   - GroupTabs: Posts, Members, Challenges, Leaderboard
   - CreateGroupModal: Form for new group creation
   - GroupSettings: Admin panel for group management

2. Implement group discovery:
   - BrowseGroups: Grid of group cards with filters
   - Filters: Location, Category (Work/Study/Side Project), Type (Fun/Professional/Competitive)
   - Search with GET /api/groups/search
   - Suggested groups based on user interests

3. Build group membership:
   - POST /api/groups/:id/join - Join group
   - DELETE /api/groups/:id/leave - Leave group
   - GET /api/groups/:id/members - List members
   - Group privacy: Public (instant join) or Approval Required
   - Member roles: Admin, Member

4. Create group-specific features:
   - Group feed (posts from members)
   - Group leaderboard (weekly/monthly/yearly)
   - Member list with search
   - Group statistics and analytics
   - Admin tools: Remove members, edit group

5. Implement group posts:
   - Option to post to groups when creating post
   - Group posts also appear in main feed
   - Group-only visibility option
   - Group post moderation (admins can remove)

Wire groups into navigation and create /groups routes. Include proper permission checking for admin actions.
```

### Prompt 11: Challenges System
```text
Implement the challenges feature for groups:

1. Create Challenge components:
   - ChallengeCard: Display in lists and discovery
   - ChallengeDetail: Full page with description, rules, leaderboard
   - CreateChallengeModal: Form for admins to create challenges
   - ChallengeProgress: Personal progress indicator
   - ChallengeLeaderboard: Ranked participant list

2. Build challenge types:
   - Most Activity: Total hours/tasks in period
   - Fastest Effort: Best tasks/hour ratio
   - Longest Session: Single longest session
   - Group Goal: Collective target (no individual ranking)
   - Custom goals with configurable metrics

3. Implement challenge management:
   - POST /api/challenges - Create (group admins only)
   - GET /api/challenges/:id - Get details
   - POST /api/challenges/:id/join - Join challenge
   - DELETE /api/challenges/:id/leave - Leave challenge
   - GET /api/challenges/:id/leaderboard - Get rankings

4. Create progress tracking:
   - Real-time progress updates
   - Progress bars and percentages
   - Time remaining countdown
   - Milestone notifications
   - Certificate/badge on completion

5. Build challenge discovery:
   - Active challenges in group pages
   - Browse all public challenges
   - Filter by type, duration, group
   - "Ending soon" section
   - Recommended challenges

Integrate with existing session tracking - sessions automatically count toward active challenges. Add challenge notifications and achievement unlocks.
```

### Prompt 12: Streaks and Achievements
```text
Build the gamification system with streaks and achievements:

1. Create Streak components:
   - StreakDisplay: Current streak with flame icon
   - StreakCalendar: Visual calendar showing streak days
   - StreakNotification: Warning before streak breaks
   - StreakStats: Best streak, total streak days

2. Implement streak calculation:
   - Daily activity check (any session counts)
   - Timezone-aware calculation
   - GET /api/users/:id/streak - Get streak data
   - Streak recovery: No grace period in MVP
   - Email reminder at 8 PM if no activity

3. Build achievement system:
   - Achievement types:
     - Streak milestones (7, 30, 100 days)
     - Hour milestones (10, 50, 100, 500 hours)
     - Task milestones (50, 100, 500 tasks)
     - Challenge completions
     - Personal records
   - Achievement unlock animation
   - Trophy case display on profile

4. Create achievement tracking:
   - Real-time achievement checking after sessions
   - POST /api/achievements/check - Trigger achievement check
   - GET /api/users/:id/achievements - List user achievements
   - Achievement notification system
   - Share achievement to feed option

5. Implement streak protection:
   - Streak reminder notifications
   - Streak calendar in profile
   - Streak restoration (admin only, for bugs)
   - Public/private streak toggle
   - Streak leaderboards in groups

Connect to existing session system - completing a session updates streak and checks for new achievements. Add achievement badges to posts and profiles.
```

### Prompt 13: Analytics Dashboard
```text
Create comprehensive analytics views:

1. Build analytics components:
   - StatsCard: Metric display with trend arrow
   - ActivityChart: Line/bar charts for time data
   - HeatmapCalendar: GitHub-style activity calendar
   - ProgressRing: Circular progress for goals
   - ProjectionLine: Estimated completion dates

2. Implement personal analytics:
   - Dashboard with key metrics:
     - This week: Hours, tasks, sessions
     - Trends: vs last week percentages
     - Current streak and best streak
     - Most productive day/time analysis
   - Time period selector: 7D, 1M, 3M, 6M, 1Y

3. Create project analytics:
   - Cumulative hours chart
   - Weekly average calculation
   - Goal projection (dotted line to target)
   - Session frequency histogram
   - Task completion rate
   - Estimated completion date

4. Build comparative analytics:
   - Compare projects side-by-side
   - Week-over-week comparisons
   - Personal records and milestones
   - Percentile rankings in groups
   - Productivity patterns (time of day, day of week)

5. Implement data export:
   - Export to CSV functionality
   - Include: Sessions, projects, tasks
   - Date range selection
   - GET /api/analytics/export - Generate export
   - Email download link (no direct download)

Add analytics widgets to home dashboard and project pages. Use a charting library like Recharts for visualizations. Cache calculations for performance.
```

### Prompt 14: Notifications System
```text
Implement the notification system:

1. Create notification components:
   - NotificationBell: Icon with unread count
   - NotificationDropdown: Recent notifications list
   - NotificationItem: Individual notification display
   - NotificationSettings: Preference management

2. Build notification types:
   - Social: New follower, support, comment, mention
   - Activity: Streak reminder, achievement unlock
   - Group: New post, challenge created, invitation
   - System: Welcome, feature announcements

3. Implement notification delivery:
   - Email notifications (MVP):
     - Template system for different types
     - Unsubscribe links
     - Batching for high-volume (group posts)
   - In-app storage:
     - GET /api/notifications - List notifications
     - PUT /api/notifications/:id/read - Mark read
     - DELETE /api/notifications/:id - Delete
     - POST /api/notifications/mark-all-read

4. Create notification preferences:
   - Granular controls per notification type
   - Email frequency: Instant, Daily digest, Off
   - Quiet hours setting
   - Mobile push prep (structure for future)
   - PUT /api/users/notification-preferences

5. Build real-time updates (WebSocket prep):
   - Structure for future WebSocket integration
   - Polling fallback for MVP
   - Notification count in nav bar
   - Desktop notification permission request
   - Sound/visual alerts toggle

Integrate with all existing features that generate notifications. Include user preference checking before sending.
```

### Prompt 15: Search and Discovery
```text
Complete the search and discovery features:

1. Create search components:
   - GlobalSearch: Omnisearch with type filter
   - SearchResults: Unified results display
   - SearchFilters: Advanced filter options
   - QuickSearch: Instant results dropdown
   - SearchHistory: Recent searches

2. Implement people search:
   - GET /api/search/users?q=&location=&tags=
   - Full-text search on name, bio
   - Location-based filtering
   - Fuzzy matching for typos
   - Result ranking by relevance

3. Build group search:
   - GET /api/search/groups?q=&category=&type=&location=
   - Search name and description
   - Category and type filters
   - Member count and activity sorting
   - Distance-based results (if location enabled)

4. Create discovery algorithms:
   - Suggested friends:
     - Mutual connections
     - Similar projects/tags
     - Location proximity
     - Group co-membership
   - Trending content:
     - Most supported posts (24h)
     - Growing groups
     - Popular challenges
     - Rising stars (new active users)

5. Implement quick actions:
   - Command palette (Cmd+K):
     - Quick navigation
     - Start timer
     - Create project
     - Search anything
   - Recent items sidebar
   - Bookmarks/favorites system

Add search to main navigation and implement keyboard shortcuts. Include search analytics for improving recommendations.
```

### Prompt 16: Settings and Privacy
```text
Build comprehensive settings and privacy controls:

1. Create settings structure:
   - SettingsLayout: Sidebar navigation + content area
   - SettingSection: Grouped setting controls
   - SettingItem: Individual setting with label, control, description
   - SettingsProvider: Context for settings state

2. Implement profile settings:
   - Edit profile information
   - Avatar upload with crop
   - Vanity URL selection
   - Bio with character limit
   - Location with geocoding
   - Birthday and gender

3. Build privacy controls:
   - Default post visibility
   - Profile visibility (public/followers/private)
   - Activity visibility on profile
   - Block list management
   - Data download request
   - Account deletion

4. Create notification preferences:
   - Email notification toggles
   - Notification grouping/batching
   - Quiet hours
   - Weekly summary preferences
   - Mention settings
   - Streak reminders

5. Implement display preferences:
   - Theme (light/dark/auto)
   - Language selection
   - Timezone setting
   - Date/time format
   - Metric preferences (hours vs minutes)
   - Homepage default view

Connect all settings to their respective features. Add settings import/export for backup. Include confirmation dialogs for destructive actions.
```

### Prompt 17: Mobile Optimization
```text
Optimize the entire application for mobile devices:

1. Responsive layout adjustments:
   - Convert three-column desktop to single column
   - Collapsible sidebars with swipe gestures
   - Bottom navigation bar for core actions
   - Floating action button for quick timer start
   - Pull-to-refresh on scrollable views

2. Touch-optimized interactions:
   - Minimum 44px touch targets
   - Swipe actions on list items
   - Long-press context menus
   - Gesture navigation support
   - Haptic feedback hooks

3. Mobile-specific features:
   - Native share API integration
   - Camera integration for avatar upload
   - Offline mode with sync queue
   - Reduced data mode (smaller images)
   - Battery-optimized timer

4. Performance optimizations:
   - Lazy loading images
   - Virtual scrolling for long lists
   - Debounced search inputs
   - Optimistic UI updates
   - Progressive image loading

5. PWA configuration:
   - Service worker for offline
   - App manifest for install
   - Push notification groundwork
   - Background sync for timer
   - App icon and splash screen

Test on various screen sizes and devices. Ensure all features work with touch. Add viewport meta tag and prevent zoom on inputs.
```

### Prompt 18: Performance and Error Handling
```text
Add comprehensive error handling and performance optimizations:

1. Error boundary implementation:
   - Global error boundary component
   - Feature-specific error boundaries
   - Fallback UI for errors
   - Error logging service
   - User-friendly error messages

2. API error handling:
   - Centralized error interceptor
   - Retry logic for failed requests
   - Offline queue for mutations
   - Timeout handling
   - Rate limit management

3. Loading states and skeletons:
   - Skeleton screens for all major components
   - Progressive loading indicators
   - Optimistic updates with rollback
   - Stale-while-revalidate caching
   - Loading state management

4. Performance monitoring:
   - React DevTools profiling
   - Bundle size optimization
   - Code splitting by route
   - Dynamic imports for modals
   - Image optimization pipeline

5. Data caching strategy:
   - React Query or SWR integration
   - Cache invalidation rules
   - Prefetching common routes
   - Background refetching
   - LocalStorage fallback for critical data

Add performance budgets and monitoring. Include user feedback for errors and slow operations.
```

### Prompt 19: Testing Suite
```text
Implement comprehensive testing across the application:

1. Unit testing setup:
   - Jest configuration for React/TypeScript
   - Testing utilities setup (React Testing Library)
   - Mock service worker for API mocking
   - Test coverage requirements (80% minimum)
   - Snapshot testing for components

2. Component testing:
   - Test all interactive components
   - Form validation testing
   - Error state testing
   - Loading state testing
   - Accessibility testing with jest-axe

3. Integration testing:
   - User flow testing (signup → create project → log session)
   - Timer flow testing with mock timers
   - Authentication flow testing
   - API integration testing
   - State management testing

4. End-to-end testing:
   - Playwright or Cypress setup
   - Critical user journeys
   - Cross-browser testing
   - Mobile viewport testing
   - Performance testing

5. Testing utilities:
   - Factory functions for test data
   - Custom testing hooks
   - API mock generators
   - Test database seeders
   - CI/CD pipeline integration

Create test files alongside components. Add pre-commit hooks for test execution. Document testing patterns and best practices.
```

### Prompt 20: Final Integration and Polish
```text
Complete the final integration and polish:

1. Deep linking implementation:
   - Share URLs for posts, profiles, groups
   - Universal links for mobile
   - Meta tags for social sharing
   - Open Graph images
   - Twitter cards

2. Accessibility audit:
   - ARIA labels and roles
   - Keyboard navigation testing
   - Screen reader testing
   - Color contrast validation
   - Focus management

3. Security hardening:
   - Input sanitization
   - XSS prevention
   - CSRF protection
   - Rate limiting
   - Content Security Policy

4. Analytics integration:
   - Page view tracking
   - Event tracking for key actions
   - User flow analysis
   - Performance metrics
   - Error tracking (Sentry)

5. Production preparation:
   - Environment configuration
   - Build optimization
   - Docker containerization
   - Deployment scripts
   - Monitoring setup
   - Backup strategies
   - Documentation completion

Review all features for consistency. Add onboarding tooltips. Implement feedback widgets. Create admin dashboard for moderation. Prepare launch materials.
```

## Integration Notes

Each prompt builds upon the previous ones, ensuring no orphaned code. The progression follows:

1. **Foundation** (Prompts 1-2): Basic app structure and authentication
2. **Core Features** (Prompts 3-6): Projects, timer, sessions, tasks
3. **Social Layer** (Prompts 7-9): Profiles, feed, comments
4. **Community** (Prompts 10-11): Groups and challenges
5. **Gamification** (Prompts 12-13): Streaks, achievements, analytics
6. **Enhancement** (Prompts 14-16): Notifications, search, settings
7. **Optimization** (Prompts 17-18): Mobile, performance
8. **Quality** (Prompts 19-20): Testing and final polish

Each component should be tested immediately after implementation, with integration tests added as features connect. The architecture supports incremental deployment, allowing for user feedback at each stage.