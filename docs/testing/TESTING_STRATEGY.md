# Testing Strategy

Strategic overview of the Ambira testing approach, philosophy, and quality standards.

## Vision

Ambira's test suite ensures reliable, maintainable code through comprehensive testing at multiple levels. We aim for high confidence in functionality with minimal maintenance burden.

### Testing Philosophy

1. **Test User Behavior** - Write tests that verify what users experience, not implementation details
2. **Progressive Disclosure** - Simple tests first (unit), then integration, finally end-to-end
3. **Test Pyramid** - More unit tests, fewer integration tests, minimal E2E tests
4. **Maintainability First** - Tests should be as easy to change as the code they test
5. **Fast Feedback** - Tests should run quickly to enable rapid development

## Test Pyramid

```
            /\
           /  \
          / E2E \        Smoke & Critical Paths
         /------\       (5-10% of tests)
        /        \
       / Integration \   Feature Workflows
      /------------\   (15-25% of tests)
     /              \
    /  Unit Tests    \  Components & Functions
   /__________________\ (65-80% of tests)
```

## Test Types and Coverage

### Unit Tests (65-80% of tests)

**Purpose**: Verify individual components, hooks, and functions work correctly in isolation.

**Coverage Target**: 95%+ branches, functions, lines, statements

**What to Test**:

- React components (rendering, props, events)
- Custom React hooks
- Utility functions
- Business logic
- Error conditions
- Edge cases

**Test Location**: `src/__tests__/unit/`

**Example**:

```typescript
describe('ActivityCard', () => {
  it('should render activity data', () => {
    const activity = { id: '1', title: 'Test', duration: 60 };
    render(<ActivityCard activity={activity} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**Speed**: Individual tests should complete in < 100ms

### Integration Tests (15-25% of tests)

**Purpose**: Verify that multiple components, services, and systems work together.

**Coverage Target**: All critical workflows

**What to Test**:

- Complete user workflows (login -> create session -> upload image)
- Firebase integration with components
- React Query with API/database calls
- File upload and processing
- Real-time features
- Data synchronization

**Test Location**: `src/__tests__/integration/`

**Example**:

```typescript
describe('Integration: Session Creation', () => {
  it('should create session with images', async () => {
    render(<SessionCreationWizard />);
    // Complete workflow test
  });
});
```

**Speed**: Individual tests should complete in < 1 second

### Contract Tests (5-10% of tests)

**Purpose**: Validate that APIs and services return data with the correct structure.

**Coverage Target**: All API endpoints and Firestore collections

**What to Test**:

- API response structure and types
- Firestore document schema
- Required vs optional fields
- Data type consistency
- Enum/constraint validation

**Test Location**: `src/__tests__/contract/`

**Example**:

```typescript
describe('Challenges API Contract', () => {
  it('should return challenges with correct structure', async () => {
    const response = await getChallenges()
    response.forEach((challenge) => {
      expect(challenge).toHaveProperty('id')
      expect(challenge.type).toMatch(/^(most-activity|fastest-effort)$/)
    })
  })
})
```

**Speed**: Individual tests should complete in < 1 second

### E2E/Smoke Tests (Playwright)

**Purpose**: Verify critical user paths work end-to-end in a real browser.

**Coverage Target**: Critical paths only (5-10 tests)

**What to Test**:

- Homepage loads and displays content
- Authentication flow (login/signup)
- Session creation and timer
- Feed navigation
- Accessibility (WCAG 2.1 AA)
- Mobile responsiveness

**Test Location**: `e2e/smoke/`

**Speed**: Should complete in < 30 seconds total

## Quality Standards

### Code Coverage Requirements

| Metric     | Target | Tools |
| ---------- | ------ | ----- |
| Branches   | 95%    | Jest  |
| Functions  | 95%    | Jest  |
| Lines      | 95%    | Jest  |
| Statements | 95%    | Jest  |

**Exclusions** from coverage:

- Next.js app router files (`src/app/**`)
- Type definitions (`src/types/**`)
- Storybook stories (`**/*.stories.{js,jsx,ts,tsx}`)

View coverage:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Test Quality Standards

1. **Clear Test Names** - Test name clearly describes what is being tested

   ```typescript
   it('should display error when email is invalid')
   it('should disable submit button while loading')
   ```

2. **Single Responsibility** - Each test should verify one behavior

   ```typescript
   // Bad - tests multiple behaviors
   it('should render and submit', () => {})

   // Good - focused on one behavior
   it('should submit form with valid data', () => {})
   ```

3. **No Flakiness** - Tests pass consistently every time
   - Use explicit waits, not arbitrary timeouts
   - Mock time-dependent operations
   - Don't depend on test execution order

4. **Maintainability** - Tests should be easy to update when code changes
   - Use semantic queries (roles, labels)
   - Avoid testing implementation details
   - Share test utilities and mocks

5. **Performance** - Tests should run quickly
   - Unit tests: < 100ms each
   - Integration tests: < 1 second each
   - All tests: complete in < 30 seconds

### Accessibility Standards

All UI tests include accessibility checks:

- **WCAG 2.0 Level A & AA** compliance
- **WCAG 2.1 Level A & AA** compliance
- Color contrast ratios
- ARIA attributes and labels
- Keyboard navigation
- Screen reader compatibility

Use axe-core for automated accessibility scanning:

```typescript
const results = await makeAxeBuilder().analyze()
expect(results.violations).toHaveLength(0)
```

## Testing Workflows

### Development Workflow

```bash
# Start development server
npm run dev

