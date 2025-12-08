# Developer Guide

Welcome to Ambira! This guide will help you get started as a developer on the project.

## 🚀 Quick Start (30 minutes)

Follow these steps in order to set up your development environment:

### Step 1: Clone and Install (5 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd ambira-web

# Install dependencies (npm only - do not use yarn)
npm install
```

### Step 2: Firebase Setup (15 minutes)

Firebase is **required** for authentication and database. Follow the complete guide:

**[📘 Firebase Setup Guide](./setup/FIREBASE_SETUP.md)**

Quick summary:

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password + Google)
3. Create Firestore Database (production mode)
4. Copy Firebase config from Project Settings
5. Configure `.env.local` with your Firebase credentials
6. Deploy security rules: `npx firebase-tools deploy --only firestore:rules --non-interactive`

### Step 3: Start Development Server (2 minutes)

```bash
# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Step 4: Verify Setup (5 minutes)

1. Navigate to http://localhost:3000
2. Click "Sign Up" and create a test account
3. Complete onboarding by selecting activities
4. Create a test session using the timer
5. Check the feed to see your session

If everything works, you're ready to start developing! 🎉

### Step 5: Set Up Testing (5 minutes)

**[📘 Testing Quickstart](./testing/QUICKSTART.md)**

```bash
# Install Playwright browsers
npx playwright install

# Run unit tests
npm test

# Run E2E smoke tests
npm run test:smoke
```

## 📚 Essential Documentation

### Must-Read Documents

Read these in order to understand the project:

1. **[README.md](../README.md)** - Project overview and features (15 min read)
2. **[CLAUDE.md](../CLAUDE.md)** - Comprehensive developer guide with all commands, patterns, and architecture (30 min read)
3. **[Architecture Overview](./architecture/README.md)** - System architecture and design patterns (20 min read)

### Reference Documentation

Keep these handy while developing:

- **[Caching Strategy](./architecture/CACHING_STRATEGY.md)** - How we use React Query
- **[Architecture Examples](./architecture/EXAMPLES.md)** - Complete feature implementations
- **[Testing Handbook](./testing/TESTING_HANDBOOK.md)** - Complete testing reference
- **[Firebase Indexes](./setup/FIREBASE_INDEXES.md)** - Required Firestore indexes

## 🏗️ Development Workflow

### Daily Development Cycle

```bash
# 1. Pull latest changes
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development server
npm run dev

# 4. Make your changes
# ... edit code ...

# 5. Run tests frequently
npm test

# 6. Before committing
npm run lint        # Check code style
npm run type-check  # Check types
npm test           # Run unit tests
npm run test:smoke # Run smoke tests

# 7. Commit changes
git add .
git commit -m "feat: your feature description"

# 8. Push and create PR
git push origin feature/your-feature-name
```

### Available Commands

**Development:**

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
```

**Code Quality:**

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors automatically
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting
npm run type-check    # Run TypeScript type checking
```

**Testing:**

```bash
# Unit & Integration Tests
npm test              # Run all Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report

# E2E Tests
npm run test:e2e       # Run all E2E tests
npm run test:smoke     # Run smoke tests only
npm run test:e2e:ui    # Run tests in UI mode
npm run test:e2e:debug # Run tests in debug mode
```

**Firebase:**

```bash
npx firebase-tools deploy --only firestore:rules --non-interactive
# Deploy Firestore security rules (required after modifying firestore.rules)
```

## 🎯 Key Concepts

### Architecture Patterns

Ambira follows Clean Architecture with these key patterns:

1. **React Query at Feature Boundaries** - All data fetching uses React Query hooks
2. **Service Layer** - Business logic in `/src/services/`
3. **Repository Pattern** - Firebase operations in repositories
4. **Hooks for UI Logic** - Reusable hooks in `/src/hooks/`

**Example:**

```
Component → Hook (useActivities) → Service (activitiesService) → Firebase
```

See [CACHING_STRATEGY.md](./architecture/CACHING_STRATEGY.md) for details.

### Sessions-Only Model (Strava-like)

**Critical:** Sessions ARE the primary content type, not posts.

