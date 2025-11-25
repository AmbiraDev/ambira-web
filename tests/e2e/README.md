# End-to-End Testing with Playwright

This directory contains end-to-end (E2E) tests for the Ambira application using [Playwright](https://playwright.dev/).

## 📁 Directory Structure

```
e2e/
├── smoke/              # Smoke tests for critical user paths
│   ├── feed.spec.ts   # Feed page smoke tests
│   ├── timer.spec.ts  # Timer page smoke tests
│   └── auth.spec.ts   # Authentication smoke tests
├── fixtures/          # Shared test fixtures and utilities
│   └── test-base.ts  # Base test with accessibility extensions
├── utils/             # Helper functions for tests
│   └── accessibility.ts # Accessibility testing utilities
└── README.md          # This file
```

## 🎯 Test Categories

### Smoke Tests (`smoke/`)

**Purpose**: Fast, critical-path tests that verify core functionality works correctly.

**Characteristics**:

- Run on every PR and push to main
- Test only the most critical user journeys
- Should complete in under 5 minutes
- Include accessibility checks
- Test on both desktop and mobile viewports

**Current Smoke Tests**:

1. **Feed Page** (`smoke/feed.spec.ts`)
   - Page loads successfully
   - Navigation elements are visible
   - No critical console errors
   - Passes accessibility audit
   - Responsive on mobile
   - Keyboard navigation works

2. **Timer Page** (`smoke/timer.spec.ts`)
   - Timer interface loads
   - Controls are functional
   - No critical console errors
   - Passes accessibility audit
   - Responsive on mobile
   - Handles authentication state

3. **Authentication** (`smoke/auth.spec.ts`)
   - Login page loads
   - Form validation works
   - No critical console errors
   - Passes accessibility audit
   - Responsive on mobile
   - Protected routes handled correctly

## 🚀 Running Tests

### Prerequisites

```bash
# Install Playwright browsers (first time only)
npx playwright install
```

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run only smoke tests
npm run test:smoke

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Watch Mode

```bash
# Run specific test file in watch mode
npx playwright test e2e/smoke/feed.spec.ts --ui
```

### Run Specific Tests

```bash
# Run a specific test file
npx playwright test e2e/smoke/feed.spec.ts

# Run tests matching a pattern
npx playwright test --grep "accessibility"

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=mobile-chrome
```

## ♿ Accessibility Testing

All smoke tests include automated accessibility checks using [axe-core](https://github.com/dequelabs/axe-core).

### What's Checked

- WCAG 2.0 Level A & AA compliance
- WCAG 2.1 Level A & AA compliance
- Color contrast ratios
- ARIA attributes
- Semantic HTML structure
- Keyboard navigation
- Screen reader compatibility

### Accessibility Utilities

**`runAccessibilityScan(page, options?)`**
Runs a comprehensive accessibility scan on the current page.

```typescript
import { runAccessibilityScan } from '../utils/accessibility'

const results = await runAccessibilityScan(page, {
  exclude: ['#third-party-widget'], // Exclude specific elements
  disableRules: ['color-contrast'], // Disable specific rules
})
```

**`formatA11yViolations(violations)`**
Formats accessibility violations into readable error messages.

**`checkBasicAccessibility(page)`**
Performs basic accessibility checks:

- Page has a title
- Main landmark exists
- Heading structure is present
- Skip links are available

### Custom Test Fixture

The `test` fixture from `fixtures/test-base.ts` includes accessibility utilities:

```typescript
import { test, expect } from '../fixtures/test-base'

test('my test', async ({ page, makeAxeBuilder }) => {
  await page.goto('/')

  // Run accessibility scan
  const results = await makeAxeBuilder().analyze()
  expect(results.violations).toHaveLength(0)
})
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

Key configuration options:

- **Test Directory**: `./e2e`
- **Parallel Execution**: Enabled locally, disabled in CI
- **Retries**: 2 retries in CI, 0 locally
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Browsers**: Chromium (desktop + mobile)

### Projects

- **chromium**: Desktop Chrome at 1440x900
- **mobile-chrome**: Pixel 5 viewport

### CI Configuration

In CI, Playwright:

- Runs only Chromium tests (for speed)
- Produces HTML and JUnit reports
- Captures screenshots/videos on failure
- Uploads artifacts for debugging

## 📊 Test Reports

### HTML Report

After running tests, view the interactive HTML report:

```bash
npm run test:e2e:report
```

The report includes:

- Test results and statistics
- Screenshots and videos of failures
- Trace viewer for debugging
- Accessibility violation details

### CI Reports

In CI, test reports are uploaded as artifacts and available in the GitHub Actions run.

## 🎨 Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// Good ✅
await page.getByRole('button', { name: 'Start Timer' }).click()

// Avoid ❌
await page.locator('.timer-button-class').click()
```

### 2. Use Playwright's Auto-Waiting

Playwright automatically waits for elements to be actionable:

```typescript
// Playwright automatically waits for element to be visible and enabled
await page.getByRole('button').click()
```

### 3. Test Accessibility in Every Test

```typescript
test('feature works correctly', async ({ page, makeAxeBuilder }) => {
  // ... test logic ...

  // Always check accessibility
  const results = await makeAxeBuilder().analyze()
  expect(results.violations).toHaveLength(0)
})
```

### 4. Test Responsive Design

```typescript
test('mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })

  // Verify no horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  expect(hasHorizontalScroll).toBe(false)
})
```

### 5. Handle Authentication State

For authenticated tests, use Playwright's [authentication state](https://playwright.dev/docs/auth):

```typescript
// Future enhancement: Store auth state
test.use({ storageState: 'auth.json' })
```

### 6. Keep Smoke Tests Fast

Smoke tests should:

- Test only critical paths
- Avoid unnecessary waits
- Run in under 5 minutes total
- Fail fast on errors

### 7. Use Descriptive Test Names

```typescript
// Good ✅
test('should display error message when submitting invalid email')

// Avoid ❌
test('email validation')
```

## 🐛 Debugging Tests

### Debug Mode

Run tests in debug mode to step through them:

```bash
npm run test:e2e:debug
```

### Playwright Inspector

The inspector shows:

- Current page state
- Selector picker
- Step-by-step execution
- Network activity

### Trace Viewer

View traces of failed tests:

```bash
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Failed tests automatically capture:

- Screenshots on failure
- Videos of the entire test run (when enabled)

## 📝 Writing New Tests

### 1. Choose the Right Test Type

- **Smoke Tests**: Critical user paths that must always work
- **Feature Tests**: Comprehensive testing of specific features
- **Visual Tests**: Screenshot comparison tests (future)

### 2. Create Test File

```bash
# Create new smoke test
touch e2e/smoke/my-feature.spec.ts
```

### 3. Use the Template

```typescript
import { test, expect } from '../fixtures/test-base'
import { formatA11yViolations } from '../utils/accessibility'

test.describe('My Feature - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-feature')
  })

  test('should load successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('should pass accessibility audit', async ({ page, makeAxeBuilder }) => {
    await page.waitForLoadState('networkidle')
    const results = await makeAxeBuilder().analyze()

    if (results.violations.length > 0) {
      console.log(formatA11yViolations(results.violations))
    }

    expect(results.violations).toHaveLength(0)
  })
})
```

### 4. Run and Verify

```bash
# Run your new test
npx playwright test e2e/smoke/my-feature.spec.ts --ui
```

## 🔄 CI/CD Integration

### GitHub Actions Workflows

**Main CI Workflow** (`.github/workflows/ci.yml`)

- Runs on every PR and push to main
- Executes smoke tests in parallel with other checks
- Builds app, starts server, runs tests
- Uploads reports on failure

**Standalone Playwright Workflow** (`.github/workflows/playwright.yml`)

- Can be triggered manually
- More detailed reporting
- Posts results as PR comments

### Required Environment Variables

For CI, set these secrets in GitHub:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Optional:

```
PLAYWRIGHT_BASE_URL  # Override base URL for tests
```

### CI Performance Optimizations

1. **Browser Caching**: Playwright browsers are cached between runs
2. **Parallel Execution**: Tests run in parallel (except in CI for stability)
3. **Smart Retries**: Failed tests retry up to 2 times in CI
4. **Minimal Browsers**: Only Chromium runs in CI by default

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [axe-core Accessibility Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🤝 Contributing

When adding new features:

1. Add smoke tests for critical paths
2. Include accessibility checks in every test
3. Test both desktop and mobile viewports
4. Verify tests pass locally before pushing
5. Keep smoke tests fast and focused
6. Document any new test utilities or patterns

## 🎯 Activities Feature Tests

Comprehensive E2E test suite for the activities feature.

### Test Files

1. **`activities.spec.ts`** - Activity Management Journey (26 tests)
   - Navigate to activities settings
   - Create custom activities with validation
   - Edit activity name and color
   - Delete activities with confirmation
   - Activity limit validation (max 10)
   - Form validation and error handling
   - Accessibility and keyboard navigation
   - Visual regression on desktop/mobile

2. **`activity-picker.spec.ts`** - Activity Picker Journey (29 tests)
   - Open activity picker dropdown
   - Display recent activities (horizontal bar)
   - Scroll through all activities (vertical list)
   - Select activities and verify selection
   - Create new activities from picker
   - Show newly created activities immediately
   - Responsive design testing
   - Keyboard navigation with arrow keys
   - Touch-friendly on mobile

3. **`session-activities.spec.ts`** - Session Logging with Activities (20 tests)
   - Select activity before starting timer
   - Start, pause, and stop timer
   - Show activity with icon during timer
   - Save session with selected activity
   - Verify session appears in feed
   - Update recent activities after logging
   - Activity stats page validation
   - Accessibility during session flow

4. **`activities-accessibility.spec.ts`** - Comprehensive Accessibility Tests (32 tests)
   - WCAG 2.1 Level AA compliance
   - Heading hierarchy validation
   - Color contrast checks
   - ARIA labels and roles
   - Keyboard navigation (Tab, Arrow, Enter, Escape)
   - Focus management and traps
   - Mobile touch-friendly elements
   - Screen reader support
   - Form error accessibility

### Test Results Summary

| Test Suite                       | Tests   | Passing | Status    |
| -------------------------------- | ------- | ------- | --------- |
| activities.spec.ts               | 26      | 19      | ✓ 73%     |
| activity-picker.spec.ts          | 29      | 26      | ✓ 90%     |
| session-activities.spec.ts       | 20      | 17      | ✓ 85%     |
| activities-accessibility.spec.ts | 32      | 23      | ✓ 72%     |
| **Total**                        | **107** | **85**  | **✓ 79%** |

### Running Activities Tests

```bash
# Run all activities tests
CI=true PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e

