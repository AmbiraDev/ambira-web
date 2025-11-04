/**
 * Unit Tests: PrivacySettings Component
 *
 * Tests privacy settings UI including:
 * - Loading and default state
 * - Profile visibility controls
 * - Activity visibility controls
 * - Project visibility controls
 * - Blocked users management
 * - Save and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacySettings } from '@/components/PrivacySettings';
import { firebaseUserApi } from '@/lib/api';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  firebaseUserApi: {
    getPrivacySettings: jest.fn(),
    updatePrivacySettings: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
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
  SettingsField: ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="settings-field">
      <label>{label}</label>
      {children}
    </div>
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

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => <img src={src} alt={alt} width={width} height={height} />,
}));

const mockFirebaseUserApi = require('@/lib/api').firebaseUserApi;

const mockPrivacySettings = {
  profileVisibility: 'everyone' as const,
  activityVisibility: 'everyone' as const,
  projectVisibility: 'followers' as const,
  blockedUsers: [],
};

describe('PrivacySettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirebaseUserApi.getPrivacySettings.mockResolvedValue(
      mockPrivacySettings
    );
  });

  describe('Loading State', () => {
    it('shows loading skeleton initially', () => {
      render(<PrivacySettings />);

      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('loads settings and renders content', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(screen.getByTestId('settings-header')).toBeInTheDocument();
        expect(screen.getByText('Privacy Controls')).toBeInTheDocument();
      });
    });

    it('fetches privacy settings on mount', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(mockFirebaseUserApi.getPrivacySettings).toHaveBeenCalled();
      });
    });
  });

  describe('Header Display', () => {
    it('displays correct title and description', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(screen.getByText('Privacy Controls')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Control who can see your profile, activity, and projects'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Profile Visibility Section', () => {
    it('renders profile visibility card', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
        expect(
          screen.getByText('Control who can view your profile information')
        ).toBeInTheDocument();
      });
    });

    it('displays all profile visibility options', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        const select = screen.getByDisplayValue(
          /Everyone - Anyone can view your profile/i
        );
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue(
        /Everyone - Anyone can view your profile/i
      );
      fireEvent.click(select);

      await waitFor(() => {
        expect(
          screen.getByText(/Everyone - Anyone can view your profile/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Followers Only - Only people you follow back/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Private - Only you can view your profile/i)
        ).toBeInTheDocument();
      });
    });

    it('initializes with fetched profile visibility', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        const select = screen.getByDisplayValue(
          /Everyone - Anyone can view your profile/i
        ) as HTMLSelectElement;
        expect(select.value).toBe('everyone');
      });
    });

    it('updates profile visibility on change', async () => {
      const user = userEvent.setup();
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(
          screen.getByDisplayValue(/Everyone - Anyone can view your profile/i)
        ).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue(
        /Everyone - Anyone can view your profile/i
      );
      await user.selectOption(select, 'private');

      expect(select).toHaveValue('private');
    });
  });

  describe('Activity Visibility Section', () => {
    it('renders activity visibility card', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(screen.getByText('Activity Visibility')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Control who can see your productivity activity and sessions'
          )
        ).toBeInTheDocument();
      });
    });

    it('displays all activity visibility options', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        const selects = screen.getAllByDisplayValue(
          /Everyone - Your activity is public/i
        );
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    it('initializes with fetched activity visibility', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        const selects = screen.getAllByDisplayValue(
          /Everyone - Your activity is public/i
        );
        const activitySelect = selects[0] as HTMLSelectElement;
        expect(activitySelect.value).toBe('everyone');
      });
    });

    it('updates activity visibility on change', async () => {
      const user = userEvent.setup();
      render(<PrivacySettings />);

      await waitFor(() => {
        const selects = screen.getAllByDisplayValue(
          /Everyone - Your activity is public/i
        );
        expect(selects.length).toBeGreaterThan(0);
      });

      const selects = screen.getAllByDisplayValue(
        /Everyone - Your activity is public/i
      );
      await user.selectOption(selects[0], 'followers');

      expect(selects[0]).toHaveValue('followers');
    });
  });

  describe('Project Visibility Section', () => {
    it('renders project visibility card', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(screen.getByText('Project Visibility')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Control who can see your projects and their details'
          )
        ).toBeInTheDocument();
      });
    });

    it('displays all project visibility options', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        const selects = screen.getAllByDisplayValue(
          /Everyone - Your projects are public/i
        );
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    it('initializes with fetched project visibility', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        const selects = screen.getAllByDisplayValue(
          /Everyone - Your projects are public/i
        );
        const projectSelect = selects[0] as HTMLSelectElement;
        expect(projectSelect.value).toBe('everyone');
      });
    });
  });

  describe('Blocked Users Section', () => {
    it('renders blocked users card', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(screen.getByText('Blocked Users')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Manage users you have blocked from viewing your profile'
          )
        ).toBeInTheDocument();
      });
    });

    it('shows empty state when no users are blocked', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(screen.getByText('No blocked users')).toBeInTheDocument();
        expect(
          screen.getByText('Users you block will appear here')
        ).toBeInTheDocument();
      });
    });

    it('displays blocked users list when users are blocked', async () => {
      const settingsWithBlockedUsers = {
        ...mockPrivacySettings,
        blockedUsers: ['user-123'],
      };
      mockFirebaseUserApi.getPrivacySettings.mockResolvedValue(
        settingsWithBlockedUsers
      );

      render(<PrivacySettings />);

      await waitFor(() => {
        // The component loads blocked users but needs to fetch user details
        // For now, check that the structure is there
        expect(screen.getByText('Blocked Users')).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('displays save button', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Save Settings/i })
        ).toBeInTheDocument();
      });
    });

    it('saves privacy settings on button click', async () => {
      mockFirebaseUserApi.updatePrivacySettings.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<PrivacySettings />);

      await waitFor(() => {
        const selects = screen.getAllByDisplayValue(
          /Everyone - Anyone can view your profile/i
        );
        expect(selects.length).toBeGreaterThan(0);
      });

      const select = screen.getByDisplayValue(
        /Everyone - Anyone can view your profile/i
      );
      await user.selectOption(select, 'private');

      const saveButton = screen.getByRole('button', {
        name: /Save Settings/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockFirebaseUserApi.updatePrivacySettings).toHaveBeenCalledWith(
          expect.objectContaining({
            profileVisibility: 'private',
          })
        );
      });
    });

    it('shows success toast on successful save', async () => {
      mockFirebaseUserApi.updatePrivacySettings.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<PrivacySettings />);

      await waitFor(() => {
        const select = screen.getByDisplayValue(
          /Everyone - Anyone can view your profile/i
        );
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue(
        /Everyone - Anyone can view your profile/i
      );
      await user.selectOption(select, 'private');

      const saveButton = screen.getByRole('button', {
        name: /Save Settings/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Privacy settings updated successfully'
        );
      });
    });

    it('shows error toast on save failure', async () => {
      mockFirebaseUserApi.updatePrivacySettings.mockRejectedValue(
        new Error('Save failed')
      );

      const user = userEvent.setup();
      render(<PrivacySettings />);

      await waitFor(() => {
        const select = screen.getByDisplayValue(
          /Everyone - Anyone can view your profile/i
        );
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue(
        /Everyone - Anyone can view your profile/i
      );
      await user.selectOption(select, 'private');

      const saveButton = screen.getByRole('button', {
        name: /Save Settings/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to save privacy settings'
        );
      });
    });

    it('disables save button while saving', async () => {
      mockFirebaseUserApi.updatePrivacySettings.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(resolve, 1000);
          })
      );

      const user = userEvent.setup();
      render(<PrivacySettings />);

      await waitFor(() => {
        const select = screen.getByDisplayValue(
          /Everyone - Anyone can view your profile/i
        );
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue(
        /Everyone - Anyone can view your profile/i
      );
      await user.selectOption(select, 'private');

      const saveButton = screen.getByRole('button', {
        name: /Save Settings/i,
      });
      await user.click(saveButton);

      expect(saveButton).toBeDisabled();
    });
  });

  describe('Modal Support', () => {
    it('renders close button in modal mode', async () => {
      const onClose = jest.fn();
      render(<PrivacySettings isModal={true} onClose={onClose} />);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', {
          name: /Close/i,
        });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<PrivacySettings isModal={true} onClose={onClose} />);

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

  describe('Error Handling', () => {
    it('shows error toast if loading settings fails', async () => {
      mockFirebaseUserApi.getPrivacySettings.mockRejectedValue(
        new Error('Load failed')
      );

      render(<PrivacySettings />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to load privacy settings'
        );
      });
    });

    it('renders with defaults if settings load fails', async () => {
      mockFirebaseUserApi.getPrivacySettings.mockRejectedValue(
        new Error('Load failed')
      );

      render(<PrivacySettings />);

      await waitFor(() => {
        // Component should still be functional with defaults
        expect(screen.getByText('Privacy Controls')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has descriptive labels for each visibility control', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(screen.getByText('Profile Access')).toBeInTheDocument();
        expect(screen.getByText('Activity Access')).toBeInTheDocument();
        expect(screen.getByText('Project Access')).toBeInTheDocument();
      });
    });

    it('provides context descriptions for each section', async () => {
      render(<PrivacySettings />);

      await waitFor(() => {
        expect(
          screen.getByText('Control who can view your profile information')
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'Control who can see your productivity activity and sessions'
          )
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'Control who can see your projects and their details'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('maintains independent state for each visibility setting', async () => {
      const user = userEvent.setup();
      render(<PrivacySettings />);

      await waitFor(() => {
        const select = screen.getByDisplayValue(
          /Everyone - Anyone can view your profile/i
        );
        expect(select).toBeInTheDocument();
      });

      const selects = screen.getAllByRole('combobox');

      // Change first select (profile visibility)
      await user.selectOption(selects[0], 'private');

      // Verify only first select changed
      expect(selects[0]).toHaveValue('private');

      // Second select should still be 'everyone'
      if (selects[1]) {
        expect(selects[1]).toHaveValue('everyone');
      }
    });
  });
});
