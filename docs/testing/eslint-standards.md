# ESLint Standards for Test Files

## Overview

Test files are first-class citizens in the codebase and follow the same linting standards as production code, with intentional exceptions that support testing patterns.

## Test File Locations

ESLint applies special rules to test files in these locations:

- Unit & Integration Tests: `src/__tests__/**/*.{ts,tsx}`
- Jest Setup: `jest.setup.ts`
- E2E Tests: `e2e/**/*.{ts,tsx}`

## ESLint Configuration for Tests

### Jest Test Files (`src/__tests__/**/*.{ts,tsx}`, `jest.setup.ts`)

These rules are relaxed to support testing patterns:

| Rule                                    | Setting | Reason                                                                         |
| --------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `@typescript-eslint/no-explicit-any`    | `off`   | Jest setup files and test utilities legitimately use `any` for global mocks    |
| `@typescript-eslint/no-unused-vars`     | `off`   | Test files import utilities that appear unused but support test infrastructure |
| `@next/next/no-img-element`             | `off`   | Tests use `<img>` tags for testing purposes, not for actual rendering          |
| `react/display-name`                    | `off`   | React test utilities create display-less components                            |
| `@typescript-eslint/no-require-imports` | `warn`  | Dynamic requires in tests are downgraded to warnings                           |
| `prefer-const`                          | `warn`  | Tests often assign values that look unused but are needed for test isolation   |

### Playwright E2E Tests (`e2e/**/*.{ts,tsx}`)

These rules are relaxed to support E2E testing patterns:

| Rule                                    | Setting | Reason                                                     |
| --------------------------------------- | ------- | ---------------------------------------------------------- |
| `react-hooks/rules-of-hooks`            | `off`   | Playwright's `use` function is not a React hook            |
| `@typescript-eslint/no-explicit-any`    | `off`   | E2E tests use `any` for Playwright page interactions       |
| `@typescript-eslint/no-unused-vars`     | `off`   | E2E test files often have unused imports for test fixtures |
| `@typescript-eslint/no-require-imports` | `warn`  | Dynamic test data imports are downgraded to warnings       |

## Code Quality Standards for Tests

While some rules are relaxed, test files should still maintain high code quality:

### Imports

Use top-level imports instead of dynamic `require()` calls when possible:

```typescript
// Good - proper ES6 import
import { getDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');

const mockGetDoc = getDoc as jest.Mock;
```

```typescript
// Avoid - dynamic require inside test
const { getDoc } = require('firebase/firestore');
```

### Type Safety

Even though `@typescript-eslint/no-explicit-any` is off, use specific types when possible:

```typescript
// Better - specific types
const mockFetch = jest.fn<Promise<Response>, [string]>();

// Acceptable in tests
const mockData: any = createMockData();
```

### Unused Variables

While unused variable warnings are suppressed, clean up obvious unused imports:

```typescript
// Remove unused imports
import { render, screen } from '@testing-library/react'; // ✅ Remove if screen isn't used
```

### Mock Patterns

#### Jest Module Mocks

Use `jest.mock()` with proper TypeScript typing:

```typescript
// Mock the module
jest.mock('@/hooks/useAuth');

// Import and type the mocked function
import { useAuth } from '@/hooks/useAuth';
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Use in tests
mockUseAuth.mockReturnValue({
  isAuthenticated: true,
});
```

#### Firebase Firestore Mocks

For Firestore functions that are already mocked at the module level, import and cast them:

```typescript
// At the top of the file
import { getDoc, setDoc } from 'firebase/firestore';

// Mock the entire module
jest.mock('firebase/firestore');

// In test functions
const mockGetDoc = getDoc as jest.Mock;
mockGetDoc.mockResolvedValue({...});
```

#### React Component Mocks

For component mocks in tests, omit `react/display-name` warnings:

```typescript
jest.mock('../ImageGallery', () => ({
  ImageGallery: ({ images }: { images: string[] }) => (
    <div data-testid="image-gallery">
      {images.map((img, idx) => (
        <img key={idx} src={img} alt={`Image ${idx}`} />
      ))}
    </div>
  ),
}));
```

## Running Linting on Tests

### Check Test File Linting

```bash
npm run lint -- "src/__tests__/**/*.{ts,tsx}" "e2e/**/*.ts"
```

### Fix Automatically Fixable Issues

```bash
npm run lint:fix -- "src/__tests__/**/*.{ts,tsx}" "e2e/**/*.ts"
```

## CI/CD Integration

Test file linting is automatically run in CI pipelines:

```bash
npm run lint
```

This command checks all files including tests with the configured rules. Test files are held to the same linting standards as production code, with the documented exceptions.

## Test File Checklist

When writing or reviewing test files, ensure:

- [ ] Imports are at the top of the file (ES6 modules, not `require`)
- [ ] Mocked modules are properly typed with `jest.MockedFunction` or `jest.Mock`
- [ ] Unused imports are removed (use ESLint to identify them)
- [ ] Component mocks don't trigger `react/display-name` warnings
- [ ] Firebase function calls use imported mocks, not dynamic `require`
- [ ] Test utilities are properly imported from testing libraries
- [ ] No TypeScript `any` types except where necessary for mocking

## Related Documentation

- [Test Suite Documentation](./README.md)
- [Jest Configuration](../../jest.config.ts)
- [ESLint Configuration](../../eslint.config.mjs)
- [Playwright Documentation](./playwright-ci-setup.md)