# Run tests in watch mode - auto-rerun on changes
npm run test:watch

# In watch mode, press:
#   a - run all tests
#   p - filter by filename
#   t - filter by test name
#   q - quit
```

### Pre-Commit Checklist

Before committing code:

```bash
# 1. Run unit tests (should pass)
npm test

# 2. Run type checking (should have no errors)
npm run type-check

# 3. Run linting (should be fixed)
npm run lint:fix

# 4. Run smoke tests locally
npm run test:smoke
```

### Code Review Checklist

When reviewing pull requests:

1. **Tests Added** - New features have corresponding tests
2. **Coverage Maintained** - Coverage hasn't decreased
3. **Tests Pass** - All tests pass in CI
4. **Test Quality** - Tests follow standards (naming, clarity, focus)
5. **No Debug Code** - No console.log, debugger statements in tests
6. **Mocks Appropriate** - Only external dependencies are mocked
7. **Accessibility** - UI tests include accessibility checks

### CI/CD Integration

Tests run automatically:

- On every pull request
- On every push to main
- Manual workflow dispatch via GitHub

**CI Pipeline**:

1. Install dependencies (with cache)
2. Run linting
3. Run type checking
4. Run unit tests
5. Generate coverage reports
6. Build application
7. Run E2E smoke tests

Failing tests block merging to main.

## Test Maintenance

### Keeping Tests Aligned with Code

1. **Update Tests When Code Changes** - Test files should be updated alongside source code
2. **Review Test Failures** - Don't ignore test failures, investigate and fix
3. **Refactor Tests** - Apply same refactoring practices to tests as source code
4. **Monitor Coverage** - Track coverage trends and address gaps
5. **Document Patterns** - Add examples of new testing patterns

### Managing Technical Debt

1. **Fix Flaky Tests Immediately** - Don't ignore intermittent failures
2. **Remove Duplicate Test Setup** - Use beforeEach and helper functions
3. **Update Mocks** - Keep mocks aligned with actual service signatures
4. **Simplify Complex Tests** - Break down large test files into smaller ones

### Continuous Improvement

1. **Monthly Reviews** - Review coverage reports and identify gaps
2. **Retrospectives** - Discuss test-related issues in team standups
3. **Pattern Documentation** - Add examples of new testing patterns
4. **Tool Evaluation** - Keep testing tools and libraries up to date
5. **Performance Monitoring** - Track test execution time trends

## Test File Organization

### Naming Conventions

```
ComponentName.test.tsx          # Component unit tests
hookName.test.ts                # Hook unit tests
functionName.test.ts            # Function unit tests

WorkflowName.test.tsx           # Integration tests
APIName.contract.test.ts        # Contract tests
```

### File Location Principles

- Tests colocate with features they test
- Similar concerns group together
- Clear separation between test types
- Easy to locate test for specific feature

### Directory Structure

```
src/__tests__/
├── __mocks__/              # Shared mocks
├── fixtures/               # Test data
├── helpers/                # Helper utilities
├── unit/
│   ├── components/
│   ├── hooks/
│   └── ...
├── integration/
│   ├── auth/
│   ├── firebase/
│   └── ...
└── contract/
    └── api/
