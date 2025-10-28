# Contributing to Ambira

Welcome! This guide will help you set up your development environment and start contributing to Ambira, a social productivity tracking application inspired by Strava.

## Table of Contents

- [Getting the Source Code](#getting-the-source-code)
- [Directory Structure](#directory-structure)
- [Building the Software](#building-the-software)
- [Testing the Software](#testing-the-software)
- [Adding New Tests](#adding-new-tests)
- [Building a Release](#building-a-release)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Architecture Deep Dive](#architecture-deep-dive)
  - [Clean Architecture with React Query](#clean-architecture-with-react-query)
  - [Migration from Context to React Query](#migration-from-context-to-react-query)
  - [React Query Best Practices](#react-query-best-practices)
- [Firebase Backend Architecture](#firebase-backend-architecture)
  - [Firebase Services Overview](#firebase-services-overview)
  - [Firestore Collections Structure](#firestore-collections-structure)
  - [Cloud Functions](#cloud-functions)
  - [Firestore Security Rules](#firestore-security-rules)
  - [Firebase Indexes](#firebase-indexes)
  - [Data Access Patterns](#data-access-patterns)
- [Additional Resources](#additional-resources)

---

## Getting the Source Code

### Main Repository

Clone the repository:

```bash
git clone https://github.com/your-org/ambira.git
cd ambira
```

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **npm** (this project uses npm exclusively - do not use Yarn or pnpm)
- **Git** for version control
- **Firebase CLI** for deploying Firestore rules: `npm install -g firebase-tools`

### Submodules and Multiple Repositories

All source code is contained in a single repository. There are no external submodules or dependencies requiring separate repository management.

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Configure Firebase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. (Optional) Configure Sentry for error tracking:
   ```
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   SENTRY_AUTH_TOKEN=your_auth_token
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Install Playwright browsers (for E2E tests):
   ```bash
   npx playwright install
   ```

---

## Directory Structure

Understanding the codebase organization:

```
ambira/
├── .github/
│   └── workflows/           # GitHub Actions CI/CD pipelines
│       ├── ci.yml          # Main CI workflow
│       └── playwright.yml  # Playwright E2E tests
│
├── src/                     # Application source code
│   ├── app/                # Next.js App Router pages
│   │   ├── about/
│   │   ├── activities/
│   │   ├── admin/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── challenges/
│   │   ├── feed/
│   │   ├── groups/
│   │   ├── login/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── search/
│   │   ├── sessions/
│   │   ├── settings/
│   │   ├── signup/
│   │   ├── timer/
│   │   ├── layout.tsx     # Root layout with providers
│   │   └── page.tsx       # Home page
│   │
│   ├── features/           # Feature modules (Clean Architecture)
│   │   ├── challenges/    # Challenge feature
│   │   │   ├── services/  # Business logic (no React dependencies)
│   │   │   ├── hooks/     # React Query boundary
│   │   │   └── README.md  # Feature documentation
│   │   ├── comments/
│   │   ├── feed/
│   │   ├── groups/
│   │   ├── profile/
│   │   ├── projects/
│   │   ├── search/
│   │   ├── sessions/
│   │   ├── settings/
│   │   ├── social/
│   │   ├── streaks/
│   │   └── timer/
│   │
│   ├── infrastructure/     # External integrations (Clean Architecture)
│   │   └── firebase/
│   │       ├── repositories/  # Data access layer
│   │       └── mappers/       # Data transformation
│   │
│   ├── domain/             # Core business entities
│   │   └── entities/
│   │
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI primitives (shadcn/ui)
│   │   ├── activity/
│   │   ├── analytics/
│   │   ├── header/
│   │   ├── landing/
│   │   └── timer/
│   │
│   ├── lib/                # Shared utilities and API layer
│   │   ├── api/           # API client functions
│   │   │   ├── achievements/
│   │   │   ├── auth/
│   │   │   ├── challenges/
│   │   │   ├── groups/
│   │   │   ├── projects/
│   │   │   ├── sessions/
│   │   │   ├── social/
│   │   │   └── shared/
│   │   ├── react-query/   # Query client configuration
│   │   ├── validation/    # Validation schemas
│   │   ├── onboarding/
│   │   ├── firebase.ts    # Firebase initialization
│   │   ├── cache.ts       # Caching utilities
│   │   └── errorHandler.ts # Error handling
│   │
│   ├── hooks/              # Global/shared hooks
│   ├── contexts/           # React Context providers (legacy)
│   ├── providers/          # Modern provider components
│   ├── config/             # Configuration files
│   ├── styles/             # Global styles
│   └── types/              # TypeScript type definitions
│
├── src/__tests__/           # Test suites (unit, integration, contract)
│   ├── unit/               # Unit tests (Jest)
│   │   ├── components/    # Component tests
│   │   │   ├── accessibility/
│   │   │   ├── analytics/
│   │   │   ├── auth/
│   │   │   └── session/
│   │   └── hooks/         # Hook tests
│   │
│   ├── integration/        # Integration tests (Jest + Testing Library)
│   │   ├── auth/
│   │   ├── firebase/
│   │   └── image-upload/
│   │
│   ├── contract/           # Contract tests (API/data validation)
│   │   └── api/
│   │
│   ├── helpers/            # Shared test utilities and mocks
│   │   └── firebaseMock.ts
│   │
│   └── fixtures/           # Test data fixtures
│       └── mocks.ts
│
├── e2e/                     # End-to-end tests (Playwright)
│   ├── smoke/              # Critical smoke tests
│   │   ├── auth.spec.ts
│   │   ├── feed.spec.ts
│   │   ├── protected-routes.spec.ts
│   │   └── timer.spec.ts
│   ├── fixtures/
│   └── utils/
│
├── docs/                    # Documentation
│   ├── architecture/
│   ├── testing/
│   └── PRODUCT_ROADMAP.md
│
├── public/                  # Static assets
│
├── firestore.rules          # Firestore security rules
├── .env.example             # Environment variable template
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Jest setup file
├── playwright.config.ts     # Playwright configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── CLAUDE.md                # AI assistant guidelines
├── CONTRIBUTING_DEV_DOCS.md # This file
└── README.md                # Project overview
```

### Key Directories Explained

**Clean Architecture Layers:**

Ambira follows a strict Clean Architecture pattern with React Query at feature boundaries:

```
Components (UI)
    ↓
Feature Hooks (React Query Boundary) ← ONLY place for useQuery/useMutation
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Firebase/Firestore
```

- **`src/features/`**: Feature modules following Clean Architecture principles. Each feature (sessions, challenges, groups, etc.) contains:
  - `hooks/` - **React Query boundary** (ONLY place for `useQuery`/`useMutation`)
  - `services/` - Pure business logic with **no React dependencies**
  - `domain/` - Business entities and domain rules (optional, for complex features)
  - `types/` - Feature-specific TypeScript types
  - This pattern keeps related code together and features completely isolated

- **`src/domain/`**: Core business entities and domain models. Pure TypeScript with no external dependencies.

- **`src/infrastructure/`**: External integrations and dependencies:
  - `firebase/repositories/` - Data access layer (Firebase operations)
  - `firebase/mappers/` - Transform between domain models and Firebase documents

**Critical Architecture Rules:**
- ✅ Components use feature hooks only
- ✅ Feature hooks are the ONLY place for React Query (`useQuery`, `useMutation`)
- ✅ Services contain pure business logic (no React dependencies)
- ✅ Repositories handle data access only
- ❌ Components should NEVER use `useQuery`/`useMutation` directly
- ❌ Components should NEVER call `firebaseApi` directly
- ❌ Services should NEVER import React or hooks

**Application Layers:**

- **`src/app/`**: Next.js 15 App Router pages. Each folder represents a route.

- **`src/components/`**: Presentational React components organized by area (ui, activity, analytics, header, landing, timer).

- **`src/lib/`**: Shared utilities and configuration:
  - `react-query/` - Query client configuration and React Query provider
  - `validation/` - Validation schemas (Zod)
  - Utility files: `firebase.ts`, `cache.ts`, `errorHandler.ts`
  - **Note**: `api/` directory is deprecated - use feature-based services instead

- **`src/hooks/`**: Global/shared React hooks used across multiple features (minimal usage preferred).

- **`src/contexts/`**: React Context providers (being phased out in favor of React Query):
  - `AuthContext` - Authentication state (migration in progress)
  - `TimerContext` - Active timer state (migration in progress)
  - `ToastContext` - UI notifications (may remain as UI-only concern)

- **`src/providers/`**: React Query and other provider components.

- **`src/types/`**: TypeScript type definitions shared across the application.

**Testing:**

- **`src/__tests__/`**: Unit, integration, and contract tests (Jest):
  - `unit/` - Isolated component and hook tests
  - `integration/` - Multi-module flow tests
  - `contract/` - API/data validation tests
  - `helpers/` - Test mocks and utilities
  - `fixtures/` - Test data

- **`e2e/`**: End-to-end tests (Playwright):
  - `smoke/` - Critical user journey tests
  - `fixtures/` - E2E test data
  - `utils/` - E2E helpers

**Documentation:**

- **`docs/`**: Project documentation including architecture guides, testing documentation, and product roadmap.

---

## Building the Software

### Development Build

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

Build the application for production:

```bash
npm run build
```

This command:
1. Runs TypeScript compilation
2. Bundles the application with Next.js
3. Optimizes assets for production
4. Generates static files in `.next/` directory

**Note**: The build process has `ignoreDuringBuilds: true` for both ESLint and TypeScript to allow builds to complete even with warnings. Always run `npm run lint` and `npm run type-check` locally before committing.

### Start Production Server

After building, start the production server:

```bash
npm run start
```

### All Build Commands

```bash
npm run dev              # Development server (hot reload)
npm run build            # Production build
npm run start            # Production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes
npm run type-check       # TypeScript type checking
```

### Firebase Deployment

Deploy Firestore security rules (required after modifying `firestore.rules`):

```bash
npx firebase-tools deploy --only firestore:rules --non-interactive
```

**Important**: Always deploy updated Firestore rules immediately after modifying them to keep your local rules in sync with production.

---

## Testing the Software

### Coverage Scope

We'll cover every production-critical feature: authentication/onboarding; session logging and the timer; feed interactions (filters, support, comments); social graph (follow/unfollow, suggestions); projects/activities; groups; challenges; analytics dashboards; notifications; search & discovery; profile/settings management; media upload; and the PWA install experience. These areas are the core of Ambira's functionality, so keeping each under automated guardrails gives us confidence that new releases won't break essential workflows.

## Unit Testing (Jest, src/__tests__/unit/ and src/__tests__/helpers/)

We'll use unit tests to isolate business logic, utilities, and providers. We'll use lightweight manual mocks (src/__tests__/helpers/) to drive deterministic tests. Unit tests can be run via npm run test -- src/__tests__/unit, which keeps feedback fast and catches regressions at the logic layer.

Representative suites include components/session/SessionTimer.test.tsx tests session timer behavior; components/auth/LoginForm.test.tsx asserts auth state transitions; components/accessibility/keyboard-navigation.test.tsx cover keyboard navigation patterns.

## Integration Testing (Jest, src/__tests__/integration/)

These scenarios span multiple modules without needing a full browser. Using @testing-library/react in conjunction with Jest, as well as mocked Firebase backends, we'll verify seams such as authentication flows, Firebase service integration, and cross-context coordination. Executed with npm run test -- src/__tests__/integration, they ensure feature wiring and side effects behave correctly before we reach usability checks.

Representative suites include auth/ integration tests; firebase/ service integration tests; and image-upload/ flow tests; each focused on one cross-cutting flow.

## Usability (Playwright, e2e/)

We'll use Playwright for web to validate user journeys and accessibility. Commands run through npx playwright test. GitHub Actions will treat failures as gating events so UI regressions never ship.

Representative suites like smoke/auth.spec.ts, smoke/feed.spec.ts, smoke/timer.spec.ts, and smoke/protected-routes.spec.ts cover UI and navigational concerns with accessibility compliance built in.

## CI Service

We will be using **GitHub Actions** as our CI service of choice. Each GitHub repository has a hidden `.github/workflows/` folder. Any YAML file you put there defines a workflow. When you push that file to your repo, GitHub automatically detects it and sets up the automation pipeline.

## Which Tests are Executed in a CI Build?

- Build, typecheck, and lint
- All unit tests
- All integration tests
- E2E smoke (most important tests outlining core flows)
- Collect artifacts (Playwright traces/screens, Detox logs/videos)

## Which Development Actions Trigger a CI Build?

A CI Build will be triggered with:

- Pushing new commits to a branch
- Opening a pull request
- Merging a pull request
- Creating or updating a release
- Manual Trigger (hotfixes)

---

## Adding Tests to the Codebase

This repository uses a three-layer testing strategy shared across both web and mobile:

- **Unit (Jest):** src/__tests__/unit/
- **Integration (Jest + React/React Native Testing Library):** src/__tests__/integration/
- **End-to-End (Playwright/Detox):** e2e/

Shared mocks live in src/__tests__/helpers/.

### 0. Pick the Right Layer

- **Unit:** Tests isolated logic (functions, utilities, hooks).
- **Integration:** Tests multiple modules or contexts together with mocked Firebase backends.
- **E2E:** Tests complete user journeys in a real browser (Playwright) or device (Detox).

### 1. File Location and Naming

Place the new test file under the appropriate folder:

- src/__tests__/unit/…
- src/__tests__/integration/…
- e2e/…

Name the file descriptively and group by feature (for example, feed/comment-flow.test.ts).

### 2. Common Test Utilities and Mocks

- Centralized mocks exist in src/__tests__/helpers/ for Firebase, Next.js routing, and React Query.
- Always prefer local, deterministic mocks over global automocking.
- When adding new mocks, ensure they're reusable and versioned alongside the test.

### 3. Adding a Unit Test

- Create the test under src/__tests__/unit/.
- Focus on small, self-contained pieces of logic.
- Avoid DOM rendering, network calls, or complex providers.
- Run tests locally using the unit test command defined in package.json.

### 4. Adding an Integration Test

- Use Testing Library (react for web, react-native for mobile).
- Mock Firebase and wrap components in the appropriate providers.
- Verify state transitions, side effects, and UI updates.
- Keep each test focused on one cross-cutting flow.

### 5. Adding a Web E2E Test (Playwright)

- Create a .spec.ts file under e2e/.
- Use storage state or emulator data for authentication.
- Prefer data-testids or role-based selectors.
- Record traces on failure and organize shared helpers in e2e/pages/.
- Run locally using the Playwright command or UI mode.

### 6. Adding a Mobile E2E Test (Detox)

- Ensure all interactive elements have testID props.
- Place tests under e2e/.
- Use Detox's synchronization with the React Native runtime to avoid arbitrary timeouts.
- Run locally using the Detox configuration for your platform (iOS or Android).
- Avoid brittle selectors or assumptions about animation timing.

### 7. Test Data and Firebase

- Use mocks for unit and integration tests.
- Use the Firebase Emulator Suite or local seeded data for E2E tests.
- Keep reusable test fixtures in src/__tests__/fixtures/.
- When adding new fixtures, ensure they mirror real API shapes.

### 8. Conventions

- **Selectors:** Use data-testid for web and testID for mobile.
- **Naming:** .test.ts for unit/integration, .spec.ts for E2E.
- **Snapshots:** Use sparingly; avoid for dynamic UI.
- **Assertions:** Each test should verify one key behavior.

### 9. Run Commands

- **Unit**: npm run test -- src/__tests__/unit
- **Integration:** npm run test -- src/__tests__/integration
- **Web E2E:** npx playwright test
- **Mobile E2E:** npx detox test

### Test Naming Conventions

**Describe blocks**: Feature or component name
```typescript
describe('Session Timer', () => { ... });
```

**Test cases**: User-facing behavior in plain English
```typescript
it('starts timer when user clicks start button', async () => { ... });
it('pauses timer and saves elapsed time', async () => { ... });
```

**Avoid implementation details**:
❌ `it('calls startTimer() with correct params', ...)`
✅ `it('starts timer when user clicks start button', ...)`

### Shared Test Utilities

Reuse test helpers to keep tests DRY:

```typescript
// tests/utils/test-helpers.ts
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <ProjectsProvider>
        {ui}
      </ProjectsProvider>
    </AuthProvider>
  );
}

export async function loginTestUser(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/');
}
```

### Test Coverage Requirements

Jest is configured with coverage thresholds:

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

View coverage report:
```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

---

## Building a Release

### Pre-Release Checklist

Before building a release, complete these steps:

1. **Update Version Number**

   Edit `package.json`:
   ```json
   {
     "version": "1.2.0"
   }
   ```

   Follow [Semantic Versioning](https://semver.org/):
   - **MAJOR**: Breaking changes
   - **MINOR**: New features (backwards-compatible)
   - **PATCH**: Bug fixes

2. **Update Documentation**

   - Update `CHANGELOG.md` with release notes
   - Update `README.md` if features changed
   - Update `docs/` if architecture changed

3. **Run Full Test Suite**

   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run test:e2e
   ```

   All tests must pass before proceeding.

4. **Deploy Firestore Rules**

   If `firestore.rules` changed:
   ```bash
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```

5. **Create Production Build**

   ```bash
   npm run build
   ```

   Verify no build errors or warnings.

6. **Sanity Check Production Build**

   Start production server locally:
   ```bash
   npm run start
   ```

   Manually verify:
   - [ ] Homepage loads correctly
   - [ ] Login/signup flow works
   - [ ] Feed displays sessions
   - [ ] Timer starts and stops
   - [ ] No console errors
   - [ ] All critical paths functional

7. **Commit Version Changes**

   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 1.2.0"
   ```

8. **Create Git Tag**

   ```bash
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```

9. **Push to Main Branch**

   ```bash
   git push origin main
   ```

### Automated Release Tasks

GitHub Actions automatically handles:

1. **CI Pipeline** (`.github/workflows/ci.yml`):
   - Lint, type-check, test
   - Build production bundle
   - Run E2E smoke tests
   - Upload test artifacts

2. **Deployment** (`.github/workflows/deploy.yml`):
   - Deploy to Vercel/production environment
   - Deploy Firestore rules
   - Upload source maps to Sentry (if configured)

### Manual Deployment Tasks

If not using automated deployment:

1. **Deploy to Hosting**

   Vercel:
   ```bash
   vercel --prod
   ```

   Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

2. **Deploy Firestore Rules**

   ```bash
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```

3. **Upload Source Maps to Sentry**

   If Sentry is configured:
   ```bash
   # Automatically handled by Sentry webpack plugin in next.config.ts
   # Requires SENTRY_AUTH_TOKEN environment variable
   ```

### Post-Release Verification

After deployment:

1. **Smoke Test Production**

   Run critical E2E tests against production:
   ```bash
   # Update playwright.config.ts to use production URL
   npx playwright test tests/e2e/smoke/
   ```

2. **Monitor Error Tracking**

   Check Sentry dashboard for new errors:
   - [Sentry Dashboard](https://sentry.io)

3. **Verify Firestore Rules**

   Test security rules in Firebase Console:
   - Try unauthorized access patterns
   - Verify rate limiting works

4. **Announce Release**

   - Update team in Slack/Discord
   - Post release notes to users
   - Update project management board

### Rollback Procedure

If critical issues are found post-release:

1. **Revert to Previous Version**

   Vercel:
   ```bash
   # Rollback in Vercel dashboard or CLI
   vercel rollback
   ```

   Firebase:
   ```bash
   # Deploy previous version
   git checkout v1.1.0
   firebase deploy --only hosting
   ```

2. **Revert Firestore Rules**

   ```bash
   git checkout v1.1.0
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```

3. **Communicate Rollback**

   - Notify team immediately
   - Post status update to users
   - Create hotfix branch to address issue

---

## Development Workflow

### Branch Strategy

Our repository follows a structured branching model to maintain code quality and prevent accidental deployments:

- **`main`**: Only for deployment. **DO NOT COMMIT TO main.** All changes must go through pull requests.

- **`develop`**: Source of develop is main. Create `feature/` or `bug-fix/` branches from here. Used to review merge requests from lower branches.

- **`feature/`**: Source of feature/ branches should be develop. Branches with naming convention `feature/<name>` are for developing individual features.

- **`bug-fix/`**: Source of bug-fix/ branches should be develop. Branches with naming convention `bug-fix/<name>` are for fixing bugs on pre-existing features. This means that ideally we should never need bug-fix/ branches as bugs are fixed in their initial feature/ branch and don't make it to main.

**Branch Flow:**
```
develop → feature/add-notifications → develop → main
develop → bug-fix/timer-issue → develop → main
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(challenges): add leaderboard sorting

Implemented ascending/descending sort for challenge leaderboards
with persistence in URL query params.

Closes #123
```

```
fix(timer): prevent duplicate timers in header

Fixed issue where active timer displayed twice when on /timer page.
Now shows "Active" label instead of duplicate countdown.

Fixes #456
```

### Pull Request Process

1. **Create Feature Branch from develop**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/add-notifications
   ```

2. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "feat(notifications): add real-time notification system"
   ```

3. **Run Tests Locally**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run test:e2e
   ```

4. **Push Branch**
   ```bash
   git push origin feature/add-notifications
   ```

5. **Open Pull Request to develop**
   - **Base branch**: `develop` (not `main`!)
   - Title: Clear, descriptive summary
   - Description: What changed and why
   - Link related issues
   - Add screenshots for UI changes

6. **CI Checks**
   - Wait for GitHub Actions to pass
   - Fix any failing tests
   - Address linting/type errors

7. **Code Review**
   - Respond to reviewer feedback
   - Make requested changes
   - Push updates to same branch

8. **Merge to develop**
   - Squash commits if needed
   - Merge to `develop`
   - Delete feature branch

9. **Deploy to main (Production)**
   - When `develop` is stable and ready for production
   - Create PR from `develop` to `main`
   - After approval, merge to `main`
   - Production deployment triggers automatically

### Code Review Guidelines

**For Authors**:
- Keep PRs focused and small (<400 lines)
- Write clear commit messages
- Add tests for new features
- Update documentation
- Respond promptly to feedback

**For Reviewers**:
- Review within 24 hours
- Check code quality and architecture
- Verify tests cover new code
- Test locally if UI changes
- Be constructive and kind

---

## Code Quality Standards

### TypeScript

- **Strict Mode Enabled**: No implicit `any`, strict null checks
- **Type Definitions**: All functions, props, and state must be typed
- **Path Aliases**: Use `@/` imports (e.g., `import { User } from '@/types'`)
- **No `undefined` in Firestore**: Strip undefined values before writes

### Linting and Formatting

**ESLint**:
```bash
npm run lint         # Check for errors
npm run lint:fix     # Auto-fix errors
```

**Prettier**:
```bash
npm run format       # Format all files
npm run format:check # Check formatting
```

**Run Before Commits**:
```bash
npm run lint && npm run format && npm run type-check
```

### Component Patterns

**Functional Components**:
```typescript
import { FC } from 'react';

interface Props {
  title: string;
  onSubmit: () => void;
}

export const MyComponent: FC<Props> = ({ title, onSubmit }) => {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onSubmit}>Submit</button>
    </div>
  );
};
```

**Custom Hooks**:
```typescript
export function useSessionSupport(sessionId: string) {
  const [isSupported, setIsSupported] = useState(false);

  // Hook logic...

  return { isSupported, toggleSupport };
}
```

**Service Functions**:
```typescript
export async function createSession(data: SessionData): Promise<Session> {
  // Validate and strip undefined
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  // Firestore operation
  const docRef = await addDoc(collection(db, 'sessions'), cleanData);
  return { id: docRef.id, ...cleanData };
}
```

### Firestore Best Practices

1. **Strip Undefined Values**
   ```typescript
   const cleanData = Object.fromEntries(
     Object.entries(data).filter(([_, v]) => v !== undefined)
   );
   ```

2. **Use Batched Updates**
   ```typescript
   const batch = writeBatch(db);
   batch.update(userRef, { followerCount: increment(1) });
   batch.update(targetRef, { followingCount: increment(1) });
   await batch.commit();
   ```

3. **Always Deploy Rules**
   ```bash
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```

### Accessibility

- Use semantic HTML elements
- Add `aria-label` for icon-only buttons
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios (WCAG AA)

### Performance

- Use React Query for data caching
- Lazy load images with Next.js `<Image>`
- Code split with dynamic imports
- Minimize Firestore reads with pagination
- Optimize bundle size with `next/bundle-analyzer`

### Component Architecture

Ambira has **115+ components** organized by feature and responsibility:

**Feature Components:**
- **Session Management (10)**: Timer interface, session cards, stats, history, editing
- **Social Feed (8)**: Feed display, filtering, infinite scroll, session carousels
- **User Profiles (8)**: Profile display, stats, tabs, editing, user search
- **Analytics (10)**: Charts, heatmaps, progress rings, comparative views
- **Groups & Challenges (11)**: Group/challenge management, leaderboards, progress tracking
- **Projects/Activities (6)**: CRUD operations, analytics, progress tracking
- **Gamification (6)**: Streaks, achievements, trophy case, notifications
- **Layout & Navigation (6)**: Three-column desktop layout, responsive mobile nav

**UI Primitives (shadcn/ui):**
- Located in `src/components/ui/`
- Built on Radix UI primitives
- Styled with Tailwind CSS v4
- Includes: card, button, input, dialog, dropdown, tabs, etc.

### State Management Patterns

**1. Server State (React Query)**
- All data fetching and caching
- Sessions, users, groups, challenges, comments
- Managed through feature hooks
- Automatic background refetching
- Optimistic updates for mutations

**2. UI State (Local Component State)**
- Form inputs, modal visibility, tabs
- Managed with `useState`, `useReducer`
- Stays in components, not global

**3. Global UI State (React Context - Minimal)**
- `AuthContext`: User authentication state
- `TimerContext`: Active timer state (cross-page persistence)
- `ToastContext`: Toast notifications
- Being phased out in favor of React Query where possible

**Data Flow:**
```
User Action → Component → Feature Hook → Service → Repository → Firebase
                            ↓ (React Query caches)
Component ← Feature Hook ← Service ← Repository ← Firebase
```

**Key Principles:**
- Unidirectional data flow
- Type-safe at every layer
- No direct Firebase access from components
- Server state separate from UI state

### Routing (40+ routes)

**Core Routes:**
- `/` - Home/Feed
- `/timer` - Active session timer
- `/sessions/[id]` - Session details
- `/profile/[username]` - User profiles
- `/analytics` - User analytics dashboard

**Social Routes:**
- `/feed` - Following feed
- `/groups` - Groups directory
- `/groups/[id]` - Group details
- `/challenges` - Challenges directory
- `/challenges/[id]` - Challenge details

**Activity Management:**
- `/activities` - Activities/projects list
- `/activities/[id]` - Activity details
- `/record-manual` - Manual session entry

**Utility Routes:**
- `/search` - Global search
- `/discover` - Discover users and groups
- `/notifications` - Notification center
- `/settings/*` - User settings pages

**Auth Routes:**
- `/login` - User login
- `/signup` - User registration
- `/auth` - OAuth callbacks

---

## Architecture Deep Dive

### Clean Architecture with React Query

Ambira uses a **Clean Architecture** pattern with **React Query at feature boundaries**. This provides clear separation of concerns and makes code more testable and maintainable.

#### The Four Layers

```
┌─────────────────────────────────────────────────────────────┐
│  1. Components (Presentation)                                │
│     - Pure presentation logic                                │
│     - Use feature hooks only                                 │
│     - No direct firebaseApi calls                            │
│     - No direct React Query usage                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Feature Hooks (React Query Boundary) ★                   │
│     - ONLY place for useQuery/useMutation                    │
│     - Cache key management                                   │
│     - Optimistic updates                                     │
│     - Cache invalidation                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Services (Business Logic)                                │
│     - Pure business logic (no React dependencies)            │
│     - Orchestrates repositories                              │
│     - Domain service coordination                            │
│     - Testable without React                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Repositories (Data Access)                               │
│     - Firebase/Firestore operations                          │
│     - Data transformation                                    │
│     - No business logic                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Feature Organization Example

```
src/features/groups/
├── domain/                     # Optional: Complex domain logic
│   └── LeaderboardCalculator.ts
├── hooks/                      # React Query boundary
│   ├── useGroups.ts           # Query hooks
│   ├── useGroupMutations.ts   # Mutation hooks
│   └── index.ts               # Public exports
├── services/                   # Business logic
│   └── GroupService.ts
├── types/                      # Feature-specific types
│   └── groups.types.ts
└── README.md                   # Feature documentation
```

#### Implementation Example

**1. Component (Presentation Layer)**
```typescript
// src/app/groups/[id]/page.tsx
'use client';

import { useGroupDetails, useJoinGroup } from '@/features/groups/hooks';

export default function GroupPage({ params }: { params: { id: string } }) {
  const { data: group, isLoading, error } = useGroupDetails(params.id);
  const joinMutation = useJoinGroup();

  const handleJoin = () => {
    joinMutation.mutate({ groupId: params.id, userId: currentUser.id });
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <div>{/* Presentation only */}</div>;
}
```

**2. Feature Hook (React Query Boundary)**
```typescript
// src/features/groups/hooks/useGroups.ts
import { useQuery } from '@tanstack/react-query';
import { GroupService } from '../services/GroupService';

const groupService = new GroupService();

export const GROUPS_KEYS = {
  all: () => ['groups'] as const,
  detail: (id: string) => [...GROUPS_KEYS.all(), 'detail', id] as const,
};

export function useGroupDetails(groupId: string) {
  return useQuery({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: () => groupService.getGroupDetails(groupId),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
```

**3. Service (Business Logic Layer)**
```typescript
// src/features/groups/services/GroupService.ts
import { GroupRepository } from '@/infrastructure/firebase/repositories/GroupRepository';

export class GroupService {
  private readonly groupRepo: GroupRepository;

  constructor() {
    this.groupRepo = new GroupRepository();
  }

  async getGroupDetails(groupId: string): Promise<Group | null> {
    return this.groupRepo.findById(groupId);
  }

  async joinGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.groupRepo.findById(groupId);

    // Business rules
    if (!group) throw new Error('Group not found');
    if (group.isMember(userId)) throw new Error('Already a member');

    await this.groupRepo.save(group.withAddedMember(userId));
  }
}
```

**4. Repository (Data Access Layer)**
```typescript
// src/infrastructure/firebase/repositories/GroupRepository.ts
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class GroupRepository {
  async findById(groupId: string): Promise<Group | null> {
    const docRef = doc(db, 'groups', groupId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? this.mapToEntity(docSnap.data()) : null;
  }

  async save(group: Group): Promise<void> {
    const docRef = doc(db, 'groups', group.id);
    await updateDoc(docRef, { /* data */ });
  }
}
```

### Benefits of This Architecture

1. **Clear Separation of Concerns**
   - Each layer has a single responsibility
   - Easy to understand where code belongs
   - Changes isolated to appropriate layer

2. **Better Testability**
   - Services: Test business logic without React
   - Hooks: Test with React Testing Library
   - Components: Test with mocked hooks
   - Repositories: Test with mocked Firebase

3. **Type Safety**
   - End-to-end type safety from database to UI
   - Services define contracts
   - Hooks ensure consistency
   - Components get typed data

4. **Performance**
   - Centralized cache management per feature
   - Consistent cache keys enable efficient invalidation
   - Optimistic updates for instant feedback

5. **Maintainability**
   - Features are self-contained
   - Easy to add/modify features
   - Minimal coupling between features

### Migration from Context to React Query

The codebase is actively migrating from React Context providers to React Query:

**Current State:**
- ✅ **Groups**: Fully migrated (reference implementation)
- ✅ **Feed**: Service layer complete, hooks migrated
- ✅ **Profile**: Service layer complete, hooks migrated
- 🔄 **Timer**: Service exists, migration in progress
- 🔄 **Auth**: Migration in progress (high priority)
- ⏳ **Sessions, Comments, Projects**: Planned

**Being Phased Out:**
- `NotificationsContext` - React Query hooks available
- `ActivitiesContext` - React Query hooks available
- `TimerContext` - Migration in progress
- `AuthContext` - Migration in progress

**May Remain (UI-only concerns):**
- `ToastContext` - Simple UI state, not server data

See [Context Elimination Strategy](./docs/architecture/CONTEXT_ELIMINATION_STRATEGY.md) for detailed migration plan.

### React Query Best Practices

1. **Cache Keys** - Use hierarchical keys for efficient invalidation:
```typescript
const GROUPS_KEYS = {
  all: () => ['groups'] as const,
  lists: () => [...GROUPS_KEYS.all(), 'list'] as const,
  detail: (id: string) => [...GROUPS_KEYS.all(), 'detail', id] as const,
};
```

2. **Optimistic Updates** - Update UI immediately, rollback on error:
```typescript
onMutate: async ({ groupId, userId }) => {
  await queryClient.cancelQueries({ queryKey: GROUPS_KEYS.detail(groupId) });
  const previous = queryClient.getQueryData(GROUPS_KEYS.detail(groupId));
  queryClient.setQueryData(GROUPS_KEYS.detail(groupId), (old) => ({
    ...old,
    memberIds: [...old.memberIds, userId],
  }));
  return { previous };
},
onError: (_, { groupId }, context) => {
  queryClient.setQueryData(GROUPS_KEYS.detail(groupId), context?.previous);
},
```

3. **Stale Times** - Configure based on data freshness needs:
```typescript
const CACHE_TIMES = {
  REAL_TIME: 30 * 1000,       // 30s - Real-time data
  SHORT: 1 * 60 * 1000,       // 1m  - Feed, search
  MEDIUM: 5 * 60 * 1000,      // 5m  - Sessions, comments
  LONG: 15 * 60 * 1000,       // 15m - Profiles, groups
  VERY_LONG: 60 * 60 * 1000,  // 1h  - Stats, analytics
};
```

For comprehensive architecture documentation, see:
- [Architecture Overview](./docs/architecture/README.md)
- [Caching Strategy](./docs/architecture/CACHING_STRATEGY.md)
- [Complete Examples](./docs/architecture/EXAMPLES.md)
- [Migration Guide](./docs/architecture/MIGRATION_GUIDE.md)

---

## Firebase Backend Architecture

Ambira uses Firebase as its backend platform, providing authentication, database, storage, and serverless functions.

### Firebase Services Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Firebase Authentication                                     │
│  - Email/password and Google OAuth                          │
│  - Token-based identity management                          │
│  - Session lifecycle management                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloud Firestore (Database)                                 │
│  - Real-time data synchronization                           │
│  - Structured collections (users, sessions, groups, etc.)   │
│  - Complex queries and indexing                             │
│  - Security rules for access control                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Firebase Storage                                            │
│  - User profile images                                       │
│  - Session attachments                                       │
│  - File processing triggers                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloud Functions (Serverless)                               │
│  - Background tasks and automation                          │
│  - Firestore/Auth/Storage triggers                          │
│  - Scheduled tasks (streaks, leaderboards)                  │
│  - Business logic not suited for client                     │
└─────────────────────────────────────────────────────────────┘
```

### Firestore Collections Structure

**Core Collections:**

1. **`users/{userId}`** - User profiles
   ```typescript
   {
     username: string;
     email: string;
     photoUrl: string;
     bio: string;
     streakCount: number;
     followersCount: number;
     followingCount: number;
     profileVisibility: 'everyone' | 'followers' | 'private';
     activityVisibility: 'everyone' | 'followers' | 'private';
     createdAt: timestamp;
   }
   ```

2. **`sessions/{sessionId}`** - Work sessions (primary content)
   ```typescript
   {
     userId: string;
     projectId: string;
     activityId: string;
     duration: number; // minutes
     startTime: timestamp;
     endTime: timestamp;
     visibility: 'everyone' | 'followers' | 'private';
     supportCount: number;
     commentCount: number;
     tags: string[];
     createdAt: timestamp;
   }
   ```

3. **`projects/{userId}/userProjects/{projectId}`** - User projects
   ```typescript
   {
     name: string;
     description: string;
     activityId: string;
     totalTime: number;
     sessionCount: number;
     createdAt: timestamp;
   }
   ```

4. **`groups/{groupId}`** - Social groups
   ```typescript
   {
     name: string;
     description: string;
     category: string;
     privacy: 'public' | 'approval-required';
     ownerId: string;
     memberIds: string[];
     adminIds: string[];
     createdAt: timestamp;
   }
   ```

5. **`challenges/{challengeId}`** - Challenges
   ```typescript
   {
     name: string;
     description: string;
     type: 'most-activity' | 'fastest-effort' | 'longest-session' | 'group-goal';
     startDate: timestamp;
     endDate: timestamp;
     groupId?: string; // Optional: group-specific challenge
     createdAt: timestamp;
   }
   ```

6. **`follows/{followId}`** - Follow relationships
   ```typescript
   {
     followerId: string;
     followingId: string;
     createdAt: timestamp;
   }
   // Document ID format: {followerId}_{followingId}
   ```

7. **`comments/{commentId}`** - Session comments
   ```typescript
   {
     sessionId: string;
     userId: string;
     content: string;
     createdAt: timestamp;
   }
   ```

8. **`streaks/{userId}`** - User streaks
   ```typescript
   {
     currentStreak: number;
     longestStreak: number;
     lastActiveDate: timestamp;
     visibility: 'public' | 'private';
   }
   ```

**Subcollections:**

- **`users/{userId}/activeSession`** - Timer persistence
- **`challengeParticipants/{participantId}`** - Challenge participation
- **`notifications/{userId}/userNotifications/{notificationId}`** - User notifications

### Cloud Functions

**Function Modules:**

1. **Authentication Module**
   - `onUserCreate.ts` - Initialize user profile on signup
   - `onUserDelete.ts` - Cascade deletion of user data

2. **Activities/Feed Module**
   - `onActivityCreate.ts` - Update user streaks, push to feed
   - `onActivityDelete.ts` - Update counts and stats
   - `updateActivityStats.ts` - Recalculate activity statistics

3. **Comments Module**
   - `onCommentCreate.ts` - Increment session comment count
   - `onCommentDelete.ts` - Decrement session comment count

4. **Follows Module**
   - `toggleFollow.ts` - Callable function for follow/unfollow
   - `onFollowCreate.ts` - Update follower/following counts
   - `onFollowDelete.ts` - Update counts, remove from feed

5. **Groups & Leaderboards Module**
   - `updateLeaderboard.ts` - Scheduled leaderboard calculation
   - `onGroupActivity.ts` - Update group stats on member activity

6. **Storage & File Processing**
   - `onFileUpload.ts` - Process uploaded images
   - `parsePdf.ts` - Extract metadata from PDFs (if applicable)

7. **Notifications Module**
   - `onActivityCreate.ts` - Notify followers of new sessions
   - `onCommentCreate.ts` - Notify session owner
   - `onFollowCreate.ts` - Notify user of new follower

8. **Analytics & Streaks Module**
   - `updateStreaks.ts` - Scheduled streak recalculation
   - `updateUserStats.ts` - Aggregate user statistics

**Function Triggers:**

```typescript
// Firestore Triggers
onCreate('users/{userId}')        → Initialize user profile
onCreate('sessions/{sessionId}')  → Update streaks, notify followers
onCreate('comments/{commentId}')  → Increment count, notify owner
onCreate('follows/{followId}')    → Update counts, notify user

// Storage Triggers
onFinalize('uploads/{userId}/{activityId}/{filename}')
  → Process image, extract metadata

// Scheduled Functions
schedule('every 24 hours')        → Recalculate streaks
schedule('every 1 hour')          → Update leaderboards

// Callable Functions
toggleFollow(targetUserId)        → Follow/unfollow user
updateLeaderboard(groupId)        → Manually trigger leaderboard update
```

### Firestore Security Rules

Located in `firestore.rules`. Key security patterns:

**Read Rules:**
```javascript
// Users can read profiles based on visibility
match /users/{userId} {
  allow read: if isAuthenticated() &&
    (resource.data.profileVisibility == 'everyone' ||
     (resource.data.profileVisibility == 'followers' && isFollower(userId)) ||
     request.auth.uid == userId);
}

// Sessions visible based on visibility field
match /sessions/{sessionId} {
  allow read: if isAuthenticated() &&
    (resource.data.visibility == 'everyone' ||
     (resource.data.visibility == 'followers' && isFollower(resource.data.userId)) ||
     request.auth.uid == resource.data.userId);
}
```

**Write Rules:**
```javascript
// Users can only update their own profile
match /users/{userId} {
  allow update: if request.auth.uid == userId &&
    !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['followersCount', 'followingCount']); // Prevent manual count manipulation
}

// Only session owner can update/delete
match /sessions/{sessionId} {
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
  allow update, delete: if request.auth.uid == resource.data.userId;
}

// Follow counts can be updated by any authenticated user (safe due to increment-only)
match /follows/{followId} {
  allow create, delete: if isAuthenticated();
}
```

**After modifying security rules, always deploy:**
```bash
npx firebase-tools deploy --only firestore:rules --non-interactive
```

### Firebase Indexes

**Required Composite Indexes:**

1. **Sessions - Following Feed**
   - Collection: `sessions`
   - Fields: `visibility` (Ascending), `createdAt` (Descending)
   - Purpose: Fetch feed sessions filtered by visibility

2. **Sessions - Trending Feed**
   - Collection: `sessions`
   - Fields: `visibility` (Ascending), `supportCount` (Descending), `createdAt` (Descending)
   - Purpose: Fetch trending sessions

3. **Sessions - User Sessions**
   - Collection: `sessions`
   - Fields: `userId` (Ascending), `createdAt` (Descending)
   - Purpose: Fetch user's session history

4. **Comments - Session Comments**
   - Collection: `comments`
   - Fields: `sessionId` (Ascending), `createdAt` (Descending)
   - Purpose: Fetch comments for a session

**Indexes auto-suggest on first query.** Create them in the Firebase Console when prompted.

### Data Access Patterns

**1. Repository Pattern**
All Firebase operations go through repositories in `src/infrastructure/firebase/repositories/`:

```typescript
// UserRepository.ts
export class UserRepository {
  async findById(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? this.mapToEntity(docSnap.data()) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : this.mapToEntity(snapshot.docs[0].data());
  }
}
```

**2. Batch Operations**
Use batched writes for atomic multi-document updates:

```typescript
const batch = writeBatch(db);
batch.update(userRef, { followerCount: increment(1) });
batch.update(targetRef, { followingCount: increment(1) });
await batch.commit();
```

**3. Optimistic Updates**
Update UI immediately, sync with Firebase, rollback on error:

```typescript
// Handled in React Query mutation hooks
onMutate: async ({ groupId, userId }) => {
  // 1. Cancel queries
  await queryClient.cancelQueries({ queryKey: GROUPS_KEYS.detail(groupId) });

  // 2. Snapshot previous state
  const previous = queryClient.getQueryData(GROUPS_KEYS.detail(groupId));

  // 3. Optimistically update cache
  queryClient.setQueryData(GROUPS_KEYS.detail(groupId), (old) => ({
    ...old,
    memberIds: [...old.memberIds, userId],
  }));

  return { previous };
},
onError: (_, { groupId }, context) => {
  // 4. Rollback on error
  queryClient.setQueryData(GROUPS_KEYS.detail(groupId), context?.previous);
},
```

### Best Practices

1. **Strip Undefined Values**
   ```typescript
   const cleanData = Object.fromEntries(
     Object.entries(data).filter(([_, v]) => v !== undefined)
   );
   ```

2. **Use Increment for Counts**
   ```typescript
   await updateDoc(docRef, { followerCount: increment(1) });
   ```

3. **Implement Pagination**
   ```typescript
   const q = query(
     collection(db, 'sessions'),
     orderBy('createdAt', 'desc'),
     limit(20),
     startAfter(lastDoc) // For next page
   );
   ```

4. **Deploy Rules After Changes**
   ```bash
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```

5. **Test Security Rules**
   Use Firebase Emulator Suite for local testing:
   ```bash
   firebase emulators:start
   ```

---

## Additional Resources

### Documentation

- [Architecture Documentation](./docs/architecture/README.md)
- [Testing Guide](./docs/testing/README.md)
- [Caching Strategy](./docs/architecture/CACHING_STRATEGY.md)
- [Context Elimination Strategy](./docs/architecture/CONTEXT_ELIMINATION_STRATEGY.md)
- [Product Roadmap](./docs/PRODUCT_ROADMAP.md)

### External Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Team Chat**: Discord for quick questions
- **Code Reviews**: Learn from feedback on PRs

---

Thank you for contributing to Ambira! Ambirian nation rise up! 🚀