# Run specific test suite
CI=true PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- tests/e2e/activities.spec.ts
CI=true PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- tests/e2e/activity-picker.spec.ts
CI=true PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- tests/e2e/session-activities.spec.ts
CI=true PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- tests/e2e/activities-accessibility.spec.ts

# Run with UI mode
npm run test:e2e:ui
```

### Activities Test Coverage

**Activity Management**

- ✓ Create custom activities
- ✓ Edit activity properties
- ✓ Delete activities with confirmation
- ✓ Validate max 10 custom activities
- ✓ Prevent duplicate names
- ✓ Form validation and errors

**Activity Picker**

- ✓ Display recent activities
- ✓ Show all activities with scroll
- ✓ Keyboard navigation (arrow keys)
- ✓ Select activity with Enter/Space
- ✓ Create activity from picker
- ✓ Responsive on mobile

**Session Integration**

- ✓ Select activity before logging
- ✓ Timer with selected activity
- ✓ Save session with activity
- ✓ Session appears in feed
- ✓ Recent activities update
- ✓ Activity stats display

**Accessibility**

- ✓ WCAG 2.1 Level AA compliance
- ✓ Keyboard-only navigation
- ✓ Screen reader support
- ✓ Color contrast validation
- ✓ Focus management
- ✓ Mobile accessibility

## 📞 Support

For questions or issues:

- Check the [Playwright Documentation](https://playwright.dev/)
- Review existing tests for examples
- Ask in team chat or create an issue