```

## Testing Tools and Dependencies

### Core Testing Tools

| Tool                       | Purpose                      | Version |
| -------------------------- | ---------------------------- | ------- |
| Jest                       | Unit/integration test runner | 30.x    |
| React Testing Library      | Component testing            | 16.x    |
| Playwright                 | E2E testing                  | 1.5x    |
| Testing Library User Event | Realistic user interactions  | 14.x    |
| axe-core                   | Accessibility testing        | 4.1x    |

### Test Utilities

| Utility             | Purpose                  |
| ------------------- | ------------------------ |
| createMockUser()    | Create test user data    |
| createMockSession() | Create test session data |
| firebaseMock        | Firebase/Firestore mocks |
| QueryClientProvider | React Query testing      |

## Known Testing Patterns

### Pattern: Form Testing

```typescript
describe('LoginForm', () => {
  it('should submit form with email and password', async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password',
    });
  });
});
```

### Pattern: Firebase Testing

```typescript
jest.mock('firebase/firestore')

it('should save data to Firestore', async () => {
  firebaseMock.db.collection('items').add.mockResolvedValue({ id: 'new-id' })

  await performAction()

  expect(firebaseMock.db.collection).toHaveBeenCalledWith('items')
  expect(firebaseMock.db.collection().add).toHaveBeenCalled()
})
```

### Pattern: React Query Testing

```typescript
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

render(
  <QueryClientProvider client={queryClient}>
    <Component />
  </QueryClientProvider>
);

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Troubleshooting

### Issue: Flaky Tests

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:

- Use `waitFor` instead of `setTimeout`
- Avoid testing implementation details
- Mock time-dependent operations
- Ensure tests don't depend on execution order

### Issue: Coverage Decreases

**Symptoms**: Coverage goes down after changes

**Solutions**:

- Add tests for new code paths
- Check if deleted code had tests
- Review untested branches in coverage report
- Add edge case tests

### Issue: Tests Run Slowly

**Symptoms**: Test suite takes > 30 seconds to run

**Solutions**:

- Remove unnecessary waits
- Parallelize test execution
- Profile slow tests with `--detectOpenHandles`
- Move expensive tests to separate suite

### Issue: Mocks Not Working

**Symptoms**: Mock not being used, tests still call real code

**Solutions**:

- Ensure mock is declared before import
- Check mock path matches actual path
- Verify mock is called before assertion
- Use `jest.clearAllMocks()` in beforeEach

## Resources

### Documentation

- [Main Test Guide](../../src/__tests__/README.md)
- [Unit Tests Guide](../../src/__tests__/unit/README.md)
- [Integration Tests Guide](../../src/__tests__/integration/README.md)
- [Contract Tests Guide](../../src/__tests__/contract/README.md)
- [Mocks Guide](../../src/__tests__/__mocks__/README.md)

### External Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing JavaScript](https://testingjavascript.com/)

## Metrics and Goals

### Current Targets

| Metric                   | Target  | Status      |
| ------------------------ | ------- | ----------- |
| Unit Test Coverage       | 95%+    | In Progress |
| Critical Path Coverage   | 100%    | To Do       |
| Average Test Duration    | < 100ms | To Do       |
| Flaky Test Rate          | < 1%    | To Do       |
| Accessibility Violations | 0       | To Do       |

### Success Criteria

- Tests are easy to understand
- Tests are fast to run (complete in < 30 seconds)
- Tests are reliable (pass consistently)
- Tests are maintainable (easy to update)
- Coverage remains above 95%
- New features have tests
- Bugs are covered by regression tests

## Next Steps

1. **Add Tests for Existing Code** - Improve coverage on current features
2. **Document New Patterns** - Add examples as new patterns emerge
3. **Optimize Performance** - Identify and fix slow tests
4. **Improve Accessibility** - Add axe-core checks to all UI tests
5. **Enhance CI/CD** - Add more automated quality checks

## Questions and Discussions

For questions or discussions about testing:

1. Check existing documentation
2. Review test examples in codebase
3. Ask team members
4. Create issues for improvements

---

**Last Updated**: October 2024
**Maintainers**: Development Team
