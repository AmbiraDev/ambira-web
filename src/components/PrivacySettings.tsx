'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PrivacySettings as PrivacySettingsType, UserProfile } from '@/types';
import { firebaseUserApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  SettingsSection,
  SettingsHeader,
  SettingsCard,
  SettingsCardHeader,
  SettingsCardContent,
  SettingsField,
} from '@/components/ui/settings-section';
import {
  Shield,
  Eye,
  UserX,
  Check,
  Activity,
  FolderKanban,
} from 'lucide-react';

interface PrivacySettingsProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  onClose,
  isModal = false,
}) => {
  const [settings, setSettings] = useState<PrivacySettingsType>({
    profileVisibility: 'everyone',
    activityVisibility: 'everyone',
    projectVisibility: 'everyone',
    blockedUsers: [],
  });
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement privacy settings fetching when Firebase getPrivacySettings() is available
      // Currently uses firebaseUserApi.getPrivacySettings() - verify implementation status
      const settings = await firebaseUserApi.getPrivacySettings();
      setSettings(settings);
    } catch (_error) {
      console.error('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (
    key: keyof PrivacySettingsType,
    value: string
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await firebaseUserApi.updatePrivacySettings(settings);
    } catch (_error) {
      console.error('Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      // TODO: Implement unblock user API endpoint in firebaseUserApi
      // Need to add unblockUser() method to handle Firebase user blocking/unblocking
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      setSettings(prev => ({
        ...prev,
        blockedUsers: prev.blockedUsers.filter(id => id !== userId),
      }));
    } catch (_error) {
      console.error('Failed to unblock user');
    }
  };

  if (isLoading) {
    return (
      <SettingsSection>
        {[1, 2, 3].map(i => (
          <SettingsCard key={i} className="animate-pulse">
            <SettingsCardHeader title="" description="" />
            <SettingsCardContent>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </SettingsCardContent>
          </SettingsCard>
        ))}
      </SettingsSection>
    );
  }

  return (
    <SettingsSection>
      {/* Header */}
      <div className="flex items-center justify-between">
        <SettingsHeader
          icon={Shield}
          title="Privacy Controls"
          description="Control who can see your profile, activity, and projects"
        />
        {isModal && onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Profile Visibility */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Eye}
          title="Profile Visibility"
          description="Control who can view your profile information"
        />
        <SettingsCardContent>
          <SettingsField label="Profile Access">
            <select
              value={settings.profileVisibility}
              onChange={e =>
                handleSettingChange('profileVisibility', e.target.value)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="everyone">
                Everyone - Anyone can view your profile
              </option>
              <option value="followers">
                Followers Only - Only people you follow back
              </option>
              <option value="private">
                Private - Only you can view your profile
              </option>
            </select>
          </SettingsField>
        </SettingsCardContent>
      </SettingsCard>

      {/* Activity Visibility */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Activity}
          title="Activity Visibility"
          description="Control who can see your productivity activity and sessions"
        />
        <SettingsCardContent>
          <SettingsField label="Activity Access">
            <select
              value={settings.activityVisibility}
              onChange={e =>
                handleSettingChange('activityVisibility', e.target.value)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="everyone">
                Everyone - Your activity is public
              </option>
              <option value="followers">
                Followers Only - Only your followers can see
              </option>
              <option value="private">
                Private - Your activity is completely private
              </option>
            </select>
          </SettingsField>
        </SettingsCardContent>
      </SettingsCard>

      {/* Project Visibility */}
      <SettingsCard>
        <SettingsCardHeader
          icon={FolderKanban}
          title="Project Visibility"
          description="Control who can see your projects and their details"
        />
        <SettingsCardContent>
          <SettingsField label="Project Access">
            <select
              value={settings.projectVisibility}
              onChange={e =>
                handleSettingChange('projectVisibility', e.target.value)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="everyone">
                Everyone - Your projects are public
              </option>
              <option value="followers">
                Followers Only - Only your followers can see
              </option>
              <option value="private">
                Private - Your projects are completely private
              </option>
            </select>
          </SettingsField>
        </SettingsCardContent>
      </SettingsCard>

      {/* Blocked Users */}
      <SettingsCard>
        <SettingsCardHeader
          icon={UserX}
          title="Blocked Users"
          description="Manage users you have blocked from viewing your profile"
        />
        <SettingsCardContent>
          {blockedUsers.length > 0 ? (
            <div className="space-y-3">
              {blockedUsers.map(blockedUser => (
                <div
                  key={blockedUser.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {blockedUser.profilePicture ? (
                      <Image
                        src={blockedUser.profilePicture}
                        alt={`${blockedUser.name}'s profile picture`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FC4C02] to-[#FF8800] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {blockedUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {blockedUser.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        @{blockedUser.username}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblockUser(blockedUser.id)}
                    className="flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">
                No blocked users
              </h3>
              <p className="text-sm text-gray-600">
                Users you block will appear here
              </p>
            </div>
          )}
        </SettingsCardContent>
      </SettingsCard>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[120px] bg-[#0066CC] hover:bg-[#0051D5]"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </SettingsSection>
  );
};

// Modal wrapper
interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <PrivacySettings onClose={onClose} isModal={true} />
        </div>
      </div>
    </div>
  );
};
