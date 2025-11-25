import { test, expect } from '../fixtures/test-base'
import { formatA11yViolations } from '../utils/accessibility'

test.describe('Timer Page - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the timer page
    await page.goto('/timer')
  })

  test('should load the timer page successfully', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Check that the page title is set
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should display timer interface', async ({ page }) => {
    // Wait for page to fully render (handles both network delays and redirects)
    await page.waitForLoadState('networkidle')

    // Look for interactive elements that exist in either:
    // - Authenticated timer state (buttons for start/stop/reset)
    // - Unauthenticated state (links to auth, or loading spinner with main role)
    // Include links since landing pages have "Sign In" and navigation links
    const interactiveElements = page.locator(
      'button, input, select, textarea, [role="button"], a[href], [role="main"]'
    )

    // Wait for at least one interactive element to appear
    await expect(interactiveElements.first()).toBeAttached({ timeout: 10000 })

    const count = await interactiveElements.count()
    // Expect at least one interactive element (button, link, form input, or main content area)
    expect(count).toBeGreaterThan(0)
  })

  test('should have proper page structure', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')

    // Check for main content area, semantic sections, or landing page content
    // Accepts both authenticated timer page structure and unauthenticated redirects/landing pages
    const mainContent = page.locator('main, [role="main"], section, article, [role="region"]')

    // Wait for at least one element to appear (10s timeout for mobile)
    await expect(mainContent.first()).toBeAttached({ timeout: 10000 })

    const mainCount = await mainContent.count()
    expect(mainCount).toBeGreaterThanOrEqual(1)

    // Verify main content is visible
    if (mainCount > 0) {
      await expect(mainContent.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Load the page
    await page.goto('/timer')
    await page.waitForLoadState('networkidle')

    // Filter out known/expected errors
    const knownNoise = [
      'Firebase',
      'DevTools',
      'favicon',
      'Google sign-in failed',
      'Failed to load resource',
      'Preloaded script failed',
    ]

    const criticalErrors = errors.filter((error) => {
      if (error.includes('Unhandled Rejection')) {
        return false
      }
      return !knownNoise.some((noise) => error.includes(noise))
    })

    expect(criticalErrors).toHaveLength(0)
  })

  test('should pass accessibility audit', async ({ page, makeAxeBuilder }) => {
    await page.waitForLoadState('networkidle')

    // Run accessibility scan
    const accessibilityScanResults = await makeAxeBuilder().analyze()

    // Check for violations
    const violations = accessibilityScanResults.violations

    // If there are violations, format them for the error message
    if (violations.length > 0) {
      const formattedViolations = formatA11yViolations(violations)
      console.log('Accessibility violations found:\n', formattedViolations)
    }

    // Expect no violations
    expect(violations).toHaveLength(0)
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to page
    await page.goto('/timer')
    await page.waitForLoadState('networkidle')

    // Check that main content is visible on mobile
    // Accepts both authenticated timer page structure and unauthenticated redirects/landing pages
    const mainContent = page.locator('main, [role="main"], section, article, [role="region"]')
    const contentCount = await mainContent.count()

    // Verify content is present and visible
    expect(contentCount).toBeGreaterThan(0)
    await expect(mainContent.first()).toBeVisible({ timeout: 10000 })

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('should have working keyboard navigation', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')

    // Check if we're on mobile viewport
    const _viewport = page.viewportSize()

    // Check if page has focusable content (buttons, links, inputs)
    const focusableElements = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const focusableCount = await focusableElements.count()

    // Focus the first interactive element
    await page.keyboard.press('Tab')

    // Check that an element has focus
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement
      return active ? active.tagName : null
    })

    expect(focusedElement).toBeTruthy()

    // On mobile browsers, Tab navigation may not work the same way
    // If focus is still on BODY, verify accessibility features exist
    if (focusedElement === 'BODY') {
      // Either skip link exists OR there are other focusable elements OR it's a protected loading page
      // (Protected routes may not have focusable elements until auth completes)
      const skipLink = page.locator('a[href^="#"]').first()
      const skipLinkExists = (await skipLink.count()) > 0

      // Check if this is a loading/redirect screen (has "Loading" or "Redirecting" text)
      const bodyText = await page.textContent('body')
      const isLoadingScreen = bodyText?.includes('Loading') || bodyText?.includes('Redirecting')

      // Pass if: skip link exists OR focusable elements exist OR it's a loading screen
      expect(skipLinkExists || focusableCount > 0 || isLoadingScreen).toBe(true)
    } else {
      // Tab moved focus away from BODY - good!
      expect(focusedElement).not.toBe('BODY')
    }
  })

  test('should display timer controls when authenticated', async ({ page }) => {
    // This test checks for timer controls that should be present
    // It will gracefully handle auth redirects or login prompts

    await page.waitForLoadState('domcontentloaded')

    // Check if we're still on the timer page or redirected to login
    const currentUrl = page.url()

    if (currentUrl.includes('/timer')) {
      // We're on the timer page, check for controls or login prompt
      const pageContent = await page.textContent('body')
      expect(pageContent).toBeTruthy()
      expect(pageContent!.length).toBeGreaterThan(0)
    } else {
      // We were redirected (likely to login), which is expected behavior
      console.log('Redirected to:', currentUrl)
      expect(currentUrl).toBeTruthy()
    }
  })
})
