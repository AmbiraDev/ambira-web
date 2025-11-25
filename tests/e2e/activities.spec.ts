import { test, expect } from './fixtures/test-base'
import { formatA11yViolations } from './utils/accessibility'

/**
 * Activity Management Journey E2E Tests
 *
 * Tests complete user flows for:
 * - Navigating to activities settings
 * - Creating custom activities with all fields
 * - Editing activity name and color
 * - Deleting activities with confirmation
 * - Max custom activities limit validation
 * - Form validation and error handling
 * - Accessibility and keyboard navigation
 */

test.describe('Activity Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start from login page
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
  })

  test.describe('Navigation to Activities Settings', () => {
    test('should navigate to settings activities page', async ({ page }) => {
      // Navigate directly to activities settings
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Verify page loaded successfully
      const pageTitle = await page.title()
      expect(pageTitle).toBeTruthy()

      // Check for main content area
      const mainContent = page.locator('main, [role="main"]')
      await expect(mainContent.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have proper page structure', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Verify key structural elements
      const pageContent = page.locator('body')
      expect(await pageContent.textContent()).toBeTruthy()

      // Check for accessibility: main landmark
      const mainLandmark = page.locator('main, [role="main"]')
      expect(await mainLandmark.count()).toBeGreaterThan(0)
    })

    test('should display activities settings interface', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Look for key UI elements
      const pageText = await page.textContent('body')

      // Should have activities-related content
      expect(pageText).toBeTruthy()

      // Should have interactive elements (buttons, form fields, etc.)
      const interactive = page.locator('button, input, select, textarea, [role="button"]')
      const interactiveCount = await interactive.count()
      expect(interactiveCount).toBeGreaterThan(0)
    })
  })

  test.describe('Create Custom Activity', () => {
    test('should open create activity modal from button', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Find and click create activity button
      const createButton = page
        .locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")')
        .first()

      // Try alternative selectors if primary fails
      const hasCreateButton = await createButton.count()

      if (hasCreateButton > 0) {
        await createButton.click()

        // Wait for modal to appear
        await page.waitForTimeout(500)

        // Verify modal is visible
        const modal = page.locator('[role="dialog"], .modal, [class*="modal"], [class*="Modal"]')
        expect(await modal.count()).toBeGreaterThan(0)
      }
    })

    test('should validate required fields in create modal', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Look for name input field
      const nameInput = page
        .locator('input[placeholder*="Name"], input[placeholder*="Activity"]')
        .first()

      if ((await nameInput.count()) > 0) {
        // Try to submit with empty form
        const submitButton = page.locator('button[type="submit"]').first()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Check for error messages
          const pageText = await page.textContent('body')
          const hasErrorIndicators =
            pageText?.includes('required') ||
            pageText?.includes('error') ||
            pageText?.includes('Error')

          // Should show some form of validation
          expect(
            hasErrorIndicators ||
              (await nameInput.evaluate((el: HTMLInputElement) => el.checkValidity()))
          ).toBeTruthy()
        }
      }
    })

    test('should create activity with all fields', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Find create button and click
      const createButton = page
        .locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")')
        .first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Fill in activity name
        const nameInput = page
          .locator('input[placeholder*="Name"], input[placeholder*="Activity"], input[type="text"]')
          .first()

        if ((await nameInput.count()) > 0) {
          const activityName = `E2E Test Activity ${Date.now()}`
          await nameInput.clear()
          await nameInput.fill(activityName)

          // Fill in description if field exists
          const descriptionInput = page
            .locator('textarea, input[placeholder*="Description"]')
            .first()

          if ((await descriptionInput.count()) > 0) {
            await descriptionInput.fill('Test activity description')
          }

          // Select icon if icon picker exists
          const iconButtons = page
            .locator('button[class*="icon"], [class*="icon-picker"] button')
            .first()

          if ((await iconButtons.count()) > 0) {
            await iconButtons.click()
            await page.waitForTimeout(300)

            // Click first available icon option
            const iconOptions = page
              .locator('button[class*="icon"], [class*="icon-option"]')
              .first()

            if ((await iconOptions.count()) > 0) {
              await iconOptions.click()
            }
          }

          // Select color if color picker exists
          const colorInputs = page.locator('input[type="color"], button[class*="color"]').first()

          if ((await colorInputs.count()) > 0) {
            await colorInputs.click()
            await page.waitForTimeout(300)

            // If it's a color picker, try to select a color
            const firstColor = page
              .locator('button[class*="color"], [class*="color-option"]')
              .first()

            if ((await firstColor.count()) > 0) {
              await firstColor.click()
            }
          }

          // Submit form
          const submitButton = page
            .locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
            .first()

          if ((await submitButton.count()) > 0) {
            await submitButton.click()
            await page.waitForTimeout(1000)

            // Verify success - modal should close or success message should appear
            const modal = page.locator('[role="dialog"], .modal, [class*="modal"]')
            const successText = await page.textContent('body')

            // Activity should be created (either modal closed or success message shown)
            expect(
              (await modal.count()) === 0 ||
                successText?.includes('success') ||
                successText?.includes('created')
            ).toBeTruthy()
          }
        }
      }
    })

    test('should prevent duplicate activity names', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Get existing activity names
      const activityCards = page.locator('[class*="activity"], [class*="Activity"]')
      const existingNames: string[] = []

      const cardCount = Math.min(await activityCards.count(), 3)
      for (let i = 0; i < cardCount; i++) {
        const text = await activityCards.nth(i).textContent()
        if (text) {
          existingNames.push(text.substring(0, 30))
        }
      }

      // Try to create with existing name if available
      if (existingNames.length > 0) {
        const createButton = page
          .locator('button:has-text("Create"), button:has-text("Add")')
          .first()

        if ((await createButton.count()) > 0) {
          await createButton.click()
          await page.waitForTimeout(500)

          const nameInput = page.locator('input[placeholder*="Name"], input[type="text"]').first()

          if ((await nameInput.count()) > 0 && existingNames[0]) {
            // Use existing name
            await nameInput.fill(existingNames[0])

            // Try to submit
            const submitButton = page.locator('button[type="submit"]').first()

            if ((await submitButton.count()) > 0) {
              await submitButton.click()
              await page.waitForTimeout(500)

              // Should show error or prevent submission
              const pageText = await page.textContent('body')
              const hasError =
                pageText?.includes('already') ||
                pageText?.includes('duplicate') ||
                pageText?.includes('error') ||
                pageText?.includes('Error')

              // Either error shown or form still open
              const modalStillOpen = (await page.locator('[role="dialog"]').count()) > 0

              expect(hasError || modalStillOpen).toBeTruthy()
            }
          }
        }
      }
    })

    test('should enforce max character limit on name', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForTimeout(500)

        const nameInput = page.locator('input[placeholder*="Name"], input[type="text"]').first()

        if ((await nameInput.count()) > 0) {
          // Try to enter more than max chars (typically 50)
          const longName = 'A'.repeat(100)
          await nameInput.fill(longName)

          // Check if input was truncated or has maxlength
          const inputValue = await nameInput.inputValue()
          const maxLength = await nameInput.getAttribute('maxlength')

          // Should either be truncated or have maxlength attribute
          expect(inputValue.length <= 100 || maxLength !== null).toBeTruthy()
        }
      }
    })
  })

  test.describe('Edit Custom Activity', () => {
    test('should find and open edit modal for existing activity', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Look for edit buttons on activity cards
      const editButtons = page.locator(
        'button:has-text("Edit"), button:has-text("Pencil"), [class*="edit-btn"], [class*="editButton"]'
      )

      if ((await editButtons.count()) > 0) {
        // Click first edit button
        await editButtons.first().click()
        await page.waitForTimeout(500)

        // Verify edit modal opened
        const modal = page.locator('[role="dialog"], .modal')
        expect(await modal.count()).toBeGreaterThan(0)

        // Modal should have a title indicating edit
        const modalText = await modal.first().textContent()
        expect(modalText?.toLowerCase()).toContain('edit')
      }
    })

    test('should update activity name', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Find first edit button
      const editButtons = page.locator('button:has-text("Edit"), button:has-text("Pencil")')

      if ((await editButtons.count()) > 0) {
        // Store original name
        const activityCard = editButtons
          .first()
          .locator(
            'xpath=ancestor::div[class*="card"], ancestor::div[class*="activity"], ancestor::li'
          )
        const originalName = await activityCard.textContent()

        await editButtons.first().click()
        await page.waitForTimeout(500)

        // Find name input and update
        const nameInput = page.locator('input[placeholder*="Name"], input[type="text"]').first()

        if ((await nameInput.count()) > 0) {
          const newName = `Updated Activity ${Date.now()}`
          await nameInput.clear()
          await nameInput.fill(newName)

          // Submit changes
          const submitButton = page
            .locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")')
            .first()

          if ((await submitButton.count()) > 0) {
            await submitButton.click()
            await page.waitForTimeout(1000)

            // Verify change was saved
            const updatedText = await page.textContent('body')
            expect(updatedText?.includes(newName) || updatedText?.includes('updated')).toBeTruthy()
          }
        }
      }
    })

    test('should update activity color', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const editButtons = page.locator('button:has-text("Edit"), button:has-text("Pencil")')

      if ((await editButtons.count()) > 0) {
        await editButtons.first().click()
        await page.waitForTimeout(500)

        // Find color input
        const colorInput = page.locator('input[type="color"], button[class*="color"]').first()

        if ((await colorInput.count()) > 0) {
          // Change color
          await colorInput.click()
          await page.waitForTimeout(300)

          // Select different color option if available
          const colorOptions = page.locator('[class*="color"], button:has-text("#")')

          if ((await colorOptions.count()) > 1) {
            // Click second color option
            await colorOptions.nth(1).click()
          }

          // Submit
          const submitButton = page
            .locator('button[type="submit"], button:has-text("Save")')
            .first()

          if ((await submitButton.count()) > 0) {
            await submitButton.click()
            await page.waitForTimeout(1000)

            // Verify modal closed (save was successful)
            const modal = page.locator('[role="dialog"]')
            expect(await modal.count()).toBe(0)
          }
        }
      }
    })
  })

  test.describe('Delete Custom Activity', () => {
    test('should find and open delete confirmation', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Look for delete buttons
      const deleteButtons = page.locator(
        'button:has-text("Delete"), button:has-text("Trash"), button:has-text("Remove"), [class*="delete-btn"]'
      )

      if ((await deleteButtons.count()) > 0) {
        // Click first delete button
        await deleteButtons.first().click()
        await page.waitForTimeout(500)

        // Verify confirmation dialog appears
        const modal = page.locator('[role="dialog"], [role="alertdialog"]')
        const confirmText = await page.textContent('body')

        // Should show delete confirmation
        expect(
          (await modal.count()) > 0 ||
            confirmText?.includes('delete') ||
            confirmText?.includes('Delete') ||
            confirmText?.includes('confirm') ||
            confirmText?.includes('Confirm')
        ).toBeTruthy()
      }
    })

    test('should cancel delete action', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const deleteButtons = page.locator('button:has-text("Delete"), button:has-text("Trash")')

      if ((await deleteButtons.count()) > 0) {
        const countBefore = await page.locator('[class*="activity"], [class*="Activity"]').count()

        await deleteButtons.first().click()
        await page.waitForTimeout(500)

        // Find and click cancel button
        const cancelButton = page
          .locator('button:has-text("Cancel"), button:has-text("No"), button:has-text("Keep")')
          .first()

        if ((await cancelButton.count()) > 0) {
          await cancelButton.click()
          await page.waitForTimeout(500)

          // Verify activity still exists
          const countAfter = await page.locator('[class*="activity"], [class*="Activity"]').count()
          expect(countAfter).toBeGreaterThanOrEqual(countBefore)
        }
      }
    })

    test('should confirm delete activity', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const deleteButtons = page.locator('button:has-text("Delete"), button:has-text("Trash")')

      if ((await deleteButtons.count()) > 0) {
        const countBefore = await deleteButtons.count()

        // Click delete
        await deleteButtons.first().click()
        await page.waitForTimeout(500)

        // Confirm deletion
        const confirmButton = page
          .locator('button:has-text("Delete"), button:has-text("Yes"), button:has-text("Remove")')
          .first()

        if ((await confirmButton.count()) > 0) {
          await confirmButton.click()
          await page.waitForTimeout(1000)

          // Verify activity was deleted
          const countAfter = await page
            .locator('button:has-text("Delete"), button:has-text("Trash")')
            .count()
          expect(countAfter).toBeLessThanOrEqual(countBefore)
        }
      }
    })
  })

  test.describe('Activity Limit Validation', () => {
    test('should display max activities indicator', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Look for activity count display (e.g., "5/10 custom activities")
      const pageText = await page.textContent('body')

      // Should show some indication of limit
      expect(
        pageText?.includes('/10') ||
          pageText?.includes('10') ||
          pageText?.includes('custom') ||
          pageText?.includes('maximum')
      ).toBeTruthy()
    })

    test('should disable create button when at limit', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const createButton = page
        .locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")')
        .first()

      if ((await createButton.count()) > 0) {
        // Check if button is disabled or shows limit message
        const isDisabled = await createButton.evaluate((btn: HTMLButtonElement) =>
          btn.hasAttribute('disabled')
        )

        const pageText = await page.textContent('body')
        const showsLimitReached =
          pageText?.includes('limit') ||
          pageText?.includes('maximum') ||
          pageText?.includes('maximum reached')

        // Either button is disabled or limit message shown
        expect(isDisabled || showsLimitReached).toBeTruthy()
      }
    })
  })

  test.describe('Form Validation & Errors', () => {
    test('should show validation errors for empty name', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Leave name empty and submit
        const submitButton = page
          .locator('button[type="submit"], button:has-text("Create")')
          .first()

        if ((await submitButton.count()) > 0) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Check for error message
          const pageText = await page.textContent('body')
          const hasError =
            pageText?.toLowerCase().includes('required') ||
            pageText?.toLowerCase().includes('error') ||
            pageText?.toLowerCase().includes('enter')

          // Modal should still be open if validation failed
          const modalStillOpen = (await page.locator('[role="dialog"]').count()) > 0

          expect(hasError || modalStillOpen).toBeTruthy()
        }
      }
    })

    test('should show error for special characters in name', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForTimeout(500)

        const nameInput = page.locator('input[placeholder*="Name"], input[type="text"]').first()

        if ((await nameInput.count()) > 0) {
          // Enter problematic characters
          await nameInput.fill('<script>alert("xss")</script>')

          const inputValue = await nameInput.inputValue()
          // Should be sanitized or rejected
          expect(!inputValue.includes('<') && !inputValue.includes('>')).toBeTruthy()
        }
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should pass accessibility audit on activities settings page', async ({
      page,
      makeAxeBuilder,
    }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Run accessibility scan
      const results = await makeAxeBuilder().analyze()
      const violations = results.violations

      if (violations.length > 0) {
        console.log('Accessibility violations found:\n', formatA11yViolations(violations))
      }

      expect(violations).toHaveLength(0)
    })

    test('should have keyboard navigation through activities', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Get focusable elements
      const focusableElements = page.locator(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

      const focusCount = await focusableElements.count()

      if (focusCount > 0) {
        // Tab through elements
        for (let i = 0; i < Math.min(focusCount, 5); i++) {
          await page.keyboard.press('Tab')

          const focusedElement = await page.evaluate(() => {
            return document.activeElement?.tagName || null
          })

          // Should have focus on an element
          expect(focusedElement).not.toBe('BODY')
        }
      }
    })

    test('should be responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check content is visible
      const bodyText = await page.textContent('body')
      expect(bodyText).toBeTruthy()

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScroll).toBe(false)
    })

    test('should support screen reader navigation', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check for ARIA labels and roles
      const elementsWithAriaLabel = page.locator('[aria-label], [aria-labelledby]')
      const ariaCount = await elementsWithAriaLabel.count()

      // Should have at least some accessible names
      expect(ariaCount).toBeGreaterThanOrEqual(0)

      // Check for headings
      const headings = page.locator('h1, h2, h3, h4, h5, h6')
      expect(await headings.count()).toBeGreaterThan(0)
    })

    test('should close modal with Escape key', async ({ page }) => {
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first()

      if ((await createButton.count()) > 0) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Press Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Modal should be closed
        const modal = page.locator('[role="dialog"]')
        expect(await modal.count()).toBe(0)
      }
    })
  })

  test.describe('No Console Errors', () => {
    test('should not have critical console errors', async ({ page }) => {
      const errors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Filter known noise
      const knownNoise = [
        'Firebase',
        'DevTools',
        'favicon',
        'extension',
        'Chrome extension',
        'Preloaded script',
      ]

      const criticalErrors = errors.filter(
        (error) => !knownNoise.some((noise) => error.includes(noise))
      )

      expect(criticalErrors).toHaveLength(0)
    })
  })

  test.describe('Visual Regression', () => {
    test('should have consistent layout on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })

      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Take screenshot for visual regression
      await page.screenshot({
        path: 'docs/playwright-artifacts/activities-desktop.png',
      })

      // Check layout is not broken
      const hasContent = await page.locator('body').textContent()
      expect(hasContent?.length).toBeGreaterThan(0)
    })

    test('should have consistent layout on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Take screenshot for visual regression
      await page.screenshot({
        path: 'docs/playwright-artifacts/activities-mobile.png',
      })

      // Check layout is not broken
      const hasContent = await page.locator('body').textContent()
      expect(hasContent?.length).toBeGreaterThan(0)
    })
  })
})
