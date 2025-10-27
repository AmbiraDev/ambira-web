# Playwright Testing Quick Start

Get started with E2E testing in 5 minutes.

## 1. Install Playwright Browsers

First time setup only:

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers (~500MB total).

## 2. Run Smoke Tests

Start your development server in one terminal:

```bash
npm run dev
```

In another terminal, run the smoke tests:

```bash
npm run test:smoke
```

You should see tests running for:
- Feed page (`/`)
- Timer page (`/timer`)
- Authentication flows

## 3. View Test Results

After tests complete:

```bash
npm run test:e2e:report
```

This opens an interactive HTML report in your browser showing:
- Test results (pass/fail)
- Screenshots and videos
- Accessibility violations (if any)
- Test execution traces

## 4. Debug Failed Tests

If a test fails, run it in debug mode:

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests line by line
- Inspect page state at each step
- Use the selector picker
- View network activity

## 5. Interactive Testing (UI Mode)

For the best development experience:

```bash
npm run test:e2e:ui
```

This opens Playwright's UI mode with:
- Time-travel debugging
- Watch mode (auto-reruns on file changes)
- Visual test runner
- Inline traces and screenshots

## Common Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run only smoke tests
npm run test:smoke

# Run specific test file
npx playwright test e2e/smoke/feed.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=mobile-chrome

# Run tests matching a pattern
npx playwright test --grep "accessibility"

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npm run test:e2e:debug

# Open UI mode
npm run test:e2e:ui

# View last report
npm run test:e2e:report
```

## Writing Your First Test

Create a new test file in `e2e/smoke/`:

```typescript
// e2e/smoke/my-feature.spec.ts
import { test, expect } from '../fixtures/test-base';

test.describe('My Feature - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to your page
    await page.goto('/my-feature');
  });

  test('should load successfully', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should pass accessibility audit', async ({ page, makeAxeBuilder }) => {
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    const results = await makeAxeBuilder().analyze();

    // Expect no violations
    expect(results.violations).toHaveLength(0);
  });
});
```

Run your new test:

```bash
npx playwright test e2e/smoke/my-feature.spec.ts --ui
```

## Accessibility Testing

Every test should check accessibility. Use the `makeAxeBuilder` fixture:

```typescript
test('my feature', async ({ page, makeAxeBuilder }) => {
  await page.goto('/my-feature');
  await page.waitForLoadState('networkidle');

  // Run accessibility audit
  const results = await makeAxeBuilder().analyze();

  // Log violations if any
  if (results.violations.length > 0) {
    console.log('Accessibility violations:', results.violations);
  }

  // Fail test if violations found
  expect(results.violations).toHaveLength(0);
});
```

## Testing Mobile Viewports

Test responsive design:

```typescript
test('mobile viewport', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Verify no horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  expect(hasHorizontalScroll).toBe(false);
});
```

## Best Practices

### Use Semantic Selectors

```typescript
// Good ✅
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('user@example.com');
await page.getByText('Welcome').click();

// Avoid ❌
await page.locator('.submit-btn').click();
await page.locator('#email-input').fill('user@example.com');
```

### Wait for Network Idle

```typescript
// Good ✅
await page.goto('/');
await page.waitForLoadState('networkidle');

// Avoid ❌
await page.goto('/');
await page.waitForTimeout(5000);
```

### Test User Behavior

```typescript
// Good ✅
test('user can submit form', async ({ page }) => {
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Success')).toBeVisible();
});

// Avoid ❌
test('form submits', async ({ page }) => {
  await page.locator('#email').type('test@example.com');
  await page.locator('.submit').click();
  expect(await page.locator('.success').isVisible()).toBe(true);
});
```

## Troubleshooting

### Tests Pass Locally but Fail in CI

Add explicit waits:

```typescript
// Before
await page.goto('/');
const button = await page.getByRole('button');

// After
await page.goto('/');
await page.waitForLoadState('networkidle');
const button = await page.getByRole('button');
await button.waitFor({ state: 'visible' });
```

### Flaky Tests

Use Playwright's auto-waiting instead of fixed timeouts:

```typescript
// Flaky ❌
await page.waitForTimeout(1000);
await page.click('button');

// Stable ✅
await page.getByRole('button').click(); // Auto-waits for actionable state
```

### Accessibility Violations

Check the HTML report for details:

```bash
npm run test:e2e:report
```

Click on the failed test to see:
- Which elements failed
- What rules were violated
- How to fix the issues

## Next Steps

- Read the [full E2E documentation](../../e2e/README.md)
- Check out [Playwright best practices](https://playwright.dev/docs/best-practices)
- Review [CI/CD setup guide](./playwright-ci-setup.md)
- Explore [Playwright API docs](https://playwright.dev/docs/api/class-playwright)

## Resources

- [E2E Test Directory](../../e2e/)
- [Test Configuration](../../playwright.config.ts)
- [Playwright Documentation](https://playwright.dev/)
- [Accessibility Testing Guide](https://playwright.dev/docs/accessibility-testing)

## Getting Help

- Check test output and error messages
- Use debug mode: `npm run test:e2e:debug`
- Review test traces in HTML report
- Consult [Playwright docs](https://playwright.dev/)
- Ask team for help with specific issues
