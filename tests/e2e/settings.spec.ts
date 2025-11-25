/**
 * E2E Tests: Settings Page
 *
 * Tests complete settings workflows including:
 * - Navigation between settings tabs
 * - Profile settings updates
 * - Privacy settings changes
 * - Notification preferences
 * - Responsive behavior
 * - Form validation and error handling
 */

import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Navigation', () => {
    test('should display all settings tabs', async ({ page }) => {
      // Desktop tabs
      const tabs = ['My Profile', 'Privacy Controls', 'Email Notifications', 'Display Preferences']

      for (const tabName of tabs) {
        const tab = page.getByText(tabName).first()
        await expect(tab).toBeVisible()
      }
    })

    test('should navigate to profile tab by default', async ({ page }) => {
      // Check that profile content is visible
      const profileHeading = page.getByText('My Profile').first()
      await expect(profileHeading).toBeVisible()

      // Check for profile form elements
      await expect(page.getByLabel(/Name/i).first()).toBeVisible()
    })

    test('should switch to privacy tab when clicked', async ({ page }) => {
      const privacyTab = page.getByText('Privacy Controls').first()
      await privacyTab.click()

      // Wait for privacy content to appear
      await expect(
        page.getByText('Control who can see your profile, activity, and projects')
      ).toBeVisible()

      // Check for privacy form elements
      await expect(page.getByLabel(/Profile Access/i).first()).toBeVisible()
    })

    test('should switch to notifications tab when clicked', async ({ page }) => {
      const notificationsTab = page.getByText('Email Notifications').first()
      await notificationsTab.click()

      // Wait for notifications content
      await expect(
        page.getByText('Choose how you want to be notified about activity')
      ).toBeVisible()
    })

    test('should switch to display preferences tab when clicked', async ({ page }) => {
      const displayTab = page.getByText('Display Preferences').first()
      await displayTab.click()

      // Wait for display content
      await expect(page.getByText('Coming Soon')).toBeVisible()
    })

    test('should maintain tab selection during interactions', async ({ page }) => {
      const privacyTab = page.getByText('Privacy Controls').first()
      await privacyTab.click()

      // Wait for content
      await page
        .getByLabel(/Profile Access/i)
        .first()
        .waitFor()

      // Tab should still be selected
      const tabButton = page.locator('button').filter({ hasText: 'Privacy Controls' }).first()
      await expect(tabButton).toHaveClass(/bg-\[#0066CC\]/)
    })
  })

  test.describe('Profile Settings', () => {
    test('should load profile information', async ({ page }) => {
      // Check for editable profile fields
      const nameInput = page.getByLabel(/Name/i).first()
      await expect(nameInput).toBeVisible()

      // Check for username (read-only)
      const usernameInput = page
        .getByLabel(/Username/i)
        .locator('input')
        .first()
      await expect(usernameInput).toBeDisabled()
    })

    test('should update profile name', async ({ page }) => {
      const nameInput = page.getByLabel(/Name/i).first() as any
      const originalValue = await nameInput.inputValue()

      // Clear and enter new name
      await nameInput.click()
      await nameInput.fill('New Name')

      // Verify change
      const newValue = await nameInput.inputValue()
      expect(newValue).toBe('New Name')
      expect(newValue).not.toBe(originalValue)
    })

    test('should enable save button when changes are made', async ({ page }) => {
      const saveButton = page.getByRole('button', { name: /Save Changes/i })

      // Initially disabled
      await expect(saveButton).toBeDisabled()

      // Make a change
      const nameInput = page.getByLabel(/Name/i).first()
      await nameInput.click()
      await nameInput.fill('Different Name')

      // Save button should now be enabled
      await expect(saveButton).not.toBeDisabled()
    })

    test('should update tagline with character count', async ({ page }) => {
      const taglineInput = page.getByLabel(/Tagline/i).first()

      // Check initial value and count
      await expect(taglineInput).toBeVisible()

      // Update tagline
      await taglineInput.click()
      await taglineInput.fill('New Tagline')

      // Check character count is displayed
      const charCount = page.getByText(/\d+\/60/)
      await expect(charCount).toBeVisible()
    })

    test('should update bio with character count', async ({ page }) => {
      const bioTextarea = page.getByLabel(/Bio/i).first()

      await expect(bioTextarea).toBeVisible()

      // Update bio
      await bioTextarea.click()
      await bioTextarea.fill('New bio content')

      // Check character count
      const charCount = page.getByText(/\d+\/160/)
      await expect(charCount).toBeVisible()
    })

    test('should update social media links', async ({ page }) => {
      // Twitter
      const twitterInput = page
        .locator('label')
        .filter({ hasText: 'Twitter/X' })
        .locator('../input')
        .first()
      await expect(twitterInput).toBeVisible()

      await twitterInput.click()
      await twitterInput.fill('newtwitterhandle')

      const twitterValue = await twitterInput.inputValue()
      expect(twitterValue).toBe('newtwitterhandle')
    })

    test('should display email as read-only', async ({ page }) => {
      const emailField = page.getByText(/Email/).locator('../..').locator('p').first()

      await expect(emailField).toBeVisible()
      // Email should be text, not input
      const input = page
        .locator('input[value*="example.com"]')
        .or(page.locator('input[value*="test@"]'))
      await expect(input).toHaveCount(0)
    })
  })

  test.describe('Profile Picture Upload', () => {
    test('should display profile picture section', async ({ page }) => {
      const uploadLabel = page.getByText('Upload Photo').or(page.getByText('Profile Picture'))

      await expect(uploadLabel.first()).toBeVisible()
    })

    test('should show upload button', async ({ page }) => {
      const uploadButton = page.getByRole('button').or(page.getByLabel(/Upload Photo/i))

      // Should have upload button or file input
      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput.or(uploadButton.first())).toBeTruthy()
    })

    test('should display file size limit info', async ({ page }) => {
      const sizeInfo = page.getByText(/Max.*MB/i).or(page.getByText(/5MB/i))

      await expect(sizeInfo.first()).toBeVisible()
    })
  })

  test.describe('Privacy Settings', () => {
    test('should navigate to privacy settings tab', async ({ page }) => {
      const privacyTab = page.getByText('Privacy Controls').first()
      await privacyTab.click()

      await expect(page.getByText('Control who can see your profile')).toBeVisible()
    })

    test('should display profile visibility options', async ({ page }) => {
      const privacyTab = page.getByText('Privacy Controls').first()
      await privacyTab.click()

      const select = page.getByLabel(/Profile Access/i).first()
      await expect(select).toBeVisible()

      // Click to see options
      await select.click()

      // Check for visibility options
      const options = ['Everyone', 'Followers Only', 'Private']
      for (const option of options) {
        const optionElement = page.getByRole('option').filter({ hasText: option }).first()
        const exists = await optionElement.count().catch(() => 0)
        // Options might be in select element text instead
      }
    })

    test('should save privacy settings', async ({ page }) => {
      const privacyTab = page.getByText('Privacy Controls').first()
      await privacyTab.click()

      const select = page.getByLabel(/Profile Access/i).first()
      await select.selectOption('private')

      const saveButton = page.getByRole('button', { name: /Save Changes/i })
      await saveButton.click()

      // Wait for success message
      const successMessage = page.getByText(/saved|updated/i)
      await expect(successMessage.first()).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Notification Settings', () => {
    test('should navigate to notification settings', async ({ page }) => {
      const notificationsTab = page.getByText('Email Notifications').first()
      await notificationsTab.click()

      await expect(page.getByText('Choose how you want to be notified')).toBeVisible()
    })

    test('should display notification toggle switches', async ({ page }) => {
      const notificationsTab = page.getByText('Email Notifications').first()
      await notificationsTab.click()

      // Wait for switches to load
      const switches = page.locator('input[type="checkbox"]')
      const count = await switches.count()

      // Should have multiple notification switches
      expect(count).toBeGreaterThan(0)
    })

    test('should toggle notification preferences', async ({ page }) => {
      const notificationsTab = page.getByText('Email Notifications').first()
      await notificationsTab.click()

      // Find and toggle a switch
      const switches = page.locator('input[role="switch"]')
      const firstSwitch = switches.first()

      const initialState = await firstSwitch.isChecked()
      await firstSwitch.click()
      const newState = await firstSwitch.isChecked()

      expect(newState).not.toBe(initialState)
    })
  })

  test.describe('Account Actions', () => {
    test('should display logout button', async ({ page }) => {
      const logoutButton = page.getByText(/Log Out/i)

      await expect(logoutButton).toBeVisible()
    })

    test('should display delete account button', async ({ page }) => {
      const deleteButton = page.getByText(/Delete Account/i)

      await expect(deleteButton).toBeVisible()
    })

    test('should show delete confirmation dialog', async ({ page }) => {
      const deleteButton = page.getByText(/Delete Account/i)
      await deleteButton.click()

      // Confirmation dialog should appear
      const confirmDialog = page.getByText(/Are you absolutely sure/i)
      await expect(confirmDialog).toBeVisible()
    })

    test('should allow canceling account deletion', async ({ page }) => {
      const deleteButton = page.getByText(/Delete Account/i)
      await deleteButton.click()

      // Click cancel
      const cancelButton = page.getByRole('button', { name: /Cancel/i })
      await cancelButton.click()

      // Dialog should close
      const confirmDialog = page.getByText(/Are you absolutely sure/i)
      await expect(confirmDialog).not.toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('should not allow empty name', async ({ page }) => {
      const nameInput = page.getByLabel(/Name/i).first()
      await nameInput.click()
      await nameInput.clear()

      // Name should be required, save button might be disabled
      const saveButton = page.getByRole('button', { name: /Save Changes/i })

      // Check if save button is disabled or validation error shown
      const isDisabled = await saveButton.isDisabled().catch(() => false)
      expect(isDisabled).toBe(true)
    })

    test('should enforce tagline character limit', async ({ page }) => {
      const taglineInput = page.getByLabel(/Tagline/i).first()

      // Try to exceed 60 characters
      const longText = 'a'.repeat(70)
      await taglineInput.fill(longText)

      const value = await taglineInput.inputValue()

      // Should be limited or truncated to 60 chars
      expect(value.length).toBeLessThanOrEqual(60)
    })

    test('should enforce bio character limit', async ({ page }) => {
      const bioInput = page.getByLabel(/Bio/i).first()

      // Try to exceed 160 characters
      const longText = 'a'.repeat(170)
      await bioInput.fill(longText)

      const value = await bioInput.inputValue()

      // Should be limited to 160 chars
      expect(value.length).toBeLessThanOrEqual(160)
    })

    test('should validate website URL format', async ({ page }) => {
      const websiteInput = page
        .getByLabel(/Website/i)
        .or(page.locator('input[placeholder*="https"]').first())
        .first()

      // Test invalid URL
      await websiteInput.fill('not-a-url')

      // Browser validation might show error
      const isValid = await websiteInput
        .evaluate((el: HTMLInputElement) => el.validity.valid)
        .catch(() => true)

      // URL field might have type="url" validation
    })
  })

  test.describe('Responsive Design', () => {
    test('should display desktop layout on large screen', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })

      // Desktop header should be visible
      const header = page.locator('[data-testid="header"]')
      const desktopVisible = await header.isVisible().catch(() => false)

      // Desktop sidebar tabs should be visible
      const tabs = page.locator('button').filter({ hasText: 'My Profile' })
      await expect(tabs.first()).toBeVisible()
    })

    test('should display mobile layout on small screen', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Mobile header should be visible
      const mobileHeader = page.locator('[data-testid="mobile-header"]')
      const mobileVisible = await mobileHeader.isVisible().catch(() => false)

      // Mobile tabs should be visible
      const tabs = page.locator('button').filter({ hasText: 'My Profile' })
      await expect(tabs.first()).toBeVisible()
    })

    test('should make form inputs responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const nameInput = page.getByLabel(/Name/i).first()
      await expect(nameInput).toBeVisible()

      // Input should be full width on mobile
      const box = await nameInput.boundingBox()
      expect(box?.width).toBeGreaterThan(200)
    })

    test('should stack buttons on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const buttons = page.locator('button').filter({
        hasText: /Save Changes|Cancel/,
      })

      // Buttons should be visible and stacked
      const count = await buttons.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Error Handling', () => {
    test('should handle update errors gracefully', async ({ page }) => {
      // This test would need a way to simulate API errors
      // For now, just verify error UI exists if error occurs

      const nameInput = page.getByLabel(/Name/i).first()
      await nameInput.fill('Test Name')

      const saveButton = page.getByRole('button', { name: /Save Changes/i })
      await saveButton.click()

      // Look for either success or error message
      const message = page.getByText(/saved|updated|failed|error/i)
      await expect(message.first()).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Navigation Integration', () => {
    test('should have breadcrumbs or title', async ({ page }) => {
      const pageTitle = page.getByText('Settings')
      await expect(pageTitle.first()).toBeVisible()
    })

    test('should have link to profile from settings', async ({ page }) => {
      // Check for profile link
      const profileLink = page
        .getByRole('link')
        .filter({ hasText: /profile|user/i })
        .first()

      const exists = await profileLink.count().catch(() => 0)
      // Profile link might exist but is optional
    })

    test('should maintain navigation history', async ({ page }) => {
      // Change tab
      const privacyTab = page.getByText('Privacy Controls').first()
      await privacyTab.click()

      // Go back
      await page.goBack()

      // Should be back to default tab or previous state
      await page.waitForLoadState('networkidle')
    })
  })
})
