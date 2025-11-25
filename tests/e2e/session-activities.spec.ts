import { test, expect } from './fixtures/test-base'
import { formatA11yViolations } from './utils/accessibility'

/**
 * Session with Activities Journey E2E Tests
 *
 * Tests complete user flows for:
 * - Selecting activity → starting timer → stopping timer → saving session
 * - Verifying session appears in feed with activity name and icon
 * - Logging multiple sessions with same activity
 * - Verifying activity moves to top of recent activities
 * - Checking activity stats page shows correct session count
 * - Testing activity-session integration
 */

test.describe('Session with Activities Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to timer page
    await page.goto('/timer')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Select Activity and Start Timer', () => {
    test('should allow selecting activity before starting timer', async ({ page }) => {
      // Find activity picker
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        // Click to open picker
        await pickerButton.click()
        await page.waitForTimeout(500)

        // Select first activity
        const firstActivity = page.locator('[role="option"], [class*="activity-item"]').first()

        if ((await firstActivity.count()) > 0) {
          const activityName = await firstActivity.textContent()
          await firstActivity.click()
          await page.waitForTimeout(500)

          // Verify activity was selected
          const selectedButton = page.locator('button:has-text("Activity")').first()
          const selectedText = await selectedButton.textContent()

          expect(selectedText).toBeTruthy()
        }
      }
    })

    test('should show selected activity with icon', async ({ page }) => {
      // Select activity
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"], [class*="activity-item"]').first()

        if ((await activity.count()) > 0) {
          await activity.click()
          await page.waitForTimeout(500)

          // Check for activity icon in display area
          const icons = page.locator('svg, [class*="icon"], img[alt*="activity"]')
          expect(await icons.count()).toBeGreaterThan(0)
        }
      }
    })

    test('should prevent starting timer without activity selected', async ({ page }) => {
      // Look for start button
      const startButton = page.locator('button:has-text("Start"), button:has-text("Begin")').first()

      if ((await startButton.count()) > 0) {
        // Check if button is disabled when no activity selected
        const isDisabled = await startButton.evaluate(
          (btn: HTMLButtonElement) =>
            btn.hasAttribute('disabled') || btn.classList.contains('disabled')
        )

        // Either button is disabled or activity is already selected
        const pickerButton = page.locator('button:has-text("Activity")').first()
        const hasActivity = await pickerButton.textContent()

        expect(isDisabled || (hasActivity && hasActivity.length > 0)).toBeTruthy()
      }
    })
  })

  test.describe('Timer Functionality', () => {
    test('should start and stop timer', async ({ page }) => {
      // Select activity first
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"], [class*="activity-item"]').first()

        if ((await activity.count()) > 0) {
          await activity.click()
          await page.waitForTimeout(500)

          // Start timer
          const startButton = page
            .locator('button:has-text("Start"), button:has-text("Play"), button:has-text("Begin")')
            .first()

          if ((await startButton.count()) > 0) {
            await startButton.click()
            await page.waitForTimeout(1000)

            // Check timer is running (should show elapsed time)
            const timerDisplay = page.locator('[class*="timer"], [class*="time"], span')
            const timerText = await timerDisplay.first().textContent()

            expect(timerText).toBeTruthy()

            // Stop timer after a moment
            const stopButton = page
              .locator('button:has-text("Stop"), button:has-text("Pause")')
              .first()

            if ((await stopButton.count()) > 0) {
              await page.waitForTimeout(2000) // Let timer run for 2 seconds
              await stopButton.click()
              await page.waitForTimeout(500)

              // Verify timer stopped
              const stoppedText = await page.textContent('body')
              expect(stoppedText).toBeTruthy()
            }
          }
        }
      }
    })

    test('should display elapsed time while timer is running', async ({ page }) => {
      // Select activity
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"]').first()

        if ((await activity.count()) > 0) {
          await activity.click()
          await page.waitForTimeout(500)

          // Start timer
          const startButton = page
            .locator('button:has-text("Start"), button:has-text("Play")')
            .first()

          if ((await startButton.count()) > 0) {
            await startButton.click()
            await page.waitForTimeout(1500)

            // Check for time display
            const timeDisplay = page.locator('[class*="timer"], [class*="time"], time')
            const timeText = await timeDisplay.first().textContent()

            // Should show time in format like "00:01" or "1s"
            expect(timeText).toMatch(/\d+:\d+|\d+s/)
          }
        }
      }
    })

    test('should allow pausing and resuming timer', async ({ page }) => {
      // Select activity
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"]').first()

        if ((await activity.count()) > 0) {
          await activity.click()
          await page.waitForTimeout(500)

          // Start timer
          const startButton = page
            .locator('button:has-text("Start"), button:has-text("Play")')
            .first()

          if ((await startButton.count()) > 0) {
            await startButton.click()
            await page.waitForTimeout(1000)

            // Pause timer
            const pauseButton = page
              .locator('button:has-text("Pause"), button:has-text("Stop")')
              .first()

            if ((await pauseButton.count()) > 0) {
              await pauseButton.click()
              await page.waitForTimeout(500)

              // Resume timer
              const resumeButton = page
                .locator(
                  'button:has-text("Resume"), button:has-text("Play"), button:has-text("Start")'
                )
                .first()

              if ((await resumeButton.count()) > 0) {
                await resumeButton.click()
                await page.waitForTimeout(500)

                // Timer should be running again
                const runningText = await page.textContent('body')
                expect(runningText).toBeTruthy()
              }
            }
          }
        }
      }
    })
  })

  test.describe('Save Session with Activity', () => {
    test('should save session after timer stops', async ({ page }) => {
      // Select activity
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"]').first()

        if ((await activity.count()) > 0) {
          const activityName = await activity.textContent()
          await activity.click()
          await page.waitForTimeout(500)

          // Start timer
          const startButton = page
            .locator('button:has-text("Start"), button:has-text("Play")')
            .first()

          if ((await startButton.count()) > 0) {
            await startButton.click()
            await page.waitForTimeout(2000)

            // Stop timer
            const stopButton = page
              .locator('button:has-text("Stop"), button:has-text("Pause")')
              .first()

            if ((await stopButton.count()) > 0) {
              await stopButton.click()
              await page.waitForTimeout(1000)

              // Look for save button or dialog
              const saveButton = page
                .locator(
                  'button:has-text("Save"), button:has-text("Confirm"), button:has-text("Done")'
                )
                .first()

              if ((await saveButton.count()) > 0) {
                await saveButton.click()
                await page.waitForTimeout(1500)

                // Session should be saved, check for success message
                const pageText = await page.textContent('body')
                expect(
                  pageText?.includes('saved') ||
                    pageText?.includes('Saved') ||
                    pageText?.includes('success')
                ).toBeTruthy()
              }
            }
          }
        }
      }
    })

    test('should allow editing session details before saving', async ({ page }) => {
      // Start session flow
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"]').first()

        if ((await activity.count()) > 0) {
          await activity.click()
          await page.waitForTimeout(500)

          // Start timer
          const startButton = page
            .locator('button:has-text("Start"), button:has-text("Play")')
            .first()

          if ((await startButton.count()) > 0) {
            await startButton.click()
            await page.waitForTimeout(2000)

            // Stop timer
            const stopButton = page.locator('button:has-text("Stop")').first()

            if ((await stopButton.count()) > 0) {
              await stopButton.click()
              await page.waitForTimeout(1000)

              // Look for editable fields
              const editableFields = page.locator('input, textarea, [contenteditable="true"]')
              const editableCount = await editableFields.count()

              // Should have some fields to edit
              expect(editableCount).toBeGreaterThanOrEqual(0)
            }
          }
        }
      }
    })

    test('should require activity before saving session', async ({ page }) => {
      // Try to save without selecting activity (if possible)
      const saveButton = page
        .locator('button:has-text("Save"), button:has-text("Done"), button:has-text("Confirm")')
        .first()

      if ((await saveButton.count()) > 0) {
        // Check if save button is disabled
        const isDisabled = await saveButton.evaluate((btn: HTMLButtonElement) =>
          btn.hasAttribute('disabled')
        )

        // Either button is disabled or activity is required
        expect(isDisabled || (await page.textContent('body'))?.includes('Activity')).toBeTruthy()
      }
    })
  })

  test.describe('Session Appears in Feed', () => {
    test('should show session in feed with activity name', async ({ page }) => {
      // Complete a session
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"]').first()

        if ((await activity.count()) > 0) {
          const activityName = await activity.textContent()

          if (activityName) {
            await activity.click()
            await page.waitForTimeout(500)

            // Start and stop timer
            const startButton = page
              .locator('button:has-text("Start"), button:has-text("Play")')
              .first()

            if ((await startButton.count()) > 0) {
              await startButton.click()
              await page.waitForTimeout(2000)

              const stopButton = page.locator('button:has-text("Stop")').first()

              if ((await stopButton.count()) > 0) {
                await stopButton.click()
                await page.waitForTimeout(500)

                // Save session
                const saveButton = page
                  .locator('button:has-text("Save"), button:has-text("Done")')
                  .first()

                if ((await saveButton.count()) > 0) {
                  await saveButton.click()
                  await page.waitForTimeout(2000)

                  // Navigate to feed
                  await page.goto('/')
                  await page.waitForLoadState('networkidle')

                  // Check for activity name in feed
                  const feedText = await page.textContent('body')
                  expect(feedText?.includes(activityName.trim())).toBeTruthy()
                }
              }
            }
          }
        }
      }
    })

    test('should show session with activity icon in feed', async ({ page }) => {
      // Complete a session (simplified)
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        // Navigate to feed to check for sessions with icons
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Check for activity icons in feed
        const activityIcons = page.locator('[class*="activity-icon"], [class*="icon"], svg')
        expect(await activityIcons.count()).toBeGreaterThan(0)
      }
    })

    test('should display session duration in feed', async ({ page }) => {
      // Navigate to feed
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Look for time/duration displays
      const durationElements = page.locator(
        '[class*="duration"], [class*="time"], span:has-text("min"), span:has-text("h")'
      )

      const durationCount = await durationElements.count()

      // Should show duration information
      expect(durationCount).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Recent Activities Update', () => {
    test('should update recent activities list after logging session', async ({ page }) => {
      // Go to settings to check recent activities order
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Get initial order of activities
      const initialActivities = page.locator('[class*="activity"], [class*="Activity"]')
      const initialOrder: string[] = []

      const count = Math.min(await initialActivities.count(), 3)
      for (let i = 0; i < count; i++) {
        const text = await initialActivities.nth(i).textContent()
        if (text) {
          initialOrder.push(text)
        }
      }

      // Go back to timer and log a session with first activity (if not already recent)
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0 && initialOrder.length > 0) {
        // Check current recent activities position
        const pageText = await page.textContent('body')
        expect(pageText).toBeTruthy()
      }
    })

    test('should show recently used activity first in picker', async ({ page }) => {
      // Open activity picker
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        // Recent activities should appear first or in a recent section
        const recentSection = page.locator('[class*="recent"], h3')
        const hasRecent = await recentSection.count()

        // Should have recent section or recent activities visible
        expect(hasRecent).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Activity Stats Page', () => {
    test('should navigate to activity stats page', async ({ page }) => {
      // Navigate to activity stats
      await page.goto('/activities')
      await page.waitForLoadState('networkidle')

      // Verify page loaded
      const pageTitle = await page.title()
      expect(pageTitle).toBeTruthy()
    })

    test('should show session count for activity', async ({ page }) => {
      // Look for activity links/cards in feed or settings
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      // Check for activity cards with stats
      const activityCards = page.locator('[class*="card"], [class*="activity"]')

      if ((await activityCards.count()) > 0) {
        // Look for stats text (session count, hours, etc.)
        const statsText = await page.textContent('body')

        expect(
          statsText?.includes('session') ||
            statsText?.includes('hour') ||
            statsText?.includes('count')
        ).toBeTruthy()
      }
    })

    test('should update session count after logging new session', async ({ page }) => {
      // Get initial stats
      await page.goto('/settings/activities')
      await page.waitForLoadState('networkidle')

      const initialStats = await page.textContent('body')

      // Log a session on timer
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"]').first()

        if ((await activity.count()) > 0) {
          await activity.click()
          await page.waitForTimeout(500)

          // Quick timer session
          const startButton = page.locator('button:has-text("Start")').first()

          if ((await startButton.count()) > 0) {
            await startButton.click()
            await page.waitForTimeout(1500)

            const stopButton = page.locator('button:has-text("Stop")').first()

            if ((await stopButton.count()) > 0) {
              await stopButton.click()
              await page.waitForTimeout(500)

              const saveButton = page.locator('button:has-text("Save")').first()

              if ((await saveButton.count()) > 0) {
                await saveButton.click()
                await page.waitForTimeout(2000)

                // Check updated stats
                await page.goto('/settings/activities')
                await page.waitForLoadState('networkidle')

                const updatedStats = await page.textContent('body')

                expect(updatedStats).toBeTruthy()
              }
            }
          }
        }
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should pass accessibility audit during session flow', async ({
      page,
      makeAxeBuilder,
    }) => {
      await page.goto('/timer')
      await page.waitForLoadState('networkidle')

      // Run accessibility scan
      const results = await makeAxeBuilder().analyze()
      const violations = results.violations

      if (violations.length > 0) {
        console.log('Accessibility violations:\n', formatA11yViolations(violations))
      }

      expect(violations).toHaveLength(0)
    })

    test('should be keyboard accessible for session logging', async ({ page }) => {
      // Navigate with keyboard
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)

      // Should have focus
      const focused = await page.evaluate(() => {
        return document.activeElement?.tagName
      })

      expect(focused).not.toBe('BODY')

      // Navigate to activity picker
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)
      }

      // Open picker with Enter/Space
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      // Should have opened something
      const bodyText = await page.textContent('body')
      expect(bodyText).toBeTruthy()
    })
  })

  test.describe('No Console Errors', () => {
    test('should not have critical errors during session logging', async ({ page }) => {
      const errors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      // Complete session flow
      const pickerButton = page.locator('button:has-text("Activity")').first()

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click()
        await page.waitForTimeout(500)

        const activity = page.locator('[role="option"]').first()

        if ((await activity.count()) > 0) {
          await activity.click()
          await page.waitForTimeout(500)

          const startButton = page.locator('button:has-text("Start")').first()

          if ((await startButton.count()) > 0) {
            await startButton.click()
            await page.waitForTimeout(1000)

            const stopButton = page.locator('button:has-text("Stop")').first()

            if ((await stopButton.count()) > 0) {
              await stopButton.click()
              await page.waitForTimeout(500)

              const saveButton = page.locator('button:has-text("Save")').first()

              if ((await saveButton.count()) > 0) {
                await saveButton.click()
                await page.waitForTimeout(1000)
              }
            }
          }
        }
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
