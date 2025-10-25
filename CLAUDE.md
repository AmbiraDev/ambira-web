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
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate test coverage report
```

### Firebase
```bash
npx firebase-tools deploy --only firestore:rules --non-interactive
# Deploy Firestore security rules (required after modifying firestore.rules)
```

## Architecture

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
import { Something } from '@/components/Something'
// Resolves to: src/components/Something
```

### Environment Variables

Firebase configuration required in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

## Testing

Jest configured with:
- Setup file: `jest.setup.js`
- Test environment: jsdom
- Coverage thresholds: 80% for branches, functions, lines, statements
- Path alias mapping: `@/*` → `src/*`

Run tests before commits. The project expects high test coverage.

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
