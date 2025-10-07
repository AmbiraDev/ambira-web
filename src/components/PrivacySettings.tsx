'use client';

import React, { useState, useEffect } from 'react';
import { PrivacySettings, UserProfile } from '@/types';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  SettingsSection,
  SettingsHeader,
  SettingsCard,
  SettingsCardHeader,
  SettingsCardContent,
  SettingsField
} from '@/components/ui/settings-section';
import {
  Shield,
  Globe,
  Users,
  Lock,
  Eye,
  UserX,
  Check,
  Activity,
  FolderKanban
} from 'lucide-react';
import { toast } from 'sonner';

interface PrivacySettingsProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ 
  onClose, 
  isModal = false 
}) => {
  const [settings, setSettings] = useState<PrivacySettings>({
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
      // TODO: Replace with real API call when backend is available
        const settings = await firebaseUserApi.getPrivacySettings();
        setSettings(settings);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlockedUsers = async (): Promise<UserProfile[]> => {
    try {
      // This would be a new API endpoint to get blocked users
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to load blocked users:', error);
      return [];
    }
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await firebaseUserApi.updatePrivacySettings(settings);
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      // TODO: Replace with real API call when backend is available
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      setSettings(prev => ({
        ...prev,
        blockedUsers: prev.blockedUsers.filter(id => id !== userId)
      }));
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Failed to unblock user:', error);
      toast.error('Failed to unblock user');
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'everyone':
        return <Globe className="w-4 h-4" />;
      case 'followers':
        return <Users className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getVisibilityDescription = (visibility: string, type: string) => {
    const descriptions = {
      profileVisibility: {
        everyone: 'Anyone can view your profile and basic information',
        followers: 'Only people you follow back can view your profile',
        private: 'Only you can view your profile'
      },
      activityVisibility: {
        everyone: 'Your activity is visible to everyone',
        followers: 'Your activity is only visible to your followers',
        private: 'Your activity is private'
      },
      projectVisibility: {
        everyone: 'Your projects are visible to everyone',
        followers: 'Your projects are only visible to your followers',
        private: 'Your projects are private'
      }
    };

    return descriptions[type as keyof typeof descriptions]?.[visibility as keyof typeof descriptions.profileVisibility] || '';
  };

  if (isLoading) {
    return (
      <SettingsSection>
        {[1, 2, 3].map((i) => (
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
            <Select
              value={settings.profileVisibility}
              onValueChange={(value: string) => handleSettingChange('profileVisibility', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Everyone - Anyone can view your profile</span>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Followers Only - Only people you follow back</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Private - Only you can view your profile</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
            <Select
              value={settings.activityVisibility}
              onValueChange={(value: string) => handleSettingChange('activityVisibility', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Everyone - Your activity is public</span>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Followers Only - Only your followers can see</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Private - Your activity is completely private</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
            <Select
              value={settings.projectVisibility}
              onValueChange={(value: string) => handleSettingChange('projectVisibility', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Everyone - Your projects are public</span>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Followers Only - Only your followers can see</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Private - Your projects are completely private</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
              {blockedUsers.map((blockedUser) => (
                <div key={blockedUser.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {blockedUser.profilePicture ? (
                      <img
                        src={blockedUser.profilePicture}
                        alt={`${blockedUser.name}'s profile picture`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FC4C02] to-[#FF8800] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {blockedUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{blockedUser.name}</h4>
                      <p className="text-sm text-gray-600">@{blockedUser.username}</p>
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
              <h3 className="font-medium text-gray-900 mb-1">No blocked users</h3>
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
          className="min-w-[120px] bg-[#007AFF] hover:bg-[#0051D5]"
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
