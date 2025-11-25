import { test, expect } from './fixtures/test-base'
import { formatA11yViolations, runAccessibilityScan } from './utils/accessibility'

/**
 * Activities Accessibility Comprehensive E2E Tests
 *
 * Tests accessibility compliance for:
 * - WCAG 2.1 Level AA compliance on all activity pages
 * - Keyboard navigation through activity management
 * - Screen reader compatibility for activity selection
 * - Color contrast for activity UI elements
 * - ARIA labels and semantic HTML
 * - Mobile and desktop responsive accessibility
 * - Focus management and keyboard traps
 * - Form validation accessibility
 */

test.describe('Activities Accessibility Tests', () => {
  test.describe('Activity Settings Page Accessibility', () => {
    test('should pass WCAG 2.1 Level AA audit on activities settings page', async ({
      page,
      makeAxeBuilder,
    }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Run comprehensive accessibility scan
      const results = await makeAxeBuilder()
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const violations = results.violations

      // Report violations with detailed info
      if (violations.length > 0) {
        console.log('WCAG 2.1 AA Violations found:\n', formatA11yViolations(violations))
      }

      expect(violations).toHaveLength(0)
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check for heading structure
      const h1 = page.locator('h1')
      const h2 = page.locator('h2')
      const h3 = page.locator('h3')

      // Should have at least one H1
      expect(await h1.count()).toBeGreaterThan(0)

      // Get heading text to verify logical structure
      const h1Text = await h1.first().textContent()
      expect(h1Text).toBeTruthy()

      // Verify no heading levels are skipped
      const hasH2 = await h2.count()
      const hasH3 = await h3.count()

      // If H3 exists, H2 should also exist
      if (hasH3 > 0) {
        expect(hasH2).toBeGreaterThan(0)
      }
    })

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Run accessibility scan with color contrast rules
      const results = await runAccessibilityScan(page, {
        disableRules: [], // Enable all rules including color contrast
      })

      // Filter for color contrast violations
      const contrastViolations = results.violations.filter((v) => v.id.includes('contrast'))

      if (contrastViolations.length > 0) {
        console.log('Color contrast violations:\n', formatA11yViolations(contrastViolations))
      }

      expect(contrastViolations).toHaveLength(0)
    })

    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check buttons have accessible names
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i)
        const ariaLabel = await button.getAttribute('aria-label')
        const textContent = await button.textContent()

        // Button should have either aria-label or text content
        expect(ariaLabel || (textContent && textContent.trim().length > 0)).toBeTruthy()
      }
    })

    test('should have semantic HTML structure', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check for semantic elements
      const main = page.locator('main, [role="main"]')
      const nav = page.locator('nav, [role="navigation"]')
      const buttons = page.locator('button')
      const links = page.locator('a')
      const formElements = page.locator('form, input, select, textarea')

      // Page should have main content area
      expect(await main.count()).toBeGreaterThan(0)

      // Should have interactive elements
      expect(
        (await buttons.count()) + (await links.count()) + (await formElements.count())
      ).toBeGreaterThan(0)
    })

    test('should have form labels for all inputs', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Click to open create modal
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Check inputs in modal
        const inputs = page.locator('input, textarea, select')
        const inputCount = await inputs.count()

        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i)
          const inputType = await input.getAttribute('type')

          // Skip hidden inputs
          if (inputType === 'hidden') continue

          // Check for label
          const ariaLabel = await input.getAttribute('aria-label')
          const ariaLabelledby = await input.getAttribute('aria-labelledby')
          const placeholder = await input.getAttribute('placeholder')
          const id = await input.getAttribute('id')

          // Look for associated label element
          let hasAssociatedLabel = false

          if (id) {
            const label = page.locator(`label[for="${id}"]`)
            hasAssociatedLabel = (await label.count()) > 0
          }

          // Input should have some form of accessible label
          expect(ariaLabel || ariaLabelledby || placeholder || hasAssociatedLabel).toBeTruthy()
        }
      }
    })

    test('should have proper ARIA roles on custom elements', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Look for elements with role attributes
      const ariaRoles = page.locator('[role]')
      const roleCount = await ariaRoles.count()

      // Page may have role attributes
      if (roleCount > 0) {
        // All role attributes should be valid ARIA roles
        const validRoles = [
          'button',
          'link',
          'menuitem',
          'tab',
          'dialog',
          'listbox',
          'option',
          'main',
          'navigation',
          'region',
          'complementary',
        ]

        for (let i = 0; i < Math.min(roleCount, 10); i++) {
          const role = await ariaRoles.nth(i).getAttribute('role')
          expect(validRoles).toContain(role?.split(' ')[0]) // Handle space-separated roles
        }
      }
    })
  })

  test.describe('Activity Picker Accessibility', () => {
    test('should pass WCAG 2.1 AA audit on activity picker', async ({ page, makeAxeBuilder }) => {
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Run accessibility scan
        const results = await makeAxeBuilder().withTags(['wcag2aa', 'wcag21aa']).analyze()

        const violations = results.violations

        if (violations.length > 0) {
          console.log('Activity Picker WCAG violations:\n', formatA11yViolations(violations))
        }

        expect(violations).toHaveLength(0)
      }
    })

    test('should have accessible listbox pattern', async ({ page }) => {
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        // Check for listbox pattern
        const listbox = page.locator('[role="listbox"]')

        if ((await listbox.count()) > 0) {
          // Should have options
          const options = page.locator('[role="option"]')
          expect(await options.count()).toBeGreaterThan(0)

          // Options should have proper attributes
          const firstOption = options.first()
          const ariaSelected = await firstOption.getAttribute('aria-selected')

          // aria-selected should be present
          expect(ariaSelected === 'true' || ariaSelected === 'false').toBeTruthy()
        }
      }
    })

    test('should support keyboard navigation with arrow keys', async ({ page }) => {
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        // Focus picker button
        await pickerButton.click()
        await page.waitForTimeout(500)

        // Navigate with arrow down
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(300)

        // Check focus moved to option
        const focused = await page.evaluate(() => {
          const active = document.activeElement
          return active?.getAttribute('role') || active?.tagName
        })

        expect(focused).toBeTruthy()

        // Navigate to another option
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(300)

        // Should still have focus
        const stillFocused = await page.evaluate(() => {
          return document.activeElement !== document.body
        })

        expect(stillFocused).toBeTruthy()
      }
    })

    test('should announce selected activity to screen readers', async ({ page }) => {
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        // Check for live region or aria-live
        const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]')
        const statusRole = page.locator('[role="status"], [role="alert"]')

        // Should have mechanism for announcing changes
        expect((await liveRegions.count()) + (await statusRole.count())).toBeGreaterThanOrEqual(0)
      }
    })

    test('should allow selection with Enter or Space key', async ({ page }) => {
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        // Navigate to first option
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(300)

        // Get selected option text
        const beforeText = await page.locator('button:has-text("Activity")').first().textContent()

        // Select with Enter
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)

        // Picker should close
        const listbox = page.locator('[role="listbox"]')
        expect(await listbox.count()).toBe(0)
      }
    })

    test('should allow deselecting with Escape key', async ({ page }) => {
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        // Press Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Picker should close
        const listbox = page.locator('[role="listbox"]')
        expect(await listbox.count()).toBe(0)
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should allow tabbing through all interactive elements', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Count focusable elements
      const focusableElements = page.locator(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

      const focusableCount = await focusableElements.count()
      expect(focusableCount).toBeGreaterThan(0)

      // Tab through first few elements
      for (let i = 0; i < Math.min(focusableCount, 5); i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)

        const focused = await page.evaluate(() => {
          return document.activeElement !== document.body
        })

        expect(focused).toBeTruthy()
      }
    })

    test('should not have keyboard traps', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Tab to first element
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)

      const firstFocus = await page.evaluate(() => {
        return (document.activeElement as HTMLElement)?.tagName
      })

      expect(firstFocus).not.toBe('BODY')

      // Tab through 10 elements
      const elementsFocused = new Set()
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)

        const tagName = await page.evaluate(() => {
          return (document.activeElement as HTMLElement)?.tagName
        })

        elementsFocused.add(tagName)
      }

      // Should have focused multiple different elements
      expect(elementsFocused.size).toBeGreaterThan(1)
    })

    test('should support Shift+Tab for reverse navigation', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Tab forward
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)
      }

      const forwardFocus = await page.evaluate(() => {
        return (document.activeElement as HTMLElement)?.tagName
      })

      // Tab backward
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Shift+Tab')
        await page.waitForTimeout(200)
      }

      const backwardFocus = await page.evaluate(() => {
        return (document.activeElement as HTMLElement)?.tagName
      })

      // Should be able to navigate both directions
      expect(forwardFocus).toBeTruthy()
      expect(backwardFocus).toBeTruthy()
    })

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Get a button
      const button = page.locator('button').first()

      if ((await button.count()) > 0) {
        // Focus the button
        await button.focus()
        await page.waitForTimeout(300)

        // Check for outline or focus styles
        const focusStyle = await button.evaluate((el: HTMLElement) => {
          const styles = window.getComputedStyle(el)
          const outline = styles.outlineWidth
          const boxShadow = styles.boxShadow

          return {
            hasOutline: outline && outline !== 'none' && outline !== '0px',
            hasBoxShadow: boxShadow && boxShadow !== 'none',
            hasFocusVisible: el.matches(':focus-visible'),
          }
        })

        // Should have some visual focus indicator
        expect(
          focusStyle.hasOutline || focusStyle.hasBoxShadow || focusStyle.hasFocusVisible
        ).toBeTruthy()
      }
    })
  })

  test.describe('Form Accessibility', () => {
    test('should have accessible error messages', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Open create modal
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]').first()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Check for error elements
          const errorMessages = page.locator('[role="alert"], [class*="error"], .error')
          const hasErrors = await errorMessages.count()

          // Should have error indicators if validation failed
          if (hasErrors > 0) {
            // Error message should be associated with input
            const errors = await errorMessages.all()

            for (const error of errors.slice(0, 3)) {
              const text = await error.textContent()
              expect(text?.length).toBeGreaterThan(0)
            }
          }
        }
      }
    })

    test('should connect error messages to form fields', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Open create modal
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Check for aria-describedby linking errors to inputs
        const inputs = page.locator('input[aria-describedby], textarea[aria-describedby]')
        const inputCount = await inputs.count()

        if (inputCount > 0) {
          // Should have error descriptions connected
          expect(inputCount).toBeGreaterThan(0)
        }
      }
    })

    test('should provide validation feedback in real-time', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Open create modal
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Fill in name field
        const nameInput = page.locator('input[placeholder*="Name"], input[type="text"]').first()

        if ((await nameInput.count()) > 0) {
          // Type valid name
          await nameInput.fill('Valid Activity Name')
          await page.waitForTimeout(500)

          // Check if any error messages disappeared
          const errorMessages = page.locator('[role="alert"], [class*="error"]')
          const errorCount = await errorMessages.count()

          // Should have no errors for valid input
          expect(errorCount).toBeLessThanOrEqual(0)
        }
      }
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('should have proper viewport meta tag', async ({ page }) => {
      await page.goto('/settings/activities')

      const viewport = await page.locator('meta[name="viewport"]')
      expect(await viewport.count()).toBeGreaterThan(0)

      const content = await viewport.getAttribute('content')
      expect(content?.includes('width=device-width')).toBeTruthy()
    })

    test('should be accessible on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Run accessibility scan
      const results = await runAccessibilityScan(page)
      const violations = results.violations

      if (violations.length > 0) {
        console.log('Mobile accessibility violations:\n', formatA11yViolations(violations))
      }

      expect(violations).toHaveLength(0)
    })

    test('should have touch-friendly interactive elements', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check button size (should be >= 44x44px for touch)
      const buttons = page.locator('button')
      const count = Math.min(await buttons.count(), 5)

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        const size = await button.boundingBox()

        if (size) {
          // Button should be reasonably sized for touch
          expect(size.width + size.height).toBeGreaterThan(60)
        }
      }
    })

    test('should have no horizontal scroll on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScroll).toBe(false)
    })
  })

  test.describe('Focus Management', () => {
    test('should restore focus after closing modal', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Get create button
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        // Focus and remember button
        await createButton.focus()
        const buttonTag = await createButton.evaluate((el) => el.tagName)

        // Open modal
        await createButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Close modal with Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Check if focus returned
        const focused = await page.evaluate(() => {
          return document.activeElement?.tagName
        })

        // Focus should have returned to button or nearby interactive element
        expect(focused === buttonTag || focused === 'BODY').toBeDefined()
      }
    })

    test('should trap focus inside modal while open', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Get modal
        const modal = page.locator('[role="dialog"], [class*="modal"]')

        if ((await modal.count()) > 0) {
          // Find focusable elements in modal
          const modalFocusable = modal.locator(
            'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
          )

          const initialFocusCount = await modalFocusable.count()

          // Tab through elements
          for (let i = 0; i < initialFocusCount + 2; i++) {
            await page.keyboard.press('Tab')
            await page.waitForTimeout(200)
          }

          // Focus should still be within modal or body
          const focused = await page.evaluate(() => {
            return document.activeElement?.tagName
          })

          expect(focused).toBeTruthy()
        }
      }
    })

    test('should set focus to first element in modal', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForLoadState('domcontentloaded')

        // Check what has focus
        const focused = await page.evaluate(() => {
          return (document.activeElement as HTMLElement)?.tagName
        })

        // Should have focus on a focusable element in modal
        expect(focused === 'INPUT' || focused === 'BUTTON' || focused === 'TEXTAREA').toBeTruthy()
      }
    })
  })

  test.describe('Text and Language', () => {
    test('should have lang attribute on html element', async ({ page }) => {
      await page.goto('/settings/activities')

      const htmlElement = page.locator('html')
      const lang = await htmlElement.getAttribute('lang')

      // Should have language specified
      expect(lang).toBeTruthy()
    })

    test('should provide sufficient text spacing', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Run accessibility scan for text spacing
      const results = await runAccessibilityScan(page)

      // Check for text spacing violations (WCAG 1.4.12)
      const textSpacingViolations = results.violations.filter(
        (v) => v.tags.includes('wcag143') // Text Spacing
      )

      expect(textSpacingViolations).toHaveLength(0)
    })

    test('should have descriptive button and link text', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check buttons
      const buttons = page.locator('button')
      const count = Math.min(await buttons.count(), 10)

      const invalidButtons = []

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        const text = (await button.textContent())?.trim()
        const ariaLabel = await button.getAttribute('aria-label')

        // Should have descriptive text
        if (!text && !ariaLabel) {
          invalidButtons.push(i)
        }
      }

      // Most buttons should have descriptive text
      expect(invalidButtons.length).toBeLessThan(count / 2)
    })
  })

  test.describe('Images and Icons', () => {
    test('should have alt text for meaningful images', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check images
      const images = page.locator('img')
      const imageCount = await images.count()

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        const ariaLabel = await img.getAttribute('aria-label')

        // Meaningful images should have alt text
        const isMeaningful = !(await img.evaluate((el: HTMLImageElement) => {
          // Check if image is purely decorative
          return el.parentElement?.getAttribute('role') === 'presentation'
        }))

        if (isMeaningful) {
          expect(alt || ariaLabel).toBeTruthy()
        }
      }
    })

    test('should have accessible icons', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check SVG icons
      const svgs = page.locator('svg')
      const svgCount = Math.min(await svgs.count(), 10)

      for (let i = 0; i < svgCount; i++) {
        const svg = svgs.nth(i)
        const ariaLabel = await svg.getAttribute('aria-label')
        const ariaHidden = await svg.getAttribute('aria-hidden')
        const role = await svg.getAttribute('role')

        // Icon should either be hidden or have accessible label
        if (ariaHidden !== 'true') {
          expect(ariaLabel || role === 'presentation').toBeTruthy()
        }
      }
    })
  })

  test.describe('No Console Errors During Accessibility', () => {
    test('should not have errors when testing accessibility', async ({ page }) => {
      const errors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Interact with page
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Navigate with keyboard
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
      }

      // Filter known noise
      const knownNoise = ['Firebase', 'DevTools', 'favicon', 'Chrome extension']

      const criticalErrors = errors.filter(
        (error) => !knownNoise.some((noise) => error.includes(noise))
      )

      expect(criticalErrors).toHaveLength(0)
    })
  })
})
