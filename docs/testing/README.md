# Testing Documentation

Comprehensive testing documentation for the Ambira application.

## 📚 Documentation Index

### Essential Starting Points

- **[Testing Handbook](./TESTING_HANDBOOK.md)** - Your complete testing reference (recommended starting point)
- **[Quick Start Guide](./QUICKSTART.md)** - Get started with testing in 5 minutes

### Comprehensive Type-Specific Guides

- **[Testing Strategy](./TESTING_STRATEGY.md)** - High-level philosophy and quality standards
- **[Main Test Suite](../../src/__tests__/README.md)** - Overview of unit, integration, and contract tests
- **[Unit Tests Guide](../../src/__tests__/unit/README.md)** - Component and function testing patterns
- **[Integration Tests Guide](../../src/__tests__/integration/README.md)** - Workflow and feature testing
- **[Contract Tests Guide](../../src/__tests__/contract/README.md)** - API and data structure validation
- **[Mocks Guide](../../src/__tests__/__mocks__/README.md)** - Shared mocks and test factories

### CI/CD and Advanced Topics

- **[Playwright CI/CD Setup](./playwright-ci-setup.md)** - Complete CI/CD integration guide
- **[E2E Test Suite](../../e2e/README.md)** - Comprehensive E2E testing documentation
- **[ESLint Standards](./eslint-standards.md)** - Linting and code quality rules

## 🎯 Testing Strategy

### Test Pyramid

```
           /\
          /  \
         / E2E \        (Smoke Tests - Critical Paths)
        /------\
       /        \
      / Integration \   (Feature Workflows)
     /------------\
    /              \
   /  Unit Tests    \  (Component & Function Tests)
  /__________________\
```

### Coverage by Type

1. **Unit Tests (Jest)**
   - Component rendering and behavior
   - Business logic and utilities
   - Isolated function testing
   - 80% coverage requirement

2. **Integration Tests (Jest)**
   - Multi-component workflows
   - Firebase integration
   - Authentication flows
   - File upload/download

3. **Smoke Tests (Playwright)**
   - Critical user paths
   - Accessibility compliance
   - Mobile responsiveness
   - Core functionality

## 🚀 Running Tests

### All Tests

```bash
# Unit and integration tests
npm test

# End-to-end smoke tests
npm run test:smoke

# All tests (unit + E2E)
npm test && npm run test:e2e
```

### Development Workflow

```bash
# Watch mode for unit tests
npm run test:watch

# Interactive E2E testing
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug
```

### Pre-Commit Checklist

Before committing code, run:

```bash
# 1. Run unit tests
npm test

# 2. Check types
npm run type-check

# 3. Lint code
npm run lint

# 4. Run smoke tests
npm run test:smoke
```

## 📊 Test Coverage

### Current Coverage

