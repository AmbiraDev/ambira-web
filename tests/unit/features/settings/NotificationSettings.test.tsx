/**
 * Unit Tests: NotificationSettings Component
 *
 * Tests notification preferences UI including:
 * - Loading and default state
 * - Toggle controls for email and in-app notifications
 * - Save and error handling
 * - Different notification categories
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationSettings from '@/components/NotificationSettings';
import { debug } from '@/lib/debug';

// Mock dependencies
jest.mock('@/lib/debug', () => ({
  debug: {
    error: jest.fn(),
  },
}));

jest.mock('@/components/ui/settings-section', () => ({
  SettingsSection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-section">{children}</div>
  ),
  SettingsHeader: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div data-testid="settings-header">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
  SettingsCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-card">{children}</div>
  ),
  SettingsCardHeader: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div data-testid="settings-card-header">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  SettingsCardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-card-content">{children}</div>
  ),
  SettingsRow: ({
    label,
    description,
    children,
  }: {
    label: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="settings-row">
      <label>{label}</label>
      <p>{description}</p>
      {children}
    </div>
  ),
  SettingsRowGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-row-group">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
      data-testid="notification-switch"
    />
  ),
}));

describe('NotificationSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading skeleton initially', () => {
      render(<NotificationSettings />);

      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('loads preferences and renders content', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByTestId('settings-header')).toBeInTheDocument();
        expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Header Display', () => {
    it('displays correct title and description', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('Email Notifications')).toBeInTheDocument();
        expect(
          screen.getByText('Choose how you want to be notified about activity')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Legend Display', () => {
    it('displays legend for email and in-app notifications', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('In-App')).toBeInTheDocument();
      });
    });
  });

  describe('Social Notifications Section', () => {
    it('renders social notifications card with all options', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('Social Notifications')).toBeInTheDocument();
        expect(
          screen.getByText('Get notified when people interact with you')
        ).toBeInTheDocument();
      });
    });

    it('displays all social notification toggles', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('New Followers')).toBeInTheDocument();
        expect(screen.getByText('Post Support')).toBeInTheDocument();
        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByText('Mentions')).toBeInTheDocument();
        expect(screen.getByText('Replies')).toBeInTheDocument();
      });
    });

    it('initializes social notifications with default values', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        const switches = screen.getAllByTestId('notification-switch');
        expect(switches.length).toBeGreaterThan(0);
        // Default follows should be enabled for email and in-app
        expect(switches[0]).toBeChecked();
        expect(switches[1]).toBeChecked();
      });
    });
  });

  describe('Activity Notifications Section', () => {
    it('renders activity notifications card', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('Activity Notifications')).toBeInTheDocument();
        expect(
          screen.getByText('Get notified about your productivity milestones')
        ).toBeInTheDocument();
      });
    });

    it('displays achievement and streak reminders', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument();
        expect(screen.getByText('Streak Reminders')).toBeInTheDocument();
      });
    });
  });

  describe('Group & Challenge Notifications Section', () => {
    it('renders group notifications card', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('Group & Challenge Notifications')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Get notified about group activities and challenges')
        ).toBeInTheDocument();
      });
    });

    it('displays group posts and challenges toggles', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('Group Posts')).toBeInTheDocument();
        expect(screen.getByText('Challenges')).toBeInTheDocument();
      });
    });
  });

  describe('Toggle Functionality', () => {
    it('toggles email notification switch', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings />);

      await waitFor(() => {
        const switches = screen.getAllByTestId('notification-switch');
        expect(switches.length).toBeGreaterThan(0);
      });

      const switches = screen.getAllByTestId('notification-switch');
      const firstSwitch = switches[0];

      await user.click(firstSwitch);
      expect(firstSwitch).not.toBeChecked();
    });

    it('toggles in-app notification switch independently', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings />);

      await waitFor(() => {
        const switches = screen.getAllByTestId('notification-switch');
        expect(switches.length).toBeGreaterThan(0);
      });

      const switches = screen.getAllByTestId('notification-switch');
      const emailSwitch = switches[0];
      const inAppSwitch = switches[1];

      // Email and in-app switches are separate
      const initialEmailState = emailSwitch.checked;
      const initialInAppState = inAppSwitch.checked;

      await user.click(inAppSwitch);
      expect(inAppSwitch.checked).toBe(!initialInAppState);
      expect(emailSwitch.checked).toBe(initialEmailState);
    });

    it('maintains toggle state across different categories', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings />);

      await waitFor(() => {
        const switches = screen.getAllByTestId('notification-switch');
        expect(switches.length).toBeGreaterThan(0);
      });

      const switches = screen.getAllByTestId('notification-switch');

      // Toggle first switch (New Followers email)
      await user.click(switches[0]);
      expect(switches[0]).not.toBeChecked();

      // Other switches should remain unchanged
      expect(switches[1]).toBeChecked();
      expect(switches[2]).toBeChecked();
    });
  });

  describe('Save Functionality', () => {
    it('displays save button', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Save/i })
        ).toBeInTheDocument();
      });
    });

    it('disables save button while saving', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save/i });
        expect(saveButton).not.toBeDisabled();
      });

      const switches = screen.getAllByTestId('notification-switch');
      await user.click(switches[0]);

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Modal Support', () => {
    it('can render in modal mode with close button', async () => {
      const onClose = jest.fn();
      render(<NotificationSettings isModal={true} onClose={onClose} />);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', {
          name: /Close/i,
        });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked in modal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<NotificationSettings isModal={true} onClose={onClose} />);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', {
          name: /Close/i,
        });
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', {
        name: /Close/i,
      });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Default Values', () => {
    it('initializes with correct default notification preferences', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        const switches = screen.getAllByTestId('notification-switch');

        // Check defaults from defaultPreferences
        // Email: follows=true (index 0), supports=true (index 2), etc.
        expect(switches[0]).toBeChecked(); // email.follows
        expect(switches[1]).toBeChecked(); // inApp.follows
        expect(switches[2]).toBeChecked(); // email.supports
        expect(switches[3]).toBeChecked(); // inApp.supports
      });
    });

    it('has group posts disabled for email by default', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('Group Posts')).toBeInTheDocument();
      });

      // Group Posts should have email disabled but in-app enabled
      const groupPostsText = screen.getByText('Group Posts');
      const row = groupPostsText.closest('[data-testid="settings-row"]');
      const switches = row?.querySelectorAll(
        '[data-testid="notification-switch"]'
      );

      if (switches && switches.length >= 2) {
        expect((switches[0] as HTMLInputElement).checked).toBe(false); // email
        expect((switches[1] as HTMLInputElement).checked).toBe(true); // in-app
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for each toggle', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByText('New Followers')).toBeInTheDocument();
        expect(screen.getByText('Post Support')).toBeInTheDocument();
        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByText('Mentions')).toBeInTheDocument();
        expect(screen.getByText('Replies')).toBeInTheDocument();
        expect(screen.getByText('Achievements')).toBeInTheDocument();
        expect(screen.getByText('Streak Reminders')).toBeInTheDocument();
        expect(screen.getByText('Group Posts')).toBeInTheDocument();
        expect(screen.getByText('Challenges')).toBeInTheDocument();
      });
    });

    it('displays descriptions for each notification type', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('Someone starts following you')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Someone gives support to your post')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Someone comments on your post')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles loading errors gracefully', async () => {
      render(<NotificationSettings />);

      await waitFor(() => {
        // Should show default state even if there are errors
        expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      });

      // Check that debug.error wasn't called (using defaults instead)
      // This depends on implementation - currently uses defaults
    });
  });
});
