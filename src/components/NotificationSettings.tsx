'use client';

import React, { useState, useEffect } from 'react';
import { NotificationPreferences } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  SettingsSection,
  SettingsHeader,
  SettingsCard,
  SettingsCardHeader,
  SettingsCardContent,
  SettingsRow,
  SettingsRowGroup
} from '@/components/ui/settings-section';
import { Bell, Mail, BellRing, Heart, MessageCircle, UserPlus, Trophy, Flame, Users } from 'lucide-react';

interface NotificationSettingsProps {
  onClose?: () => void;
  isModal?: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email: {
    follows: true,
    supports: true,
    comments: true,
    mentions: true,
    replies: true,
    achievements: true,
    streaks: true,
    groupPosts: false,
    challenges: true,
  },
  inApp: {
    follows: true,
    supports: true,
    comments: true,
    mentions: true,
    replies: true,
    achievements: true,
    streaks: true,
    groupPosts: true,
    challenges: true,
  }
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  onClose, 
  isModal = false 
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      // TODO: Load from Firestore when backend is ready
      // For now, use defaults
      setPreferences(defaultPreferences);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (
    category: 'email' | 'inApp',
    key: keyof NotificationPreferences['email']
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // TODO: Save to Firestore when backend is ready
      alert('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      alert('Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const NotificationToggle = ({
    label,
    description,
    emailEnabled,
    inAppEnabled,
    settingKey
  }: {
    label: string;
    description: string;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    settingKey: keyof NotificationPreferences['email'];
  }) => (
    <SettingsRow label={label} description={description}>
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <Switch
            checked={emailEnabled}
            onCheckedChange={() => handleToggle('email', settingKey)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <Switch
            checked={inAppEnabled}
            onCheckedChange={() => handleToggle('inApp', settingKey)}
          />
        </div>
      </div>
    </SettingsRow>
  );

  if (isLoading) {
    return (
      <SettingsSection>
        {[1, 2].map((i) => (
          <SettingsCard key={i} className="animate-pulse">
            <SettingsCardHeader title="" description="" />
            <SettingsCardContent>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
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
          icon={BellRing}
          title="Email Notifications"
          description="Choose how you want to be notified about activity"
        />
        {isModal && onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Legend */}
      <SettingsCard>
        <SettingsCardContent>
          <div className="flex items-center justify-end gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>In-App</span>
            </div>
          </div>
        </SettingsCardContent>
      </SettingsCard>

      {/* Social Notifications */}
      <SettingsCard>
        <SettingsCardHeader
          icon={UserPlus}
          title="Social Notifications"
          description="Get notified when people interact with you"
        />
        <SettingsCardContent>
          <SettingsRowGroup>
            <NotificationToggle
              label="New Followers"
              description="Someone starts following you"
              emailEnabled={preferences.email.follows}
              inAppEnabled={preferences.inApp.follows}
              settingKey="follows"
            />
            <NotificationToggle
              label="Post Support"
              description="Someone gives support to your post"
              emailEnabled={preferences.email.supports}
              inAppEnabled={preferences.inApp.supports}
              settingKey="supports"
            />
            <NotificationToggle
              label="Comments"
              description="Someone comments on your post"
              emailEnabled={preferences.email.comments}
              inAppEnabled={preferences.inApp.comments}
              settingKey="comments"
            />
            <NotificationToggle
              label="Mentions"
              description="Someone mentions you in a comment"
              emailEnabled={preferences.email.mentions}
              inAppEnabled={preferences.inApp.mentions}
              settingKey="mentions"
            />
            <NotificationToggle
              label="Replies"
              description="Someone replies to your comment"
              emailEnabled={preferences.email.replies}
              inAppEnabled={preferences.inApp.replies}
              settingKey="replies"
            />
          </SettingsRowGroup>
        </SettingsCardContent>
      </SettingsCard>

      {/* Activity Notifications */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Trophy}
          title="Activity Notifications"
          description="Get notified about your productivity milestones"
        />
        <SettingsCardContent>
          <SettingsRowGroup>
            <NotificationToggle
              label="Achievements"
              description="You unlock a new achievement"
              emailEnabled={preferences.email.achievements}
              inAppEnabled={preferences.inApp.achievements}
              settingKey="achievements"
            />
            <NotificationToggle
              label="Streak Reminders"
              description="Daily reminder to maintain your streak"
              emailEnabled={preferences.email.streaks}
              inAppEnabled={preferences.inApp.streaks}
              settingKey="streaks"
            />
          </SettingsRowGroup>
        </SettingsCardContent>
      </SettingsCard>

      {/* Group Notifications */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Users}
          title="Group & Challenge Notifications"
          description="Get notified about group activities and challenges"
        />
        <SettingsCardContent>
          <SettingsRowGroup>
            <NotificationToggle
              label="Group Posts"
              description="New posts in your groups"
              emailEnabled={preferences.email.groupPosts}
              inAppEnabled={preferences.inApp.groupPosts}
              settingKey="groupPosts"
            />
            <NotificationToggle
              label="Challenges"
              description="Challenge invitations and updates"
              emailEnabled={preferences.email.challenges}
              inAppEnabled={preferences.inApp.challenges}
              settingKey="challenges"
            />
          </SettingsRowGroup>
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
            'Save Preferences'
          )}
        </Button>
      </div>
    </SettingsSection>
  );
};

export default NotificationSettings;

