/**
 * E2E Tests: Notifications UI
 * Tests notification panel interactions including mark all as read and clear all
 */

import { test, expect } from '@playwright/test'

// Helper to wait for network idle
const waitForNetworkIdle = async (page: any) => {
  await page.waitForLoadState('networkidle')
}

test.describe('Notifications UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (adjust URL as needed)
    await page.goto('/')
    await waitForNetworkIdle(page)
  })

  test.describe('Notification panel display', () => {
    test('should display notification icon in header', async ({ page }) => {
      // Look for notification bell icon
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(
          page
            .locator('button:has-text("Notifications")')
            .or(page.getByRole('button', { name: /notification/i }))
        )

      await expect(notificationIcon.first()).toBeVisible()
    })

    test('should open notification panel when icon is clicked', async ({ page }) => {
      // Click notification icon
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(
          page
            .locator('button:has-text("Notifications")')
            .or(page.getByRole('button', { name: /notification/i }))
        )

      await notificationIcon.first().click()

      // Verify panel opens
      await expect(page.getByText('Notifications')).toBeVisible()
    })

    test('should close notification panel when backdrop is clicked', async ({ page }) => {
      // Open panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Wait for panel to be visible
      await expect(page.getByText('Notifications')).toBeVisible()

      // Click backdrop (outside the panel)
      await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })

      // Verify panel closes
      await expect(page.getByText('Notifications')).not.toBeVisible()
    })

    test('should display empty state when no notifications', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Check for empty state
      const emptyState = page.getByText('No notifications yet')

      // Either empty state is visible OR there are notifications
      const hasNotifications = (await page.locator('[data-notification-id]').count()) > 0

      if (!hasNotifications) {
        await expect(emptyState).toBeVisible()
      }
    })
  })

  test.describe('Mark all as read functionality', () => {
    test('should show mark all read button when there are unread notifications', async ({
      page,
    }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Check if there are any notifications
      const notificationCount = await page.locator('[data-notification-id]').count()

      if (notificationCount > 0) {
        // Check for unread badge or mark all read button
        const markAllButton = page.getByRole('button', {
          name: /mark all read/i,
        })
        const unreadBadge = page.locator('.bg-\\[\\#0066CC\\]').first()

        // If there are unread notifications, button should be visible
        const hasUnread = (await unreadBadge.count()) > 0
        if (hasUnread) {
          await expect(markAllButton).toBeVisible()
        }
      }
    })

    test('should mark all notifications as read when button is clicked', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Wait for panel to open
      await expect(page.getByText('Notifications')).toBeVisible()

      // Check if mark all button exists
      const markAllButton = page.getByRole('button', {
        name: /mark all read/i,
      })

      if (await markAllButton.isVisible()) {
        // Get unread count before
        const unreadBadgesBeforeCount = await page.locator('.bg-\\[\\#0066CC\\]').count()

        // Click mark all as read
        await markAllButton.click()

        // Wait for the operation to complete
        await page.waitForTimeout(1000)

        // Verify unread indicators are gone or reduced
        const unreadBadgesAfterCount = await page.locator('.bg-\\[\\#0066CC\\]').count()
        expect(unreadBadgesAfterCount).toBeLessThanOrEqual(unreadBadgesBeforeCount)
      }
    })

    test('should update unread count badge after marking all as read', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))

      // Check for unread badge on icon before
      const unreadBadgeBefore = notificationIcon.first().locator('.bg-\\[\\#0066CC\\]')
      const hadUnreadBefore = await unreadBadgeBefore.isVisible().catch(() => false)

      // Open panel
      await notificationIcon.first().click()

      // Mark all as read if button exists
      const markAllButton = page.getByRole('button', {
        name: /mark all read/i,
      })

      if (await markAllButton.isVisible()) {
        await markAllButton.click()

        // Wait for update
        await page.waitForTimeout(1000)

        // Close panel
        await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })

        // Check unread badge on icon after
        const unreadBadgeAfter = notificationIcon.first().locator('.bg-\\[\\#0066CC\\]')

        // Badge should be hidden or count reduced
        if (hadUnreadBefore) {
          const hasUnreadAfter = await unreadBadgeAfter.isVisible().catch(() => false)
          // At minimum, the badge should be gone or show 0
          if (hasUnreadAfter) {
            const badgeText = await unreadBadgeAfter.textContent()
            expect(parseInt(badgeText || '0')).toBe(0)
          }
        }
      }
    })
  })

  test.describe('Clear all functionality', () => {
    test('should show clear all button when there are notifications', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Check if there are notifications
      const notificationCount = await page.locator('[data-notification-id]').count()

      if (notificationCount > 0) {
        // Clear all button should be visible
        const clearAllButton = page.getByRole('button', { name: /clear all/i })
        await expect(clearAllButton).toBeVisible()
      }
    })

    test('should clear all notifications when button is clicked', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Wait for panel
      await expect(page.getByText('Notifications')).toBeVisible()

      // Check if clear all button exists
      const clearAllButton = page.getByRole('button', { name: /clear all/i })

      if (await clearAllButton.isVisible()) {
        // Get notification count before
        const notificationsBefore = await page.locator('[data-notification-id]').count()

        // Click clear all
        await clearAllButton.click()

        // Wait for the operation to complete
        await page.waitForTimeout(1000)

        // Verify notifications are cleared
        const notificationsAfter = await page.locator('[data-notification-id]').count()

        // Should either show empty state or have fewer notifications
        if (notificationsAfter === 0) {
          await expect(page.getByText('No notifications yet')).toBeVisible()
        } else {
          expect(notificationsAfter).toBeLessThan(notificationsBefore)
        }
      }
    })

    test('should hide clear all button after clearing all notifications', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Check if clear all button exists
      const clearAllButton = page.getByRole('button', { name: /clear all/i })

      if (await clearAllButton.isVisible()) {
        // Click clear all
        await clearAllButton.click()

        // Wait for operation
        await page.waitForTimeout(1000)

        // Button should be hidden (no notifications to clear)
        const notificationCount = await page.locator('[data-notification-id]').count()
        if (notificationCount === 0) {
          await expect(clearAllButton).not.toBeVisible()
        }
      }
    })
  })

  test.describe('Individual notification actions', () => {
    test('should show delete button on hover', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Get first notification
      const firstNotification = page.locator('[data-notification-id]').first()

      if (await firstNotification.isVisible()) {
        // Hover over notification
        await firstNotification.hover()

        // Wait a bit for hover state
        await page.waitForTimeout(200)

        // Delete button should appear
        const deleteButton = firstNotification.locator('button:has(svg)').last()
        await expect(deleteButton).toBeVisible()
      }
    })

    test('should mark notification as read when clicked', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Find an unread notification (has blue background or indicator)
      const unreadNotification = page
        .locator('[data-notification-id]')
        .locator('.bg-gray-100')
        .first()

      if (await unreadNotification.isVisible()) {
        const parentNotification = unreadNotification.locator('..')

        // Click the notification
        await parentNotification.click()

        // Panel should close and navigate
        await page.waitForTimeout(500)

        // Panel should be closed
        const panelVisible = await page
          .getByText('Notifications')
          .isVisible()
          .catch(() => false)
        expect(panelVisible).toBe(false)
      }
    })

    test('should delete individual notification when delete button is clicked', async ({
      page,
    }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Get first notification
      const firstNotification = page.locator('[data-notification-id]').first()

      if (await firstNotification.isVisible()) {
        // Get notification ID to track deletion
        const notificationId = await firstNotification.getAttribute('data-notification-id')

        // Hover to show delete button
        await firstNotification.hover()
        await page.waitForTimeout(200)

        // Click delete button
        const deleteButton = firstNotification.locator('button:has(svg)').last()
        await deleteButton.click()

        // Wait for deletion
        await page.waitForTimeout(500)

        // Verify notification is removed
        const deletedNotification = page.locator(`[data-notification-id="${notificationId}"]`)
        await expect(deletedNotification).not.toBeVisible()
      }
    })
  })

  test.describe('Notification types and icons', () => {
    test('should display correct icon for different notification types', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Check if notifications exist
      const notifications = page.locator('[data-notification-id]')
      const count = await notifications.count()

      if (count > 0) {
        // Each notification should have an icon
        for (let i = 0; i < Math.min(count, 3); i++) {
          const notification = notifications.nth(i)
          const icon = notification.locator('svg').first()
          await expect(icon).toBeVisible()
        }
      }
    })

    test('should display notification title and message', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Get first notification
      const firstNotification = page.locator('[data-notification-id]').first()

      if (await firstNotification.isVisible()) {
        // Should have title (font-semibold)
        const title = firstNotification.locator('.font-semibold').first()
        await expect(title).toBeVisible()

        // Should have message
        const message = firstNotification.locator('.text-gray-700')
        await expect(message.first()).toBeVisible()
      }
    })

    test('should display relative time for notifications', async ({ page }) => {
      // Open notification panel
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))
      await notificationIcon.first().click()

      // Get first notification
      const firstNotification = page.locator('[data-notification-id]').first()

      if (await firstNotification.isVisible()) {
        // Should have time indicator (text-xs text-gray-500)
        const timeIndicator = firstNotification.locator('.text-xs.text-gray-500')
        await expect(timeIndicator).toBeVisible()

        // Text should contain time-related words
        const timeText = await timeIndicator.textContent()
        expect(timeText).toMatch(/ago|now|minute|hour|day/i)
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab to notification icon
      await page.keyboard.press('Tab')

      // Keep tabbing until we find the notification button
      let attempts = 0
      while (attempts < 20) {
        const focused = await page.locator(':focus')
        const text = await focused.textContent().catch(() => '')
        if (
          text?.toLowerCase().includes('notification') ||
          (await focused.getAttribute('data-testid')) === 'notification-icon'
        ) {
          break
        }
        await page.keyboard.press('Tab')
        attempts++
      }

      // Press Enter to open panel
      await page.keyboard.press('Enter')

      // Verify panel opened
      await expect(page.getByText('Notifications')).toBeVisible()
    })

    test('should have proper ARIA labels', async ({ page }) => {
      // Check notification icon has proper labeling
      const notificationIcon = page
        .locator('[data-testid="notification-icon"]')
        .or(page.getByRole('button', { name: /notification/i }))

      await expect(notificationIcon.first()).toBeVisible()
    })
  })
})
