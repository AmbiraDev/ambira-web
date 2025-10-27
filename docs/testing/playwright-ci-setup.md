# Playwright Smoke Tests - CI/CD Setup

This document describes the Playwright smoke test integration in the CI/CD pipeline.

## Overview

Playwright smoke tests run automatically on every pull request and push to the main branch, ensuring critical user paths remain functional and accessible.

## Test Coverage

### Critical Pages Tested

1. **Feed Page** (`/`)
   - Landing page and main feed
   - Navigation elements
   - Responsive design
   - Accessibility compliance

2. **Timer Page** (`/timer`)
   - Timer interface and controls
   - Authentication handling
   - Mobile responsiveness
   - Accessibility compliance

3. **Authentication Flows**
   - Login/signup interfaces
   - Form validation
   - Protected route handling
   - Accessibility compliance

### What's Validated

For each critical page, tests verify:

- ✅ Page loads without errors
- ✅ Core UI elements are visible
- ✅ No critical console errors
- ✅ WCAG 2.0/2.1 Level AA accessibility compliance
- ✅ Mobile responsiveness (no horizontal scroll)
- ✅ Keyboard navigation works
- ✅ Proper semantic HTML structure

## CI Workflow Integration

### Main CI Pipeline

File: `.github/workflows/ci.yml`

```yaml
jobs:
  playwright:
    name: Playwright Smoke Tests
    runs-on: ubuntu-latest
    needs: install
    timeout-minutes: 15
```

### Execution Flow

1. **Install Dependencies** (shared with other jobs)
   - Cached for performance
   - Restores from previous runs when possible

2. **Install Playwright Browsers**
   - Chromium only (for speed)
   - Cached based on Playwright version
   - System dependencies installed as needed

3. **Build Application**
   - Production build with `SKIP_ENV_VALIDATION=true`
   - Build artifacts cached

4. **Start Server**
   - Runs `npm run start` in background
   - Waits up to 60s for server ready
   - Uses curl to check health

5. **Run Tests**
   - Executes all smoke tests in `e2e/smoke/`
   - Runs in Chromium browser
   - Parallel execution disabled for CI stability
   - Up to 2 retries on failure

6. **Upload Artifacts**
   - HTML test report
   - Screenshots of failures
   - Videos of failed tests
   - Test result files

### Standalone Playwright Workflow

File: `.github/workflows/playwright.yml`

- Can be triggered manually via workflow dispatch
- More detailed reporting
- Posts test results as PR comments
- Useful for debugging test failures

## Performance Optimizations

### Caching Strategy

1. **Node Modules**: Cached across all jobs
2. **Playwright Browsers**: Cached by version
3. **Build Artifacts**: Shared between jobs

### Resource Limits

- **Timeout**: 15 minutes per test run
- **Retries**: 2 attempts in CI, 0 locally
- **Parallelization**: Disabled in CI for consistency
- **Browser**: Chromium only (fastest)

### Typical Run Time

- Install dependencies: ~30s (cached) / ~2m (uncached)
- Install Playwright browsers: ~10s (cached) / ~1m (uncached)
- Build application: ~1-2m
- Run smoke tests: ~2-3m
- **Total**: ~3-5 minutes (with cache)

## Failure Handling

### Automatic Retries

Tests automatically retry up to 2 times in CI:
- Handles transient network issues
- Deals with timing inconsistencies
- Reduces false positives

### Failure Artifacts

When tests fail, CI uploads:

1. **HTML Report**: Interactive report with details
2. **Screenshots**: Last state before failure
3. **Videos**: Full recording of failed test
4. **Trace Files**: Step-by-step execution trace

### Accessing Artifacts

1. Navigate to failed GitHub Actions run
2. Scroll to "Artifacts" section
3. Download `playwright-report` or `playwright-results`
4. Open `index.html` in browser

## Required Secrets

Configure these in GitHub repository settings (Settings → Secrets):

### Firebase Configuration

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Optional Secrets

```
PLAYWRIGHT_BASE_URL  # Override test target URL
```

## Local Testing Before CI

### Quick Validation

Run the same tests that CI will run:

```bash
# Install browsers (first time only)
npx playwright install chromium

# Build the app
npm run build

# Start the production server
npm run start

# In another terminal, run smoke tests
npm run test:smoke
```

### Debug Mode

Run tests with inspector for debugging:

```bash
# Start dev server
npm run dev

# Run tests in debug mode
npm run test:e2e:debug
```

### UI Mode

Interactive test runner with time-travel debugging:

```bash
# Start dev server
npm run dev

# Run tests in UI mode
npm run test:e2e:ui
```

## Accessibility Compliance

### Standards Tested

All pages must comply with:
- WCAG 2.0 Level A
- WCAG 2.0 Level AA
- WCAG 2.1 Level A
- WCAG 2.1 Level AA

### Common Accessibility Issues

Tests check for:
- Missing alt text on images
- Insufficient color contrast
- Missing ARIA labels
- Improper heading hierarchy
- Keyboard navigation issues
- Missing form labels
- Non-semantic HTML

### Handling Accessibility Failures

When tests fail due to accessibility issues:

1. **Review the Report**: Check the HTML report for violation details
2. **Identify Elements**: Find the specific elements causing issues
3. **Fix the Code**: Update components to meet WCAG standards
4. **Re-test Locally**: Run `npm run test:smoke` to verify fixes
5. **Push Changes**: CI will re-run tests automatically

## Monitoring and Maintenance

### Test Health Metrics

Monitor these metrics in GitHub Actions:

- **Pass Rate**: Should be >95%
- **Duration**: Should complete in <10 minutes
- **Retry Rate**: Should be <5%
- **Flakiness**: Tests should pass consistently

### Updating Tests

When to update smoke tests:

- ✅ New critical user path added
- ✅ Major UI changes to tested pages
- ✅ Accessibility requirements change
- ✅ Performance regression detected

When NOT to update:

- ❌ Minor UI tweaks
- ❌ Non-critical features
- ❌ Backend-only changes
- ❌ CSS-only changes (unless affecting layout)

### Adding New Smoke Tests

1. Create test file in `e2e/smoke/`
2. Follow existing test patterns
3. Include accessibility checks
4. Test locally: `npx playwright test your-test.spec.ts`
5. Verify in CI after pushing

## Troubleshooting

### Tests Pass Locally but Fail in CI

**Possible Causes**:
- Environment differences
- Timing issues (network, rendering)
- Missing environment variables
- CI-specific browser behavior

**Solutions**:
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Check environment variables are set in GitHub Secrets
- Review CI logs for specific error messages
- Download trace files from CI artifacts

### Tests Are Flaky

**Possible Causes**:
- Race conditions
- Network timing
- Animation timing
- External API dependencies

**Solutions**:
- Use Playwright's auto-waiting
- Add `waitForLoadState` before assertions
- Avoid fixed timeouts (use dynamic waits)
- Mock external dependencies

### Tests Are Too Slow

**Possible Causes**:
- Too many tests
- Unnecessary waits
- Network requests
- Heavy page rendering

**Solutions**:
- Run only critical tests in smoke suite
- Remove fixed `waitForTimeout` calls
- Mock slow network requests
- Optimize page load performance

### Browser Installation Fails

**Possible Causes**:
- Cache corruption
- Playwright version mismatch
- System dependency issues

**Solutions**:
- Clear Playwright cache in CI
- Update Playwright to latest version
- Ensure system dependencies are installed

## Best Practices

### DO ✅

- Keep smoke tests fast (<5 minutes total)
- Test only critical user paths
- Include accessibility checks
- Test on mobile viewports
- Use semantic selectors (role, label, text)
- Handle both authenticated and unauthenticated states
- Upload artifacts on failure
- Monitor test pass rates

### DON'T ❌

- Test every feature in smoke tests
- Use brittle selectors (CSS classes, IDs)
- Add unnecessary waits
- Test third-party integrations in smoke tests
- Ignore accessibility violations
- Skip mobile testing
- Leave flaky tests unfixed

## Future Enhancements

Planned improvements:

1. **Visual Regression Testing**: Screenshot comparison for UI changes
2. **Performance Testing**: Core Web Vitals monitoring
3. **Cross-Browser Testing**: Safari and Firefox support
4. **Authenticated Test State**: Persistent login for faster tests
5. **Parallel Execution**: Sharded test runs for speed
6. **Test Coverage Reports**: Track test coverage metrics
7. **Automatic PR Comments**: Detailed test results in PR comments

## Resources

- [CI Workflow File](.github/workflows/ci.yml)
- [Playwright Config](../../playwright.config.ts)
- [E2E Test Directory](../../e2e/)
- [Test Documentation](../../e2e/README.md)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues or questions:

- Check test logs in GitHub Actions
- Review the [E2E Testing README](../../e2e/README.md)
- Download and inspect failure artifacts
- Run tests locally to reproduce issues
- Consult [Playwright Documentation](https://playwright.dev/)
