# Test Suite Organization

This directory contains all automated tests for the Ambira application, organized by test type and purpose.

## Directory Structure

```
src/__tests__/
├── unit/                    # Unit tests - isolated component/function tests
│   └── components/
│       ├── accessibility/   # Accessibility-focused unit tests
│       ├── analytics/       # Analytics component tests
│       ├── auth/           # Authentication component tests
│       ├── session/        # Session timer component tests
│       └── *.test.tsx      # General component unit tests
├── integration/            # Integration tests - multiple components/services
│   ├── auth/              # Authentication flow integration tests
│   ├── firebase/          # Firebase service integration tests
│   └── image-upload/      # Image upload flow integration tests
├── contract/              # Contract tests - API/data structure validation
│   └── api/              # API contract tests
└── helpers/              # Shared test utilities and mocks
```

## Test Categories

### Unit Tests (`unit/`)

**Purpose**: Test individual components or functions in isolation with all dependencies mocked.

**Characteristics**:
- Fast execution
- No external dependencies (Firebase, APIs, etc.)
- Mocked contexts and services
- Focus on component behavior and rendering
- Accessibility validation

**Examples**:
- `unit/components/ActivityCard.test.tsx` - Tests ActivityCard component rendering and interactions
- `unit/components/auth/LoginForm.test.tsx` - Tests LoginForm component with mocked auth
- `unit/components/accessibility/keyboard-navigation.test.tsx` - Tests keyboard navigation patterns

**When to add unit tests**:
- New UI components
- Component state logic
- User interactions (clicks, form submissions)
- Accessibility features (ARIA, keyboard navigation)
- Edge cases and error handling

### Integration Tests (`integration/`)

**Purpose**: Test how multiple components, services, or external systems work together.

**Characteristics**:
- May involve real or mocked external services
- Test full user workflows
- Verify data flow between components
- Test Firebase integration points

**Examples**:
- `integration/auth/google-signin.test.ts` - Tests complete Google sign-in flow
- `integration/firebase/feed-images.test.tsx` - Tests loading images from Firestore in feed
- `integration/image-upload/upload-flow.test.tsx` - Tests complete image upload workflow

**When to add integration tests**:
- Multi-step user workflows
- Firebase CRUD operations
- File upload/download flows
- Cross-component data sharing
- Authentication flows

### Contract Tests (`contract/`)

**Purpose**: Validate API interfaces, data structures, and system contracts.

**Characteristics**:
- Verify API method signatures
- Validate data shape and types
- Test business logic constraints
- Ensure API consistency

**Examples**:
- `contract/api/notifications.contract.test.ts` - Validates notification API structure
- `contract/api/challenges.contract.test.ts` - Validates challenge API contract

**When to add contract tests**:
- New API methods or changes
- Data model updates
- Type definition changes
- Business rule validations

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test category
```bash
# Unit tests only
npm test -- unit/

# Integration tests only
npm test -- integration/

# Contract tests only
npm test -- contract/
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- ActivityCard.test.tsx
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Naming Conventions

### File Naming
- Unit tests: `ComponentName.test.tsx` or `feature-description.test.tsx`
- Integration tests: `workflow-description.test.tsx`
- Contract tests: `service-name.contract.test.ts`

### Test Suite Naming
```typescript
// Unit test
describe('ComponentName', () => { ... })

// Integration test
describe('Feature Integration', () => { ... })

// Contract test
describe('API Contract - ServiceName', () => { ... })
```

### Test Case Naming
Use descriptive names that explain the behavior being tested:

```typescript
// Good ✅
it('should display error message when login fails', () => { ... })
it('should upload image to Firebase Storage and return URL', () => { ... })
it('should have proper ARIA labels for accessibility', () => { ... })

// Avoid ❌
it('works', () => { ... })
it('test login', () => { ... })
```

## Testing Best Practices

### 1. Arrange-Act-Assert Pattern
```typescript
it('should increment counter on button click', () => {
  // Arrange
  render(<Counter initialValue={0} />)

  // Act
  const button = screen.getByRole('button', { name: /increment/i })
  fireEvent.click(button)

  // Assert
  expect(screen.getByText('1')).toBeInTheDocument()
})
```

### 2. Mock External Dependencies
```typescript
// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {}
}))

// Mock contexts
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, login: jest.fn() })
}))
```

### 3. Use Testing Library Queries
Prefer queries that reflect how users interact:
- `getByRole` - Most accessible
- `getByLabelText` - Form fields
- `getByText` - Visible text
- Avoid `getByTestId` unless necessary

### 4. Test Accessibility
Include accessibility checks in component tests:
```typescript
it('should have proper ARIA attributes', () => {
  render(<Button />)
  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('aria-label', 'Submit form')
})
```

### 5. Clean Up After Tests
```typescript
afterEach(() => {
  jest.clearAllMocks()
  cleanup() // React Testing Library cleanup
})
```

## Shared Test Utilities

### Helpers (`helpers/`)
- `firebaseMock.ts` - Firebase service mocks

### Common Mocks
```typescript
// Mock Next.js components
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />
}))
```

## Coverage Requirements

The project maintains the following coverage thresholds:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

View coverage report after running:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Debugging Tests

### Run tests in debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### View test output
```bash
npm test -- --verbose
```

### Run single test
```bash
npm test -- -t "test name pattern"
```

## Contributing

When adding new features:
1. Write tests alongside feature code
2. Choose appropriate test category (unit/integration/contract)
3. Follow naming conventions
4. Include accessibility tests for UI components
5. Ensure coverage thresholds are met
6. Run full test suite before committing

## Related Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Accessibility Testing](https://testing-library.com/docs/dom-testing-library/api-accessibility)
