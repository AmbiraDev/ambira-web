````markdown
# Ambira Web App - Developer Documentation

## How to Obtain Source Code

Clone the repository from GitHub:

```bash
git clone https://github.com/AmbiraDev/ambira-web
```
````

---

## Directory Structure

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
│   │   ├── layout.tsx      # Root layout with providers
│   │   └── page.tsx        # Home page
│   │
│   ├── features/            # Feature modules (Clean Architecture)
│   │   ├── challenges/     # Challenge feature
│   │   │   ├── services/   # Business logic (no React dependencies)
│   │   │   ├── hooks/      # React Query boundary
│   │   │   └── README.md   # Feature documentation
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
│   ├── infrastructure/      # External integrations
│   │   └── firebase/
│   │       ├── repositories/  # Data access layer
│   │       └── mappers/       # Data transformation
│   │
│   ├── domain/              # Core business entities
│   │   └── entities/
│   │
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI primitives (shadcn/ui)
│   │   ├── activity/
│   │   ├── analytics/
│   │   ├── header/
│   │   ├── landing/
│   │   └── timer/
│   │
│   ├── lib/                 # Shared utilities and API layer
│   │   ├── api/
│   │   │   ├── achievements/
│   │   │   ├── auth/
│   │   │   ├── challenges/
│   │   │   ├── groups/
│   │   │   ├── projects/
│   │   │   ├── sessions/
│   │   │   ├── social/
│   │   │   └── shared/
│   │   ├── react-query/    # Query client configuration
│   │   ├── validation/     # Validation schemas
│   │   ├── onboarding/
│   │   ├── firebase.ts     # Firebase initialization
│   │   ├── cache.ts        # Caching utilities
│   │   └── errorHandler.ts # Error handling
│   │
│   ├── hooks/               # Global/shared hooks
│   ├── contexts/            # React Context providers (legacy)
│   ├── providers/           # Modern provider components
│   ├── config/              # Configuration files
│   ├── styles/              # Global styles
│   └── types/               # TypeScript definitions
│
├── src/__tests__/            # Test suites (unit, integration, contract)
│   ├── unit/                # Unit tests (Jest)
│   │   ├── components/
│   │   │   ├── accessibility/
│   │   │   ├── analytics/
│   │   │   ├── auth/
│   │   │   └── session/
│   │   └── hooks/
│   │
│   ├── integration/         # Integration tests (Jest + Testing Library)
│   │   ├── auth/
│   │   ├── firebase/
│   │   └── image-upload/
│   │
│   ├── contract/            # Contract tests (API/data validation)
│   │   └── api/
│   │
│   ├── helpers/             # Shared test utilities and mocks
│   │   └── firebaseMock.ts
│   │
│   └── fixtures/            # Test data fixtures
│       └── mocks.ts
│
├── e2e/                      # End-to-end tests (Playwright)
│   ├── smoke/
│   │   ├── auth.spec.ts
│   │   ├── feed.spec.ts
│   │   ├── protected-routes.spec.ts
│   │   └── timer.spec.ts
│   ├── fixtures/
│   └── utils/
│
├── docs/                     # Documentation
│   ├── architecture/
│   ├── testing/
│   └── PRODUCT_ROADMAP.md
│
├── public/                   # Static assets
│
├── firestore.rules           # Firestore security rules
├── .env.example              # Environment variable template
├── jest.config.js            # Jest configuration
├── jest.setup.js             # Jest setup file
├── playwright.config.ts      # Playwright configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── CLAUDE.md                 # AI assistant guidelines
├── CONTRIBUTING_DEV_DOCS.md  # Developer guide
└── README.md                 # Project overview
```

---

## How to Build the Software

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start development server (hot reloaded) |
| `npm run build`        | Create production build                 |
| `npm run start`        | Run production server                   |
| `npm run lint`         | Run ESLint                              |
| `npm run lint:fix`     | Fix ESLint issues automatically         |
| `npm run format`       | Format code using Prettier              |
| `npm run format:check` | Check formatting without changes        |
| `npm run type-check`   | Run TypeScript type checks              |

---

## How to Test the Software

Ambira uses a **three-layer testing strategy**:

1. **Unit Tests (Jest):**
   - Target `src/__tests__/unit/`
   - Validate utilities, hooks, and providers
   - Use deterministic mocks from `src/__tests__/helpers/`

2. **Integration Tests (Jest + Testing Library):**
   - Target `src/__tests__/integration/`
   - Validate interactions, routing guards, and Firebase data flow
   - Use shared fixtures from `src/__tests__/fixtures/`

3. **End-to-End (E2E) Tests:**
   - Web: Playwright (`e2e/`)
   - Mobile: Detox (`e2e/`)
   - Validate complete user journeys

### **Test Commands**

```bash
# Unit tests
npm run test -- src/__tests__/unit

# Integration tests
npm run test -- src/__tests__/integration

# Web E2E tests
npx playwright test

# Mobile E2E tests
npx detox test
```

Tests that involve backend data use the **Firebase Emulator Suite** or **seeded local data**.
In CI (GitHub Actions), builds run **type-checking, linting, unit, integration, and smoke E2E tests**, with artifacts (traces/screenshots) uploaded for debugging.

---

## How to Add New Tests

Follow Ambira’s three-layer structure:

- **Unit Tests:** Small, isolated logic (functions, hooks).
- **Integration Tests:** Multi-module flows with mocked Firebase.
- **E2E Tests:** Full user journeys (Playwright for web, Detox for mobile).

### **Guidelines**

- Place tests in the corresponding directory (`unit/`, `integration/`, `e2e/`).
- Name files descriptively (e.g., `feed/comment-flow.test.ts`).
- Use reusable mocks (`src/__tests__/helpers/`) and fixtures (`src/__tests__/fixtures/`).
- Prefer **role-based** or **data-testid/testID** selectors.
- `.test.ts` → Unit/Integration | `.spec.ts` → E2E
- Minimal snapshots, clear assertions, and descriptive test names.
- Coverage enforced at **≥80%**; generate reports with:

  ```bash
  npm run test:coverage
  ```

---

## How to Build a Release of the Software

1. **Pre-Build Tasks**
   - Update `package.json` version using **Semantic Versioning**.
   - Refresh documentation (`CHANGELOG.md`, etc.).
   - Run all tests: linting, type-check, unit, integration, and E2E.

2. **Build and Verify**

   ```bash
   npm run build
   npm run start
   ```

   - Test core flows: login, feed, timer, and analytics.
   - Ensure no console errors or broken UI.

3. **Deploy and Tag**
   - Commit and tag the release (e.g., `v1.2.0`).
   - Push to main branch; GitHub Actions automates deployment.

4. **Post-Release**
   - Run production smoke tests.
   - Monitor tools like **Sentry** for errors.
   - Verify Firestore rules and hosting stability.
   - Roll back via **Vercel** or **Firebase** if necessary.