- **Unit Tests**: 95% minimum (branches, functions, lines, statements)
- **Critical Paths**: 100% (via smoke tests)
- **Accessibility**: 100% WCAG 2.1 Level AA compliance

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# View E2E test report
npm run test:e2e:report
```

## ♿ Accessibility Testing

All critical pages are tested for:

- WCAG 2.0 Level A & AA
- WCAG 2.1 Level A & AA
- Color contrast
- ARIA attributes
- Keyboard navigation
- Screen reader compatibility

### Tools Used

- **axe-core**: Automated accessibility scanning
- **Playwright**: Keyboard navigation and interaction testing
- **Jest + Testing Library**: Component accessibility

## 🔄 CI/CD Integration

### Automated Testing

Tests run automatically on:

- Every pull request
- Every push to main branch
- Manual workflow dispatch

### CI Workflow

1. **Install Dependencies** (cached)
2. **Lint & Type Check** (parallel)
3. **Unit Tests** (parallel)
4. **Build Application**
5. **E2E Smoke Tests** (Chromium only)
6. **Upload Artifacts** (on failure)

### Test Reports

Reports are available in GitHub Actions:

- HTML test reports
- Screenshots of failures
- Video recordings
- Accessibility scan results

## 📖 Documentation Links

### Strategic Guides

- **[Testing Strategy](./TESTING_STRATEGY.md)** - High-level testing philosophy and standards
- **[Quick Start Guide](./QUICKSTART.md)** - 5-minute setup

### Test Type Guides

- **[Main Test Suite Guide](../../src/__tests__/README.md)** - Overview of all test types
- **[Unit Tests Guide](../../src/__tests__/unit/README.md)** - Component and function testing
- **[Integration Tests Guide](../../src/__tests__/integration/README.md)** - Workflow and feature testing
- **[Contract Tests Guide](../../src/__tests__/contract/README.md)** - API and data structure validation

### Testing Utilities

- **[Mocks Guide](../../src/__tests__/__mocks__/README.md)** - Shared mocks and test factories
- **[Fixtures Guide](../../src/__tests__/fixtures/README.md)** - Test data management

### End-to-End Testing

- **[E2E README](../../e2e/README.md)** - Comprehensive Playwright guide
- **[Playwright CI Setup](./playwright-ci-setup.md)** - CI/CD integration for E2E tests

### Configuration & Workflow

- [Main CI Workflow](../../.github/workflows/ci.yml) - GitHub Actions config
- [Playwright Workflow](../../.github/workflows/playwright.yml) - Standalone E2E workflow
- [Playwright Config](../../playwright.config.ts) - Playwright settings
- [Jest Config](../../jest.config.ts) - Jest settings
- [Package Scripts](../../package.json) - Available npm scripts

## 🎓 Best Practices

### Writing Tests

1. **Test behavior, not implementation**

   ```typescript
   // Good ✅
   await page.getByRole('button', { name: 'Submit' }).click()

   // Avoid ❌
   await page.locator('.btn-submit').click()
   ```

2. **Include accessibility checks**

   ```typescript
   const results = await makeAxeBuilder().analyze()
   expect(results.violations).toHaveLength(0)
   ```

3. **Test responsive design**

   ```typescript
   await page.setViewportSize({ width: 375, height: 667 })
   // ... test mobile view
   ```

4. **Use descriptive test names**

   ```typescript
   test('should display error when email is invalid')
   ```

5. **Keep smoke tests fast**
   - Test only critical paths
   - Avoid unnecessary waits
   - Use parallel execution when possible

### Maintaining Tests

1. **Update tests with features** - Add tests when adding features
2. **Fix flaky tests immediately** - Don't ignore intermittent failures
3. **Review test reports** - Check CI results on every PR
4. **Monitor coverage** - Maintain 80%+ coverage
5. **Document patterns** - Add examples for common test scenarios

## 🐛 Troubleshooting

### Common Issues

**Tests pass locally but fail in CI**

- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Check environment variables are set
- Review CI logs for specific errors

**Flaky tests**

- Use Playwright's auto-waiting
- Avoid fixed timeouts
- Mock external dependencies

**Accessibility violations**

- Check HTML report for details
- Review element markup
- Fix ARIA attributes and labels

**Slow tests**

- Remove unnecessary waits
- Run only critical tests in smoke suite
- Optimize page load performance

### Getting Help

1. **Check test output** - Read error messages carefully
2. **Use debug mode** - `npm run test:e2e:debug`
3. **View traces** - Check HTML report for execution traces
4. **Consult docs** - Review documentation links above
5. **Ask team** - Reach out for help with specific issues

## 📚 External Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## 🤝 Contributing

When adding tests:

1. Choose appropriate test type (unit/integration/E2E)
2. Follow existing patterns and conventions
3. Include accessibility checks for UI tests
4. Add documentation for new patterns
5. Ensure tests pass locally before pushing
6. Monitor CI results after pushing

For questions or issues, consult the documentation or ask the team.
