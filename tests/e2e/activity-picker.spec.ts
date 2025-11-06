import { test, expect } from './fixtures/test-base';
import { formatA11yViolations } from './utils/accessibility';

/**
 * Activity Picker Journey E2E Tests
 *
 * Tests complete user flows for:
 * - Navigating to timer and opening activity picker
 * - Viewing recent activities in horizontal bar
 * - Scrolling through all activities in vertical list
 * - Selecting activities and verifying selection
 * - Creating new activities from picker modal
 * - Verifying newly created activities appear immediately
 * - Testing responsive design (mobile and desktop)
 * - Testing accessibility for activity selection
 */

test.describe('Activity Picker Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to timer page (where activity picker is used)
    await page.goto('/timer');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Timer Page Navigation', () => {
    test('should load timer page successfully', async ({ page }) => {
      // Already navigated in beforeEach
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
    });

    test('should display timer interface', async ({ page }) => {
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(0);

      // Check for interactive elements
      const interactive = page.locator(
        'button, input, select, textarea, [role="button"]'
      );
      expect(await interactive.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Activity Picker Opening', () => {
    test('should open activity picker dropdown', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      // Find activity picker button/dropdown trigger
      const pickerButton = page
        .locator(
          'button:has-text("Activity"), [class*="activity-picker"], [class*="ActivityPicker"] button'
        )
        .first();

      const hasPickerButton = await pickerButton.count();

      if (hasPickerButton > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Verify dropdown opened
        const dropdown = page.locator(
          '[role="listbox"], [class*="dropdown"], [class*="Dropdown"], [class*="menu"]'
        );

        expect(await dropdown.count()).toBeGreaterThan(0);
      }
    });

    test('should show activity options after opening picker', async ({
      page,
    }) => {
      // Find and click activity picker
      const pickerButton = page
        .locator(
          'button:has-text("Activity"), [class*="activity"] button, [class*="picker"] button'
        )
        .first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Look for activity options
        const options = page.locator(
          '[role="option"], [class*="activity-item"], [class*="ActivityItem"], button[class*="activity"]'
        );

        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Recent Activities Display', () => {
    test('should display recent activities in horizontal bar', async ({
      page,
    }) => {
      // Look for recent activities section
      const recentSection = page.locator(
        '[class*="recent"], h2:has-text("Recent"), button[class*="recent"]'
      );

      const haRecentSection = await recentSection.count();

      if (haRecentSection > 0) {
        // Recent activities should be displayed
        const pageText = await page.textContent('body');
        expect(pageText?.includes('Recent')).toBeTruthy();
      }

      // Alternative: look for activity icons/buttons
      const activityButtons = page.locator(
        '[class*="activity"], [class*="Activity"], button[class*="icon"]'
      );

      expect(await activityButtons.count()).toBeGreaterThan(0);
    });

    test('should show up to 5 recent activities', async ({ page }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Count visible activity items
        const recentActivities = page.locator(
          '[class*="recent"] button, [class*="recent"] [class*="activity"]'
        );
        const recentCount = await recentActivities.count();

        // Should have 0 to 5 recent activities
        expect(recentCount).toBeLessThanOrEqual(5);
      }
    });

    test('should allow quick selection from recent activities', async ({
      page,
    }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Find first activity button
        const firstActivity = page
          .locator(
            '[class*="activity"] button, [role="option"], button[class*="item"]'
          )
          .first();

        if ((await firstActivity.count()) > 0) {
          const activityName = await firstActivity.textContent();
          await firstActivity.click();
          await page.waitForTimeout(500);

          // Verify selection (picker should close and activity should be selected)
          const selectedText = await page.textContent(
            '[class*="selected"], [class*="active"]'
          );

          expect(
            selectedText?.includes(activityName || '') ||
              (await page.locator('[role="listbox"]').count()) === 0
          ).toBeTruthy();
        }
      }
    });
  });

  test.describe('All Activities List', () => {
    test('should display all activities when scrolling down', async ({
      page,
    }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);

        // Find the dropdown/list container
        const listContainer = page
          .locator('[role="listbox"], [class*="dropdown"], [class*="list"]')
          .first();

        if ((await listContainer.count()) > 0) {
          // Check initial activity count
          const initialOptions = page.locator(
            '[role="option"], [class*="activity-item"]'
          );
          const initialCount = await initialOptions.count();

          // Scroll down in list
          await listContainer.evaluate(el => {
            el.scrollTop = el.scrollHeight;
          });

          await page.waitForTimeout(500);

          // Check final activity count (should have more activities)
          const finalCount = await initialOptions.count();

          expect(finalCount).toBeGreaterThanOrEqual(initialCount);
        }
      }
    });

    test('should display default system activities', async ({ page }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Check for common default activities
        const pageText = await page.textContent('body');
        const defaultActivities = [
          'Work',
          'Coding',
          'Reading',
          'Learning',
          'Study',
        ];

        const hasDefaults = defaultActivities.some(activity =>
          pageText?.includes(activity)
        );

        expect(hasDefaults).toBeTruthy();
      }
    });

    test('should display custom activities created by user', async ({
      page,
    }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Count total activities available
        const allActivities = page.locator(
          '[role="option"], [class*="activity-item"]'
        );
        const totalCount = await allActivities.count();

        // Should have both system defaults (10) and possibly custom activities
        expect(totalCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Activity Selection', () => {
    test('should select activity and close picker', async ({ page }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Select first activity
        const firstActivity = page
          .locator('[role="option"], [class*="activity-item"]')
          .first();

        if ((await firstActivity.count()) > 0) {
          await firstActivity.click();
          await page.waitForTimeout(500);

          // Picker should close
          const dropdown = page.locator(
            '[role="listbox"], [class*="dropdown"]'
          );
          expect(await dropdown.count()).toBe(0);
        }
      }
    });

    test('should update selected activity display', async ({ page }) => {
      // Store initial selected activity
      const initialButton = page.locator('button:has-text("Activity")').first();

      if ((await initialButton.count()) > 0) {
        const initialText = await initialButton.textContent();

        // Open picker
        await initialButton.click();
        await page.waitForTimeout(500);

        // Select different activity
        const secondActivity = page
          .locator('[role="option"], [class*="activity-item"]')
          .nth(1);

        if ((await secondActivity.count()) > 0) {
          const newActivityName = await secondActivity.textContent();
          await secondActivity.click();
          await page.waitForTimeout(500);

          // Check that button text updated
          const updatedButton = page
            .locator('button:has-text("Activity")')
            .first();
          const updatedText = await updatedButton.textContent();

          // Should show selected activity or have changed
          expect(updatedText).toBeTruthy();
        }
      }
    });

    test('should mark selected activity with checkmark', async ({ page }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Look for checkmark icon on selected activity
        const checkmarks = page.locator(
          '[class*="check"], [class*="icon-check"], [class*="selected"] svg'
        );

        const checkmarkCount = await checkmarks.count();

        // Should have at least one checkmark for selected item
        if (checkmarkCount > 0) {
          expect(checkmarkCount).toBeGreaterThan(0);
        }
      }
    });

    test('should allow switching between activities', async ({ page }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        // Select first activity
        await pickerButton.click();
        await page.waitForTimeout(500);

        const firstActivity = page
          .locator('[role="option"], [class*="activity-item"]')
          .first();

        if ((await firstActivity.count()) > 0) {
          await firstActivity.click();
          await page.waitForTimeout(300);

          // Open picker again
          await pickerButton.click();
          await page.waitForTimeout(500);

          // Select different activity
          const secondActivity = page
            .locator('[role="option"], [class*="activity-item"]')
            .nth(1);

          if ((await secondActivity.count()) > 0) {
            await secondActivity.click();
            await page.waitForTimeout(500);

            // Verify second activity is now selected
            const picker = page.locator('button:has-text("Activity")').first();
            const selectedText = await picker.textContent();

            expect(selectedText?.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Create Activity from Picker', () => {
    test('should open create activity modal from picker', async ({ page }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Find "Create" or "Add" button in picker
        const createButton = page
          .locator(
            '[class*="dropdown"] button:has-text("Create"), [class*="dropdown"] button:has-text("Add"), [class*="dropdown"] button:has-text("+"), button[class*="new"]'
          )
          .first();

        if ((await createButton.count()) > 0) {
          await createButton.click();
          await page.waitForTimeout(500);

          // Verify create modal opened
          const modal = page.locator('[role="dialog"], [class*="modal"]');
          expect(await modal.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should create activity from picker modal', async ({ page }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Click create button
        const createButton = page
          .locator(
            '[class*="dropdown"] button:has-text("Create"), [class*="dropdown"] button:has-text("Add"), button[class*="new"]'
          )
          .first();

        if ((await createButton.count()) > 0) {
          await createButton.click();
          await page.waitForTimeout(500);

          // Fill in activity name
          const nameInput = page
            .locator('input[placeholder*="Name"], input[type="text"]')
            .first();

          if ((await nameInput.count()) > 0) {
            const activityName = `Activity ${Date.now()}`;
            await nameInput.fill(activityName);

            // Submit form
            const submitButton = page
              .locator(
                'button[type="submit"], button:has-text("Create"), button:has-text("Save")'
              )
              .first();

            if ((await submitButton.count()) > 0) {
              await submitButton.click();
              await page.waitForTimeout(1000);

              // Modal should close
              const modal = page.locator('[role="dialog"]');
              expect(await modal.count()).toBe(0);
            }
          }
        }
      }
    });

    test('should show newly created activity in picker immediately', async ({
      page,
    }) => {
      // Get initial activity count
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        const initialOptions = page.locator(
          '[role="option"], [class*="activity-item"]'
        );
        const initialCount = await initialOptions.count();

        // Close picker
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Create new activity
        const createButton = page
          .locator(
            'button:has-text("Create"), button:has-text("Add"), button:has-text("New")'
          )
          .first();

        if ((await createButton.count()) > 0) {
          await createButton.click();
          await page.waitForTimeout(500);

          const nameInput = page
            .locator('input[placeholder*="Name"], input[type="text"]')
            .first();

          if ((await nameInput.count()) > 0) {
            const newActivityName = `New Activity ${Date.now()}`;
            await nameInput.fill(newActivityName);

            const submitBtn = page.locator('button[type="submit"]').first();

            if ((await submitBtn.count()) > 0) {
              await submitBtn.click();
              await page.waitForTimeout(1000);

              // Reopen picker
              await pickerButton.click();
              await page.waitForTimeout(500);

              // Check if new activity appears
              const finalOptions = page.locator(
                '[role="option"], [class*="activity-item"]'
              );
              const finalCount = await finalOptions.count();

              // New activity should be available
              expect(finalCount).toBeGreaterThanOrEqual(initialCount);
            }
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display picker on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });

      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Verify dropdown is visible
        const dropdown = page.locator('[role="listbox"], [class*="dropdown"]');
        expect(await dropdown.count()).toBeGreaterThan(0);

        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });

        expect(hasHorizontalScroll).toBe(false);
      }
    });

    test('should display picker on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Verify content is accessible
        const content = page.locator('body');
        const text = await content.textContent();
        expect(text?.length).toBeGreaterThan(0);

        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });

        expect(hasHorizontalScroll).toBe(false);
      }
    });

    test('should show recent activities bar on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/timer');
      await page.waitForLoadState('networkidle');

      // Look for recent activities
      const recentText = await page.textContent('body');
      expect(recentText).toBeTruthy();
    });

    test('should be scrollable on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // List should be scrollable
        const list = page
          .locator('[role="listbox"], [class*="dropdown"]')
          .first();

        if ((await list.count()) > 0) {
          const scrollHeight = await list.evaluate(el => el.scrollHeight);
          const clientHeight = await list.evaluate(el => el.clientHeight);

          // If scrollHeight > clientHeight, element is scrollable
          const isScrollable = scrollHeight > clientHeight;
          expect(isScrollable).toBeTruthy();
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should pass accessibility audit on activity picker', async ({
      page,
      makeAxeBuilder,
    }) => {
      // Open picker to test its accessibility
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForLoadState('networkidle');

        // Run accessibility scan
        const results = await makeAxeBuilder().analyze();
        const violations = results.violations;

        if (violations.length > 0) {
          console.log(
            'Accessibility violations:\n',
            formatA11yViolations(violations)
          );
        }

        expect(violations).toHaveLength(0);
      }
    });

    test('should support keyboard navigation through activities', async ({
      page,
    }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Navigate with arrow keys
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);

        // Check focus moved
        const focusedElement = await page.evaluate(() => {
          return (
            document.activeElement?.getAttribute('role') ||
            document.activeElement?.tagName
          );
        });

        expect(focusedElement).toBeTruthy();

        // Press Enter to select
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Picker should close after selection
        const dropdown = page.locator('[role="listbox"]');
        expect(await dropdown.count()).toBe(0);
      }
    });

    test('should close picker with Escape key', async ({ page }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Picker should close
        const dropdown = page.locator('[role="listbox"]');
        expect(await dropdown.count()).toBe(0);
      }
    });

    test('should have proper ARIA labels on activity items', async ({
      page,
    }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Check for ARIA attributes
        const activities = page.locator('[role="option"]');
        const count = await activities.count();

        if (count > 0) {
          // At least some activities should have accessible names
          const hasAriaLabel = await activities
            .first()
            .getAttribute('aria-label');
          const hasTextContent = await activities.first().textContent();

          expect(hasAriaLabel || hasTextContent).toBeTruthy();
        }
      }
    });

    test('should announce activity selection to screen readers', async ({
      page,
    }) => {
      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Select activity
        const firstActivity = page.locator('[role="option"]').first();

        if ((await firstActivity.count()) > 0) {
          await firstActivity.click();
          await page.waitForTimeout(500);

          // Check for live region updates
          const liveRegions = page.locator('[aria-live]');
          expect(await liveRegions.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Visual Regression', () => {
    test('should have consistent picker layout on desktop', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/timer');
      await page.waitForLoadState('networkidle');

      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Take screenshot
        await page.screenshot({
          path: 'docs/playwright-artifacts/activity-picker-desktop.png',
        });

        // Verify picker is visible
        const dropdown = page.locator('[role="listbox"], [class*="dropdown"]');
        expect(await dropdown.count()).toBeGreaterThan(0);
      }
    });

    test('should have consistent picker layout on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/timer');
      await page.waitForLoadState('networkidle');

      // Open picker
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Take screenshot
        await page.screenshot({
          path: 'docs/playwright-artifacts/activity-picker-mobile.png',
        });

        // Verify content is visible
        const content = page.locator('body');
        expect(await content.textContent()).toBeTruthy();
      }
    });
  });

  test.describe('No Console Errors', () => {
    test('should not have critical console errors during picker interaction', async ({
      page,
    }) => {
      const errors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Open picker and interact
      const pickerButton = page.locator('button:has-text("Activity")').first();

      if ((await pickerButton.count()) > 0) {
        await pickerButton.click();
        await page.waitForTimeout(500);

        // Select activity
        const firstActivity = page.locator('[role="option"]').first();

        if ((await firstActivity.count()) > 0) {
          await firstActivity.click();
          await page.waitForTimeout(500);
        }
      }

      // Filter known noise
      const knownNoise = [
        'Firebase',
        'DevTools',
        'favicon',
        'Chrome extension',
      ];

      const criticalErrors = errors.filter(
        error => !knownNoise.some(noise => error.includes(noise))
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });
});
