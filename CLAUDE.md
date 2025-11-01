# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ambira is a social productivity tracking application inspired by Strava - a "Strava for Productivity". Users track work sessions on projects, build streaks, follow friends, join groups, and compete in challenges. Built with Next.js 15, TypeScript, Tailwind CSS, and Firebase.

## Package Manager

**This project uses npm exclusively.** Do not use Yarn or any other package manager.

- Use `npm install` to install dependencies
- Use `npm run <script>` to run scripts
- Only `package-lock.json` should exist (no `yarn.lock` or `pnpm-lock.yaml`)

## Commands

### Development

```bash
npm run dev           # Start development server at http://localhost:3000
npm run build         # Build for production
npm run start         # Start production server
```

### Code Quality

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors automatically
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting without changes
npm run type-check    # Run TypeScript type checking without emitting files
```

### Testing

```bash
# Unit & Integration Tests (Jest)
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate test coverage report

# End-to-End Tests (Playwright)
npm run test:e2e       # Run all E2E tests
npm run test:smoke     # Run smoke tests only
npm run test:e2e:ui    # Run tests in UI mode (interactive)
npm run test:e2e:debug # Run tests in debug mode
npm run test:e2e:report # View last test report
```

### Firebase

```bash
npx firebase-tools deploy --only firestore:rules --non-interactive
# Deploy Firestore security rules (required after modifying firestore.rules)
```

## Architecture

**📚 For comprehensive architecture documentation, see [/docs/architecture/](./docs/architecture/README.md)**

Key architectural patterns:

- **Caching**: React Query at feature boundaries - see [CACHING_STRATEGY.md](./docs/architecture/CACHING_STRATEGY.md)
- **Feature Structure**: Clean architecture with Services, Hooks, and Repositories
- **Examples**: Complete implementations in [EXAMPLES.md](./docs/architecture/EXAMPLES.md)

### Sessions-Only Model (Strava-like)

**Critical**: Sessions ARE the primary content type, not posts. There is NO separate Post type or posts collection in active use.

- Sessions function as posts directly (like Strava's activities)
- The feed displays sessions with `visibility: 'everyone' | 'followers' | 'private'`
- Each session includes: `supportCount`, `commentCount`, `isSupported`
- `getFeedSessions()` fetches from `sessions` collection and populates with user/project data
- Comments reference `sessionId` not `postId`
- All components use `SessionWithDetails` instead of `PostWithDetails`

### Firebase Collections Structure

**Users**: `/users/{userId}`

- User profiles with follower/following counts
- Privacy settings: `profileVisibility`, `activityVisibility`, `projectVisibility`
- Has `activeSession` subcollection for timer persistence

**Projects**: `/projects/{userId}/userProjects/{projectId}`

- Organized as subcollection under user

**Sessions**: `/sessions/{sessionId}`

- Sessions are the main content/feed items
- Include social engagement fields
- Used for feed, profiles, and analytics

**Follows**: `/follows/{followId}`

- Follow relationships with composite IDs: `{followerId}_{followingId}`
- Updates follower/following counts on both user documents

**Groups**: `/groups/{groupId}`

- Social groups with members and challenges
- Privacy: `public` or `approval-required`

**Challenges**: `/challenges/{challengeId}`

- Types: `most-activity`, `fastest-effort`, `longest-session`, `group-goal`
- Can be global or group-specific
- Participants tracked in `/challengeParticipants/{participantId}`

**Streaks**: `/streaks/{userId}`

- Current and longest streak tracking
- Public/private visibility setting

### State Management

**React Context Providers** (in `/src/contexts/`):

- `AuthContext`: User authentication state, login/signup/logout
- `ProjectsContext`: Project CRUD operations
- `TimerContext`: Active timer state and persistence

All contexts wrap the app in `/src/app/layout.tsx`

### Key Design Patterns

**Firestore Data Integrity**:

- Strip `undefined` values before writes (Firestore rejects them)
- Use batched `update()` instead of `set()` with merge for better security rule compatibility
- Increment/decrement operations for counts (followers, supports, comments)

**Type System**:

- Core types in `/src/types/index.ts` (879 lines)
- Extensive TypeScript coverage with strict mode
- Populated data types (e.g., `SessionWithDetails`) for UI components

**Routing**:

- Next.js App Router (not Pages Router)
- Key routes:
  - `/` - Home/Feed
  - `/timer` - Active session timer
  - `/profile/[username]` - User profiles
  - `/projects` and `/projects/[id]` - Project management
  - `/groups` and `/groups/[id]` - Groups
  - `/challenges` and `/challenges/[id]` - Challenges
  - `/settings/*` - User settings

### Firestore Security Rules

Located in `firestore.rules`. Key rules:

- Users can read profiles based on visibility settings (everyone/followers/private)
- Follows allow any authenticated user to update follower counts (safe due to increment-only operations)
- Sessions visible based on visibility field
- Comments and supports have user-scoped permissions
- Group challenges: only admins can create/edit/delete
- Challenge participants can update their own progress

**After modifying rules**: Always deploy with:

```bash
npx firebase-tools deploy --only firestore:rules --non-interactive
```

### Design System

**Colors**:

- Primary: Electric Blue (`#007AFF`)
- Brand Orange: `#FC4C02` (used for profile avatars)
- Success Green: `#34C759`
- Clean white surfaces for content

**Layout**:

- Three-column desktop layout (left sidebar, feed, right sidebar)
- Single-column mobile with bottom navigation
- Responsive breakpoints managed by Tailwind

**Components**:

- UI primitives in `/src/components/ui/` (card, button, input, etc.)
- Feature components in `/src/components/` (organized by feature)
- Reusable patterns: modal overlays, tab interfaces, stat cards

## Visual Development

### Design Principles

- Comprehensive design checklist in `/context/design-principles.md`
- Brand style guide in `/context/style-guide.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance

### Quick Visual Check

IMMEDIATELY after implementing any front-end change:

1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md` and `/context/style-guide.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review

Invoke the `@agent-design-review` subagent for thorough design validation when:

- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

### shadcn/ui Components

- Modern component library built on Radix UI primitives
- Components in `/src/components/ui/`
- Tailwind CSS v4 with CSS variables for theming
- Lucide React icons throughout

### Key Features

- Dashboard for event management
- Content moderation tools
- Export functionality
- Credits system
- Notification support

## Development Notes

### Cursor Rules (from `.cursor/rules/`)

**General Rules**:

- Only modify code directly related to the request
- Never leave placeholders; produce complete, testable code
- Run unit and integration tests after every change; halt if any fail
- Document updates in README or core docs
- Use functional programming patterns; modularize new logic
- Explain reasoning for every proposed change
- Provide git commit message at end of response
- When changing Firestore rules, always deploy them

**Task Completion**:

- After completing tasks, update `specs/todo.md` to mark items as completed

### Common Pitfalls

1. **Firestore Undefined Values**: Never write `undefined` to Firestore. Strip undefined keys before writes.

2. **Post vs Session Confusion**: Always use sessions, not posts. Sessions ARE the posts.

3. **Follow Permissions**: Use batched `update()` for follow operations to work with security rules that allow count updates.

4. **Build Errors Ignored**: `next.config.ts` has `ignoreDuringBuilds: true` for both ESLint and TypeScript. Fix issues locally before deployment.

5. **Active Timer Display**: Header shows live elapsed time when not on `/timer` page; on `/timer` it shows "Active" to avoid duplicate displays.

### Required Firestore Indexes

Create these composite indexes in Firebase Console:

1. **Sessions - Following Feed**
   - Collection: `sessions`
   - Fields: `visibility` (Ascending), `createdAt` (Descending)

2. **Sessions - Trending Feed**
   - Collection: `sessions`
   - Fields: `visibility` (Ascending), `createdAt` (Descending)

Indexes auto-suggest on first feed load.

### Path Aliases

TypeScript configured with path alias:

```typescript
import { Something } from '@/components/Something';
// Resolves to: src/components/Something
```

### Environment Variables

**Required** - Firebase configuration in `.env.local`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

**Optional** - Sentry error tracking configuration:

- `NEXT_PUBLIC_SENTRY_DSN` - Public DSN for error reporting (leave empty to disable Sentry)
- `SENTRY_AUTH_TOKEN` - Secret token for uploading source maps (production deployments only)

See `.env.example` for detailed setup instructions and required scopes.

## Testing

**Test Structure**: Ambira uses a comprehensive 3-tier testing strategy with **80% coverage target** across all production-critical features.

### Test Organization

```
tests/
├── unit/              # Unit tests (Jest) - Isolated logic testing
├── integration/       # Integration tests (Jest) - Cross-module flows
├── e2e/              # End-to-end tests (Playwright) - User journeys
└── __mocks__/        # Shared mocks for deterministic testing
```

**IMPORTANT**: All new tests must go in the `tests/` directory structure above. Never use `src/__tests__/`.

### Coverage Scope

We cover every production-critical feature to ensure new releases don't break essential workflows:

**Core Features** (Must be tested):

- Authentication/onboarding
- Session logging and timer
- Feed interactions (filters, support, comments)
- Social graph (follow/unfollow, suggestions)
- Projects/activities management
- Groups functionality
- Challenges system
- Analytics dashboards
- Notifications
- Search & discovery
- Profile/settings management
- Media upload
- PWA install experience

### Unit Testing (Jest)

**Location**: `tests/unit/` and `tests/__mocks__/`

Unit tests isolate business logic, utilities, and providers using lightweight manual mocks for deterministic results.

```bash
npm test -- tests/unit/           # Run unit tests only
npm run test:watch -- tests/unit/ # Watch mode for unit tests
```

**What to test**:

- Services (Firebase operations, API calls)
- Domain entities (Session, Group, Challenge models)
- Utilities and helpers
- React hooks (queries, mutations)
- Context providers (AuthContext, TimerContext)
- UI components (render, interactions, state)

**Examples**:

- `tests/unit/services/firebaseSessions.test.ts` - Pagination & error handling
- `tests/unit/providers/AuthProvider.test.tsx` - Auth state transitions
- `tests/unit/ui/components/Header.test.tsx` - Render & toggles
- `tests/unit/hooks/auth.queries.test.tsx` - React Query hooks

**Best Practices**:

- Use AAA pattern (Arrange, Act, Assert)
- Mock external dependencies (Firebase, API calls)
- Use factories from `tests/__mocks__/` for test data
- Test edge cases and error paths
- Keep tests fast (< 5s total execution)

### Integration Testing (Jest)

**Location**: `tests/integration/`

Integration tests span multiple modules without needing a full browser. They verify seams like optimistic cache updates, routing guards, and cross-context coordination.

```bash
npm test -- tests/integration/           # Run integration tests only
npm run test:watch -- tests/integration/ # Watch mode for integration tests
```

**What to test**:

- Cross-module workflows (auth → timer → session save)
- Cache synchronization (React Query + Firebase)
- Routing guards (protected routes)
- Context coordination (multiple providers)
- Form submission flows
- API contract compliance

**Examples**:

- `tests/integration/feed/support-flow.test.ts` - Like/unlike with cache updates
- `tests/integration/challenges/lifecycle.test.ts` - Create → join → update → complete
- `tests/integration/search/results-flow.test.ts` - Search → filter → navigate

**Best Practices**:

- Use `@testing-library/react` for web components
- Use `@testing-library/react-native` for mobile components
- Mock Firebase backend with in-memory implementations
- Test realistic user flows
- Verify side effects (cache updates, analytics events)

### Usability Testing (Playwright)

**Location**: `tests/e2e/`

End-to-end tests validate complete user journeys and accessibility using Playwright for web.

```bash
npm run test:e2e       # Run all E2E tests
npm run test:smoke     # Run smoke tests only (critical paths)
npm run test:e2e:ui    # Run tests in UI mode (interactive)
npm run test:e2e:debug # Run tests in debug mode
npm run test:e2e:report # View last test report
```

**What to test**:

- Complete user journeys (signup → create project → log session)
- UI interactions (clicks, forms, navigation)
- Accessibility (WCAG 2.0/2.1 Level AA compliance)
- Responsive design (mobile, tablet, desktop)
- Keyboard navigation
- Screen reader compatibility

**Examples**:

- `tests/e2e/auth.spec.ts` - Login, signup, logout flows
- `tests/e2e/feed.spec.ts` - Feed loading, filtering, interactions
- `tests/e2e/timer.spec.ts` - Start, pause, stop, save session
- `tests/e2e/challenges.spec.ts` - Browse, join, track progress
- `tests/e2e/feed-accessibility.spec.ts` - Accessibility audits

**CI Integration**:

- E2E tests run automatically on every PR and push to main
- Tests run in Chromium browser
- Produces HTML reports with screenshots/videos on failure
- Failures are gating events (block merges)

**First Time Setup**:

```bash
npx playwright install  # Install browser binaries
```

### Running Tests

```bash
# All tests
npm test                    # Run all Jest tests (unit + integration)
npm run test:e2e            # Run all Playwright tests

# By type
npm test -- tests/unit/           # Unit tests only
npm test -- tests/integration/    # Integration tests only
npm run test:smoke                # Smoke tests only (critical E2E)

# With options
npm run test:watch                # Watch mode
npm run test:coverage             # Generate coverage report (must hit 95%)
npm run test:e2e:ui               # Interactive E2E mode
npm run test:e2e:debug            # Debug E2E tests

# Specific files
npm test -- Header.test.tsx       # Run specific test file
```

### Coverage Requirements

**Ultimate Target**: 80% coverage across branches, functions, lines, and statements

**Current Phase**: Phased roadmap approach (see [TESTING_COVERAGE_ROADMAP.md](./docs/architecture/TESTING_COVERAGE_ROADMAP.md))

- Phase 1 (Current): 11.74% - Stable CI with realistic thresholds
- Phase 2 (Weeks 2-4): 40% target - Core API coverage
- Phase 3 (Weeks 5-8): 80% target - Comprehensive coverage

**Current Status**: 11.74% statements, 11.82% lines (521 tests, 69 test suites)

- All tests passing with Phase 1 thresholds
- CI green and ready for feature development

```bash
npm run test:coverage  # Generate detailed coverage report
```

**Coverage is enforced in CI** - PRs must meet current phase threshold.

**What counts toward coverage**:

- All production code in `src/`
- Excludes: `src/app/` (Next.js app router), `src/types/`, test files
- Strategy: See [TESTING_COVERAGE_ROADMAP.md](./docs/architecture/TESTING_COVERAGE_ROADMAP.md) for phased implementation

### Test Configuration

**Jest Config**: `jest.config.ts`

- Test environment: jsdom
- Setup file: `jest.setup.js`
- Path alias mapping: `@/*` → `src/*`
- Coverage thresholds (Phase 1): 11% statements, 11% lines, 9% functions, 6% branches
- Phase 2 increase planned: 40% target
- Phase 3 final target: 80% coverage
- Ignores: `.next/`, `node_modules/`, `tests/e2e/`
- See jest.config.ts comments for phased roadmap details

**Playwright Config**: `playwright.config.ts`

- Browsers: Chromium (CI), Chromium + Firefox + WebKit (local)
- Viewport: 1280x720
- Timeout: 30s per test
- Screenshots on failure
- Video on failure

### Writing New Tests

**When adding new features**:

1. Write unit tests FIRST (TDD approach)
2. Add integration tests for cross-module flows
3. Add E2E tests for user-facing features
4. Ensure coverage stays at 80%

**File naming conventions**:

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

**Where to put tests**:

- Unit tests: Match source structure in `tests/unit/`
  - Example: `src/lib/api/sessions.ts` → `tests/unit/lib/api/sessions.test.ts`
- Integration tests: By feature in `tests/integration/`
  - Example: `tests/integration/feed/support-flow.test.ts`
- E2E tests: By user journey in `tests/e2e/`
  - Example: `tests/e2e/timer.spec.ts`

**Shared mocks**: Use `tests/__mocks__/` for reusable mocks

- Firebase mocks: `tests/__mocks__/firebase/`
- API mocks: `tests/__mocks__/api/`
- Test factories: `tests/__mocks__/factories/`

See [Test Suite Documentation](./tests/README.md) for comprehensive testing guide.

Run tests before every commit. All tests must pass before pushing.

## Feature Status

Check `specs/todo.md` for detailed implementation status. Key completed features:

- ✅ Authentication (Firebase Auth)
- ✅ Projects and Tasks
- ✅ Session Timer with persistence
- ✅ Social Feed with sessions
- ✅ Following system
- ✅ Groups and membership
- ✅ Challenges with leaderboards
- ✅ Comments and supports (likes)
- ✅ Streaks tracking
- ⏳ Achievements (in progress)
- ⏳ Analytics (in progress)
