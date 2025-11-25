# Contributing to Ambira

Thank you for your interest in contributing to Ambira! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Code Review Process](#code-review-process)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](../CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior through GitHub issues or by contacting the project maintainers.

We expect all contributors to:

- Be respectful and constructive in discussions
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: This project uses npm exclusively (not Yarn or pnpm)
- **Git**: For version control
- **Firebase Account**: For backend services (see [Firebase Setup](#firebase-setup))

### First-Time Setup

1. **Fork and Clone**:

   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/ambira.git
   cd ambira
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Environment Configuration**:

   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```

4. **Configure Firebase**:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google Sign-In)
   - Create a Firestore database
   - Copy your Firebase config to `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     ```

5. **Deploy Firestore Rules**:

   ```bash
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```

6. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Development Setup

### Available Commands

**Development**:

```bash
npm run dev           # Start development server at http://localhost:3000
npm run build         # Build for production
npm run start         # Start production server
```

**Code Quality**:

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors automatically
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting without changes
npm run type-check    # Run TypeScript type checking
```

**Testing**:

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

**First-time Playwright setup**:

```bash
npx playwright install  # Install browser binaries
```

### IDE Configuration

We recommend using **Visual Studio Code** with the following extensions:

- **ESLint**: For linting
- **Prettier**: For code formatting
- **TypeScript**: For type checking
- **Tailwind CSS IntelliSense**: For Tailwind class autocomplete
- **Playwright Test for VSCode**: For running E2E tests

## Project Architecture

Ambira follows a clean architecture pattern with clear separation of concerns. Key architectural resources:

- **[Architecture Documentation](../docs/architecture/README.md)**: Comprehensive system design
- **[Caching Strategy](../docs/architecture/CACHING_STRATEGY.md)**: React Query patterns
- **[Testing Strategy](../tests/README.md)**: 3-tier testing approach
- **[CLAUDE.md](../CLAUDE.md)**: Complete project overview and guidelines

### Key Architectural Patterns

**Feature Structure**:

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components (organized by feature)
│   └── ui/          # shadcn/ui components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Services, repositories, utilities
│   ├── api/        # API client functions
│   ├── firebase/   # Firebase configuration and utilities
│   └── utils/      # Helper functions
└── types/           # TypeScript type definitions
```

**Data Flow**:

1. **UI Components** → Call custom hooks
2. **Custom Hooks** (React Query) → Call service functions
3. **Service Functions** → Interact with Firebase
4. **React Query** → Handles caching, optimistic updates, invalidation

**Sessions-Only Model**:

- Sessions ARE the primary content type (not posts)
- Sessions function as social posts (like Strava's activities)
- Feed displays sessions with visibility settings
- All social features (comments, supports/likes) reference sessions

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State Management**: React Context + React Query
- **Testing**: Jest (unit/integration) + Playwright (E2E)
- **Icons**: Lucide React

## Code Style

### General Principles

1. **Follow existing patterns**: Review similar code before implementing new features
2. **Keep it simple**: Prefer clarity over cleverness
3. **Modular design**: Break down complex logic into small, testable functions
4. **Type safety**: Use TypeScript strictly (no `any` unless absolutely necessary)
5. **Functional programming**: Prefer pure functions and immutability

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types, clear naming
interface SessionFormData {
  activityId: string
  duration: number
  notes?: string
}

function createSession(data: SessionFormData): Promise<Session> {
  // Implementation
}

// ❌ Bad: Implicit types, unclear naming
function create(data: any) {
  // Implementation
}
```

### React Component Guidelines

```typescript
// ✅ Good: Functional component with TypeScript
interface SessionCardProps {
  session: SessionWithDetails
  onSupport: (sessionId: string) => void
}

export function SessionCard({ session, onSupport }: SessionCardProps) {
  // Implementation
}

// ❌ Bad: No types, unclear props
export function Card({ data, onClick }: any) {
  // Implementation
}
```

### Naming Conventions

- **Components**: PascalCase (`SessionCard`, `ActivityPicker`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useSessions`)
- **Utilities**: camelCase (`formatDuration`, `calculateStreak`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ACTIVITIES`, `DEFAULT_PAGE_SIZE`)
- **Types/Interfaces**: PascalCase (`Session`, `UserProfile`)

### Tailwind CSS Guidelines

```tsx
// ✅ Good: Semantic class grouping, responsive design
<div className="flex items-center gap-4 p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow md:p-6">

// ❌ Bad: Random order, no grouping
<div className="p-4 bg-white flex rounded-lg shadow-sm items-center hover:shadow-md gap-4 transition-shadow">
```

### File Organization

- Keep files focused and small (< 300 lines when possible)
- Co-locate related files (component + styles + tests)
- Use index files for clean exports
- Organize imports: React → Third-party → Internal → Types

### Common Pitfalls to Avoid

1. **Firestore Undefined Values**: Never write `undefined` to Firestore. Strip undefined keys before writes.

   ```typescript
   // ✅ Good
   const data = { name, description }
   const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined))

   // ❌ Bad
   await updateDoc(docRef, { name, description: undefined })
   ```

2. **Post vs Session Confusion**: Always use sessions, not posts. Sessions ARE the posts.

3. **Follow Permissions**: Use batched `update()` for follow operations to work with security rules.

4. **Type Mismatches**: Use proper populated types (`SessionWithDetails`) for UI components.

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, semantic commit messages.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring (no functionality change)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config, etc.)
- `perf`: Performance improvements

### Examples

```
feat(timer): add pause functionality to session timer

Implemented pause/resume functionality for active session timer.
Timer state persists across page refreshes using Firebase.

Closes #123
```

```
fix(feed): resolve infinite scroll pagination issue

Fixed bug where feed would load duplicate sessions when scrolling.
Updated cursor logic to properly track last loaded session.

Fixes #456
```

```
docs(architecture): update caching strategy documentation

Added examples for optimistic updates and cache invalidation
patterns used in the social features.
```

### Writing Good Commit Messages

- **Use imperative mood**: "Add feature" not "Added feature"
- **Keep subject under 72 characters**: Be concise
- **Reference issues**: Include issue numbers when applicable
- **Explain why, not what**: The diff shows what changed; explain why

## Pull Request Process

### Before Submitting a PR

1. **Create a feature branch**:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Write tests**:
   - Add unit tests for new business logic
   - Add integration tests for cross-module flows
   - Add E2E tests for user-facing features
   - Ensure coverage meets threshold (currently 11%, target 80%)

3. **Run all checks locally**:

   ```bash
   npm run lint          # Must pass
   npm run type-check    # Must pass
   npm test              # Must pass
   npm run test:e2e      # Must pass
   npm run build         # Must succeed
   ```

4. **Update documentation**:
   - Update README.md if adding user-facing features
   - Update architecture docs if changing system design
   - Add/update JSDoc comments for public APIs
   - Update CLAUDE.md if changing core patterns

5. **Format code**:
   ```bash
   npm run format
   ```

### Submitting a PR

1. **Push to your fork**:

   ```bash
   git push origin feat/your-feature-name
   ```

2. **Open a Pull Request** on GitHub

3. **Fill out the PR template** completely:
   - Describe what changed and why
   - List any breaking changes
   - Reference related issues
   - Add screenshots for UI changes
   - Complete the checklist

4. **Respond to feedback**:
   - Address reviewer comments promptly
   - Push additional commits to the same branch
   - Mark conversations as resolved when addressed

### PR Title Format

Follow conventional commit format:

```
feat(timer): add pause functionality
fix(feed): resolve infinite scroll issue
docs(contributing): add PR guidelines
```

### What Happens Next

1. **Automated checks run**: Linting, type checking, tests
2. **Code review**: Maintainers review your code
3. **Feedback loop**: Address any requested changes
4. **Approval**: Once approved, maintainers will merge
5. **Deployment**: Changes deploy automatically to production

## Testing Requirements

Ambira uses a comprehensive 3-tier testing strategy. See [Test Suite Documentation](../tests/README.md) for details.

### Test Structure

```
tests/
├── unit/              # Unit tests (Jest) - Isolated logic
├── integration/       # Integration tests (Jest) - Cross-module flows
├── e2e/              # End-to-end tests (Playwright) - User journeys
└── __mocks__/        # Shared mocks
```

### Coverage Requirements

- **Current**: 11.74% coverage (Phase 1)
- **Target**: 80% coverage (Phase 3)
- **Strategy**: Phased roadmap approach (see [TESTING_COVERAGE_ROADMAP.md](../docs/architecture/TESTING_COVERAGE_ROADMAP.md))

### Writing Tests

**When adding new features**:

1. Write unit tests FIRST (TDD approach)
2. Add integration tests for cross-module flows
3. Add E2E tests for user-facing features
4. Ensure coverage stays above threshold

**Test file naming**:

- Unit/Integration: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`

**Where to put tests**:

- Unit tests: Match source structure in `tests/unit/`
  - Example: `src/lib/api/sessions.ts` → `tests/unit/lib/api/sessions.test.ts`
- Integration tests: By feature in `tests/integration/`
  - Example: `tests/integration/feed/support-flow.test.ts`
- E2E tests: By user journey in `tests/e2e/`
  - Example: `tests/e2e/timer.spec.ts`

**Best practices**:

- Use AAA pattern (Arrange, Act, Assert)
- Mock external dependencies (Firebase, API calls)
- Use factories from `tests/__mocks__/` for test data
- Test edge cases and error paths
- Keep tests fast and deterministic

### Running Tests

```bash
# Run all tests before submitting PR
npm test              # Jest tests (unit + integration)
npm run test:e2e      # Playwright tests (E2E)

# Generate coverage report
npm run test:coverage # Must meet threshold (11% currently)
```

## Code Review Process

### For Contributors

**What reviewers look for**:

- Code quality and readability
- Test coverage and quality
- Documentation completeness
- Performance implications
- Security considerations
- Accessibility compliance
- Design consistency

**Tips for smooth reviews**:

- Keep PRs focused and reasonably sized (< 500 lines when possible)
- Write clear PR descriptions
- Add screenshots/videos for UI changes
- Respond to feedback constructively
- Don't take feedback personally

### For Reviewers

**Review checklist**:

- [ ] Code follows project style guidelines
- [ ] Tests are comprehensive and pass
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance is acceptable
- [ ] Accessibility standards met
- [ ] Design patterns are consistent

**Review etiquette**:

- Be respectful and constructive
- Explain the reasoning behind suggestions
- Distinguish between blockers and nits
- Acknowledge good work
- Approve promptly when ready

## Documentation

### What to Document

1. **Code Comments**:
   - Use JSDoc for public APIs
   - Explain complex algorithms
   - Document non-obvious decisions
   - Add TODO comments for future improvements

2. **Architecture Docs**:
   - Update `/docs/architecture/` for system design changes
   - Follow existing documentation structure
   - Include diagrams when helpful

3. **README Updates**:
   - Add new features to feature list
   - Update setup instructions if needed
   - Add new environment variables to `.env.example`

4. **CLAUDE.md**:
   - Update for new patterns or conventions
   - Add to "Common Pitfalls" if you discover gotchas
   - Update architecture section for structural changes

### Documentation Style

- Write in clear, concise language
- Use examples liberally
- Include code snippets
- Add links to related documentation
- Keep it up-to-date

## Getting Help

### Resources

- **[CLAUDE.md](../CLAUDE.md)**: Complete project overview
- **[Architecture Docs](../docs/architecture/README.md)**: System design details
- **[Test Documentation](../tests/README.md)**: Testing guide
- **[Issue Tracker](https://github.com/your-org/ambira/issues)**: Known issues and feature requests

### Asking Questions

When asking for help:

1. **Search existing issues**: Your question may already be answered
2. **Provide context**: Share relevant code and error messages
3. **Be specific**: "How do I implement X?" is better than "X doesn't work"
4. **Include environment details**: OS, Node version, browser, etc.

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code-specific discussions

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes for significant contributions
- Project README (for major contributions)

Thank you for contributing to Ambira! Your efforts help make productivity tracking more social and engaging for everyone.
