'use client';

import React, { useState, useEffect } from 'react';
import { PrivacySettings, UserProfile } from '@/types';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Globe, 
  Users, 
  Lock, 
  Eye, 
  UserX, 
  Check
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
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-10 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Privacy Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Control who can see your profile, activity, and projects
          </p>
        </div>
        {isModal && onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getVisibilityIcon(settings.profileVisibility)}
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can view your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Profile Access</Label>
            <Select
              value={settings.profileVisibility}
              onValueChange={(value: string) => handleSettingChange('profileVisibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Everyone</div>
                      <div className="text-sm text-muted-foreground">Anyone can view your profile</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Followers Only</div>
                      <div className="text-sm text-muted-foreground">Only people you follow back</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-sm text-muted-foreground">Only you can view your profile</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {getVisibilityDescription(settings.profileVisibility, 'profileVisibility')}
          </p>
        </CardContent>
      </Card>

      {/* Activity Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getVisibilityIcon(settings.activityVisibility)}
            Activity Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your productivity activity and sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-visibility">Activity Access</Label>
            <Select
              value={settings.activityVisibility}
              onValueChange={(value: string) => handleSettingChange('activityVisibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Everyone</div>
                      <div className="text-sm text-muted-foreground">Your activity is public</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Followers Only</div>
                      <div className="text-sm text-muted-foreground">Only your followers can see your activity</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-sm text-muted-foreground">Your activity is completely private</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {getVisibilityDescription(settings.activityVisibility, 'activityVisibility')}
          </p>
        </CardContent>
      </Card>

      {/* Project Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getVisibilityIcon(settings.projectVisibility)}
            Project Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your projects and their details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-visibility">Project Access</Label>
            <Select
              value={settings.projectVisibility}
              onValueChange={(value: string) => handleSettingChange('projectVisibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Everyone</div>
                      <div className="text-sm text-muted-foreground">Your projects are public</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Followers Only</div>
                      <div className="text-sm text-muted-foreground">Only your followers can see your projects</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-sm text-muted-foreground">Your projects are completely private</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {getVisibilityDescription(settings.projectVisibility, 'projectVisibility')}
          </p>
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Blocked Users
          </CardTitle>
          <CardDescription>
            Manage users you have blocked from viewing your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedUsers.length > 0 ? (
            <div className="space-y-3">
              {blockedUsers.map((blockedUser) => (
                <div key={blockedUser.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    {blockedUser.profilePicture ? (
                      <img
                        src={blockedUser.profilePicture}
                        alt={`${blockedUser.name}'s profile picture`}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {blockedUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-foreground">{blockedUser.name}</h4>
                      <p className="text-sm text-muted-foreground">@{blockedUser.username}</p>
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
              <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-1">No blocked users</h3>
              <p className="text-sm text-muted-foreground">
                Users you block will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[120px]"
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
    </div>
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