- Sessions function as posts directly (like Strava's activities)
- Feed displays sessions with `visibility: 'everyone' | 'followers' | 'private'`
- Each session includes: `supportCount`, `commentCount`, `isSupported`
- Use `SessionWithDetails` type in components

### Activity System

- **System Defaults**: 10 hardcoded activities (Work, Coding, Side Project, etc.)
- **Custom Activities**: Users can create up to 10 custom activities
- **Recent Activities**: Tracked via `UserActivityPreference`
- Sessions use `activityId` (new) or `projectId` (legacy compatibility)

### Type Safety

- Extensive TypeScript coverage with strict mode
- Core types in `/src/types/index.ts`
- Always strip `undefined` values before Firestore writes

## 🧪 Testing Strategy

### Test Pyramid

```
       /\
      / E2E \        (Smoke Tests - Critical Paths)
     /------\
    / Integration \  (Feature Workflows)
   /------------\
  /  Unit Tests  \   (Component & Function Tests)
 /________________\
```

### Coverage Requirements

- **Unit Tests**:

We are improving coverage in phases.

- Phase 1, current 11.74% coverage, no hard CI gate yet
- Phase 2 target 40% coverage, may add a soft CI warning
- Phase 3 target 80% coverage, planned hard CI requirement

When adding tests, try to move us toward the next phase.  
See `CLAUDE.md` for the latest coverage numbers and plan.

- **Critical Paths**: 100% via smoke tests
- **Accessibility**: 100% WCAG 2.1 Level AA compliance

### When to Add Tests

- **Always** add unit tests for new services/utilities
- **Always** add integration tests for new features
- **Always** add E2E tests for critical user flows
- Run tests before every commit

See [TESTING_HANDBOOK.md](./testing/TESTING_HANDBOOK.md) for comprehensive guide.

## 🔥 Firebase Best Practices

### Firestore Rules

- After modifying `firestore.rules`, always deploy:
  ```bash
  npx firebase-tools deploy --only firestore:rules --non-interactive
  ```

### Required Indexes

When you see "index required" errors:

1. Click the link in browser console to auto-create
2. Or manually create in Firebase Console
3. See [FIREBASE_INDEXES.md](./setup/FIREBASE_INDEXES.md) for all indexes

### Data Integrity

- Strip `undefined` values before writes
- Use batched `update()` for atomic operations
- Use increment/decrement for counts
- Always validate data before Firestore operations

## 🎨 Design System

### Colors

- Primary: Electric Blue (`#007AFF`)
- Brand Orange: `#FC4C02` (profile avatars)
- Success Green: `#34C759`

### Layout

- Three-column desktop (left sidebar, feed, right sidebar)
- Single-column mobile with bottom navigation
- Responsive breakpoints via Tailwind

### Components

- UI primitives: `/src/components/ui/` (shadcn/ui)
- Feature components: `/src/components/`
- Always refer to [design-principles.md](../context/design-principles.md) for visual changes

## 🐛 Common Issues

### "Attempted to access firestore before Firebase was configured"

- Verify `.env.local` exists with all required variables
- Restart dev server: `npm run dev`
- Clear browser cache

### "Permission denied" in Firestore

- Deploy security rules: `npx firebase-tools deploy --only firestore:rules --non-interactive`
- Check Firebase Console > Firestore > Rules

### Build Errors Ignored

- `next.config.ts` has `ignoreDuringBuilds: true`
- Fix linting/type errors locally before deployment
- Run `npm run lint` and `npm run type-check`

### Tests Failing

- Ensure all required indexes are created
- Check Firebase emulator is running (if using)
- Clear test cache: `npm test -- --clearCache`

## 🤝 Contributing

### Before Starting Work

1. Check [open issues](https://github.com/AmbiraDev/ambira-web/issues)
2. Read [Contributing Guidelines](../CONTRIBUTING.md)
3. Discuss approach in issue comments

### Code Standards

- Follow existing patterns and conventions
- Write tests for all new features
- Update documentation when needed
- No `undefined` values to Firestore
- Prefer editing existing files over creating new ones

### Pull Request Checklist

Before creating a PR:

- [ ] All tests pass locally
- [ ] Code is linted and formatted
- [ ] TypeScript types are correct
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Accessibility checks pass
- [ ] Firebase rules are deployed (if modified)

### Commit Messages

Follow conventional commits:

```
feat: add user profile editing
fix: resolve timer persistence issue
docs: update Firebase setup guide
test: add unit tests for activities service
refactor: simplify feed query logic
```

## 📖 Additional Resources

### Internal Documentation

- **[User Guide](./USER_GUIDE.md)** - End-user documentation
- **[Features Overview](./FEATURES.md)** - All features and status
- **[Setup Guides](./setup/README.md)** - Development environment setup
- **[Testing Documentation](./testing/README.md)** - Complete testing guide

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🆘 Getting Help

### Troubleshooting Steps

1. Check this guide's Common Issues section
2. Search [GitHub issues](https://github.com/AmbiraDev/ambira-web/issues)
3. Review relevant documentation
4. Check Firebase Console for errors
5. Ask in project Slack/Discord (if available)

### Creating Issues

When reporting bugs, include:

- Error message (full stack trace)
- Steps to reproduce
- Expected vs actual behavior
- Browser console output
- Screenshots (if UI-related)
- Environment details (OS, browser, Node version)

## 🎓 Learning Path

### Week 1: Setup and Basics

- [ ] Complete Quick Start
- [ ] Read README.md and CLAUDE.md
- [ ] Run the app locally
- [ ] Create test sessions and explore features
- [ ] Run all tests successfully

### Week 2: Architecture

- [ ] Read Architecture Overview
- [ ] Study Caching Strategy
- [ ] Review Architecture Examples
- [ ] Explore codebase structure
- [ ] Make a small bug fix or improvement

### Week 3: Feature Development

- [ ] Pick a small feature from issues
- [ ] Implement with tests
- [ ] Create pull request
- [ ] Address review feedback

### Week 4: Advanced Topics

- [ ] Read Migration Guide
- [ ] Study Testing Handbook
- [ ] Explore Firebase optimization
- [ ] Contribute to documentation

## ✅ Next Steps

Now that you've completed setup:

1. **Explore the codebase** - Navigate `/src` and understand structure
2. **Run the app** - Create sessions, join groups, try all features
3. **Read core docs** - CLAUDE.md, Architecture docs
4. **Find a task** - Check issues labeled `good-first-issue`
5. **Start coding** - Make your first contribution!

Welcome to the Ambira team! 🚀

---

**Questions?** Check the [README](../README.md) or create an issue.

**Last Updated:** December 2nd 2025
