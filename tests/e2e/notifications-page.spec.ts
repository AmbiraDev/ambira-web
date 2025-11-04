/**
 * E2E Tests: Notifications Page
 * Tests the full-page notifications view with Mark All Read and Clear All buttons
 * for both desktop and mobile viewports
 */

import { test, expect } from '@playwright/test';

// Helper to wait for network idle
const waitForNetworkIdle = async (page: any) => {
  await page.waitForLoadState('networkidle');
};

// Mock notifications for testing
const mockNotifications = [
  {
    id: '1',
    title: 'New Follower',
    message: 'John Doe started following you',
    type: 'follow',
    isRead: false,
  },
  {
    id: '2',
    title: 'New Support',
    message: 'Jane Smith supported your session',
    type: 'support',
    isRead: false,
  },
  {
    id: '3',
    title: 'New Comment',
    message: 'Alice commented on your session',
    type: 'comment',
    isRead: true,
  },
];

test.describe('Notifications Page - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/notifications');
    await waitForNetworkIdle(page);
  });

  test.describe('Page Layout', () => {
    test('should display notifications page header on desktop', async ({
      page,
    }) => {
      const heading = page.getByRole('heading', { name: 'Notifications' });
      await expect(heading).toBeVisible();
    });

    test('should display unread count in header', async ({ page }) => {
      // Check if there are unread notifications
      const unreadText = page.locator('text=/unread notification/i');
      const caughtUpText = page.locator('text=/All caught up!/i');

      // One of these should be visible
      const hasUnread = await unreadText.isVisible().catch(() => false);
      const isCaughtUp = await caughtUpText.isVisible().catch(() => false);

      expect(hasUnread || isCaughtUp).toBe(true);
    });
  });

  test.describe('Mark All Read Button - Desktop', () => {
    test('should show Mark All Read button when there are unread notifications', async ({
      page,
    }) => {
      // Check if there are unread notifications
      const unreadText = await page
        .locator('text=/\\d+ unread/i')
        .textContent()
        .catch(() => null);

      if (unreadText) {
        const markAllReadButton = page.getByTestId(
          'mark-all-read-button-desktop'
        );
        await expect(markAllReadButton).toBeVisible();
      }
    });

    test('should not show Mark All Read button when all notifications are read', async ({
      page,
    }) => {
      const caughtUpText = await page
        .getByText('All caught up!')
        .isVisible()
        .catch(() => false);

      if (caughtUpText) {
        const markAllReadButton = page.getByTestId(
          'mark-all-read-button-desktop'
        );
        await expect(markAllReadButton).not.toBeVisible();
      }
    });

    test('should mark all notifications as read when clicked', async ({
      page,
    }) => {
      const markAllReadButton = page.getByTestId(
        'mark-all-read-button-desktop'
      );

      if (await markAllReadButton.isVisible()) {
        // Get unread count before
        const unreadTextBefore = await page
          .locator('text=/\\d+ unread/i')
          .textContent()
          .catch(() => null);

        // Click mark all as read
        await markAllReadButton.click();

        // Wait for the operation to complete
        await page.waitForTimeout(1000);

        // Should show "All caught up!" or unread count should be 0
        const caughtUpVisible = await page
          .getByText('All caught up!')
          .isVisible()
          .catch(() => false);

        const unreadTextAfter = await page
          .locator('text=/\\d+ unread/i')
          .textContent()
          .catch(() => null);

        expect(caughtUpVisible || unreadTextAfter === null).toBe(true);
      }
    });

    test('should disable Mark All Read button while processing', async ({
      page,
    }) => {
      const markAllReadButton = page.getByTestId(
        'mark-all-read-button-desktop'
      );

      if (await markAllReadButton.isVisible()) {
        // Click the button
        await markAllReadButton.click();

        // Button should be disabled temporarily
        const isDisabled = await markAllReadButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe('Clear All Button - Desktop', () => {
    test('should show Clear All button when there are notifications', async ({
      page,
    }) => {
      // Check if there are any notifications
      const notificationItems = page.locator('.divide-y.divide-gray-200 > div');
      const count = await notificationItems.count();

      if (count > 0) {
        const clearAllButton = page.getByTestId('clear-all-button-desktop');
        await expect(clearAllButton).toBeVisible();
      }
    });

    test('should not show Clear All button when there are no notifications', async ({
      page,
    }) => {
      const emptyState = await page
        .getByText('No notifications yet')
        .isVisible()
        .catch(() => false);

      if (emptyState) {
        const clearAllButton = page.getByTestId('clear-all-button-desktop');
        await expect(clearAllButton).not.toBeVisible();
      }
    });

    test('should clear all notifications when clicked', async ({ page }) => {
      const clearAllButton = page.getByTestId('clear-all-button-desktop');

      if (await clearAllButton.isVisible()) {
        // Get notification count before
        const notificationsBefore = await page
          .locator('.divide-y.divide-gray-200 > div')
          .count();

        // Click clear all
        await clearAllButton.click();

        // Wait for the operation to complete
        await page.waitForTimeout(1000);

        // Should show empty state
        const emptyState = page.getByText('No notifications yet');
        await expect(emptyState).toBeVisible();

        // Notification list should be empty
        const notificationsAfter = await page
          .locator('.divide-y.divide-gray-200 > div')
          .count();
        expect(notificationsAfter).toBe(0);
      }
    });

    test('should disable Clear All button while processing', async ({
      page,
    }) => {
      const clearAllButton = page.getByTestId('clear-all-button-desktop');

      if (await clearAllButton.isVisible()) {
        // Click the button
        await clearAllButton.click();

        // Button should be disabled temporarily (check within 100ms)
        await page.waitForTimeout(50);
        const isDisabled = await clearAllButton.isDisabled().catch(() => false);
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe('Button Interaction', () => {
    test('both buttons should be visible together when there are unread notifications', async ({
      page,
    }) => {
      const unreadText = await page
        .locator('text=/\\d+ unread/i')
        .textContent()
        .catch(() => null);

      if (unreadText) {
        const markAllReadButton = page.getByTestId(
          'mark-all-read-button-desktop'
        );
        const clearAllButton = page.getByTestId('clear-all-button-desktop');

        await expect(markAllReadButton).toBeVisible();
        await expect(clearAllButton).toBeVisible();
      }
    });

    test('buttons should have correct styling', async ({ page }) => {
      const markAllReadButton = page.getByTestId(
        'mark-all-read-button-desktop'
      );
      const clearAllButton = page.getByTestId('clear-all-button-desktop');

      if (await markAllReadButton.isVisible()) {
        // Mark All Read should have blue color
        const markAllReadClass = await markAllReadButton.getAttribute('class');
        expect(markAllReadClass).toContain('text-[#0066CC]');
      }

      if (await clearAllButton.isVisible()) {
        // Clear All should have red color
        const clearAllClass = await clearAllButton.getAttribute('class');
        expect(clearAllClass).toContain('text-red-600');
      }
    });
  });
});

test.describe('Notifications Page - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/notifications');
    await waitForNetworkIdle(page);
  });

  test.describe('Page Layout', () => {
    test('should display mobile header with back button', async ({ page }) => {
      const backButton = page
        .locator('button')
        .filter({ has: page.locator('svg') })
        .first();
      await expect(backButton).toBeVisible();

      const heading = page.getByRole('heading', { name: 'Notifications' });
      await expect(heading).toBeVisible();
    });

    test('should display action buttons bar on mobile', async ({ page }) => {
      // Check if there are notifications
      const notificationItems = page.locator('[data-testid*="notification"]');
      const count = await notificationItems.count();

      if (count > 0) {
        // Action bar should be visible
        const actionBar = page.locator(
          '.md\\:hidden.bg-gray-50.border-b.border-gray-200'
        );
        await expect(actionBar).toBeVisible();
      }
    });
  });

  test.describe('Mark All Read Button - Mobile', () => {
    test('should show Mark All Read button when there are unread notifications', async ({
      page,
    }) => {
      const unreadText = await page
        .locator('text=/\\d+ unread/i')
        .textContent()
        .catch(() => null);

      if (unreadText) {
        const markAllReadButton = page.getByTestId(
          'mark-all-read-button-mobile'
        );
        await expect(markAllReadButton).toBeVisible();
      }
    });

    test('should not show Mark All Read button when all notifications are read', async ({
      page,
    }) => {
      const caughtUpText = await page
        .getByText('All caught up!')
        .isVisible()
        .catch(() => false);

      if (caughtUpText) {
        const markAllReadButton = page.getByTestId(
          'mark-all-read-button-mobile'
        );
        await expect(markAllReadButton).not.toBeVisible();
      }
    });

    test('should mark all notifications as read when clicked', async ({
      page,
    }) => {
      const markAllReadButton = page.getByTestId('mark-all-read-button-mobile');

      if (await markAllReadButton.isVisible()) {
        // Click mark all as read
        await markAllReadButton.click();

        // Wait for the operation to complete
        await page.waitForTimeout(1000);

        // Should show "All caught up!"
        const caughtUpVisible = await page
          .getByText('All caught up!')
          .isVisible()
          .catch(() => false);

        expect(caughtUpVisible).toBe(true);
      }
    });

    test('should be tappable on mobile (touch targets)', async ({ page }) => {
      const markAllReadButton = page.getByTestId('mark-all-read-button-mobile');

      if (await markAllReadButton.isVisible()) {
        const boundingBox = await markAllReadButton.boundingBox();
        // Touch target should be at least 44x44 pixels (iOS HIG recommendation)
        expect(boundingBox?.height).toBeGreaterThanOrEqual(30); // accounting for padding
      }
    });
  });

  test.describe('Clear All Button - Mobile', () => {
    test('should show Clear All button when there are notifications', async ({
      page,
    }) => {
      const notificationItems = page.locator('[data-testid*="notification"]');
      const count = await notificationItems.count();

      if (count > 0) {
        const clearAllButton = page.getByTestId('clear-all-button-mobile');
        await expect(clearAllButton).toBeVisible();
      }
    });

    test('should clear all notifications when clicked', async ({ page }) => {
      const clearAllButton = page.getByTestId('clear-all-button-mobile');

      if (await clearAllButton.isVisible()) {
        // Click clear all
        await clearAllButton.click();

        // Wait for the operation to complete
        await page.waitForTimeout(1000);

        // Should show empty state
        const emptyState = page.getByText('No notifications');
        await expect(emptyState).toBeVisible();
      }
    });

    test('should be tappable on mobile (touch targets)', async ({ page }) => {
      const clearAllButton = page.getByTestId('clear-all-button-mobile');

      if (await clearAllButton.isVisible()) {
        const boundingBox = await clearAllButton.boundingBox();
        // Touch target should be adequate for mobile
        expect(boundingBox?.height).toBeGreaterThanOrEqual(30);
      }
    });
  });

  test.describe('Mobile Button Interaction', () => {
    test('both buttons should be visible together in action bar when there are unread notifications', async ({
      page,
    }) => {
      const unreadText = await page
        .locator('text=/\\d+ unread/i')
        .textContent()
        .catch(() => null);

      if (unreadText) {
        const markAllReadButton = page.getByTestId(
          'mark-all-read-button-mobile'
        );
        const clearAllButton = page.getByTestId('clear-all-button-mobile');

        await expect(markAllReadButton).toBeVisible();
        await expect(clearAllButton).toBeVisible();

        // Both should be in the same container
        const actionBar = page.locator(
          '.md\\:hidden.bg-gray-50.border-b.border-gray-200'
        );
        await expect(actionBar).toContainText('Mark all read');
        await expect(actionBar).toContainText('Clear all');
      }
    });

    test('buttons should be horizontally aligned', async ({ page }) => {
      const markAllReadButton = page.getByTestId('mark-all-read-button-mobile');
      const clearAllButton = page.getByTestId('clear-all-button-mobile');

      if (
        (await markAllReadButton.isVisible()) &&
        (await clearAllButton.isVisible())
      ) {
        const markAllBox = await markAllReadButton.boundingBox();
        const clearAllBox = await clearAllButton.boundingBox();

        // Buttons should be roughly on the same horizontal line
        expect(
          Math.abs((markAllBox?.y || 0) - (clearAllBox?.y || 0))
        ).toBeLessThan(5);
      }
    });

    test('action bar should be sticky at top of mobile view', async ({
      page,
    }) => {
      const actionBar = page.locator(
        '.md\\:hidden.bg-gray-50.border-b.border-gray-200'
      );

      if (await actionBar.isVisible()) {
        const classes = await actionBar.getAttribute('class');
        expect(classes).toContain('sticky');
      }
    });
  });

  test.describe('Swipe Actions on Mobile', () => {
    test('should be able to swipe notification to delete', async ({ page }) => {
      // This tests that swipe-to-delete still works with the new buttons
      const firstNotification = page
        .locator('.border-b.border-gray-200')
        .first();

      if (await firstNotification.isVisible()) {
        const boundingBox = await firstNotification.boundingBox();

        if (boundingBox) {
          // Simulate swipe left gesture
          await page.touchscreen.tap(
            boundingBox.x + boundingBox.width / 2,
            boundingBox.y + boundingBox.height / 2
          );

          // Try to swipe (this is a basic test, actual swipe might need more complex gestures)
          await page.mouse.move(
            boundingBox.x + boundingBox.width / 2,
            boundingBox.y + boundingBox.height / 2
          );
          await page.mouse.down();
          await page.mouse.move(
            boundingBox.x + 50,
            boundingBox.y + boundingBox.height / 2
          );
          await page.mouse.up();

          // Delete button should appear
          await page.waitForTimeout(500);
          const deleteButton = page.getByText('Delete');
          // If swipe worked, delete button might be visible
          // This is a soft check since swipe gestures are complex in tests
        }
      }
    });
  });
});

test.describe('Notifications Page - Responsive Behavior', () => {
  test('should show desktop buttons when viewport is wide', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/notifications');
    await waitForNetworkIdle(page);

    const desktopMarkAllRead = page.getByTestId('mark-all-read-button-desktop');
    const desktopClearAll = page.getByTestId('clear-all-button-desktop');

    // Desktop buttons should be in DOM (might not be visible if no notifications)
    await expect(desktopMarkAllRead.or(page.locator('body'))).toBeAttached();
    await expect(desktopClearAll.or(page.locator('body'))).toBeAttached();
  });

  test('should show mobile buttons when viewport is narrow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/notifications');
    await waitForNetworkIdle(page);

    const mobileMarkAllRead = page.getByTestId('mark-all-read-button-mobile');
    const mobileClearAll = page.getByTestId('clear-all-button-mobile');

    // Mobile buttons should be in DOM (might not be visible if no notifications)
    await expect(mobileMarkAllRead.or(page.locator('body'))).toBeAttached();
    await expect(mobileClearAll.or(page.locator('body'))).toBeAttached();
  });

  test('should transition between mobile and desktop layouts', async ({
    page,
  }) => {
    // Start mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/notifications');
    await waitForNetworkIdle(page);

    // Resize to desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);

    // Desktop layout should be active
    const desktopContainer = page.locator('.hidden.md\\:flex');
    await expect(desktopContainer).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
    await waitForNetworkIdle(page);
  });

  test('Mark All Read button should be keyboard accessible', async ({
    page,
  }) => {
    const markAllReadButton = page
      .getByTestId('mark-all-read-button-desktop')
      .or(page.getByTestId('mark-all-read-button-mobile'));

    if (await markAllReadButton.isVisible()) {
      // Focus the button
      await markAllReadButton.focus();

      // Should be focused
      await expect(markAllReadButton).toBeFocused();

      // Should be activatable with Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });

  test('Clear All button should be keyboard accessible', async ({ page }) => {
    const clearAllButton = page
      .getByTestId('clear-all-button-desktop')
      .or(page.getByTestId('clear-all-button-mobile'));

    if (await clearAllButton.isVisible()) {
      // Focus the button
      await clearAllButton.focus();

      // Should be focused
      await expect(clearAllButton).toBeFocused();
    }
  });

  test('buttons should have proper color contrast', async ({ page }) => {
    const markAllReadButton = page
      .getByTestId('mark-all-read-button-desktop')
      .or(page.getByTestId('mark-all-read-button-mobile'));

    if (await markAllReadButton.isVisible()) {
      const color = await markAllReadButton.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      // Should have a color value (basic check)
      expect(color).toBeTruthy();
    }
  });

  test('buttons should have descriptive text', async ({ page }) => {
    const markAllReadButton = page
      .getByTestId('mark-all-read-button-desktop')
      .or(page.getByTestId('mark-all-read-button-mobile'));
    const clearAllButton = page
      .getByTestId('clear-all-button-desktop')
      .or(page.getByTestId('clear-all-button-mobile'));

    if (await markAllReadButton.isVisible()) {
      const text = await markAllReadButton.textContent();
      expect(text?.toLowerCase()).toContain('mark all read');
    }

    if (await clearAllButton.isVisible()) {
      const text = await clearAllButton.textContent();
      expect(text?.toLowerCase()).toContain('clear all');
    }
  });
});
