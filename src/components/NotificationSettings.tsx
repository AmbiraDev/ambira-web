'use client';

import React, { useState, useEffect } from 'react';
import { NotificationPreferences } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, BellRing } from 'lucide-react';

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
      console.log('Saving notification preferences:', preferences);
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
    <div className="flex items-start justify-between py-3 border-b border-gray-200 last:border-0">
      <div className="flex-1 pr-4">
        <Label className="text-sm font-medium text-gray-900">{label}</Label>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
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
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BellRing className="w-6 h-6" />
            Notification Preferences
          </h2>
          <p className="text-gray-600 mt-1">
            Choose how you want to be notified about activity
          </p>
        </div>
        {isModal && onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {/* Social Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Social Notifications</CardTitle>
          <CardDescription>
            Get notified when people interact with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
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
          </div>
        </CardContent>
      </Card>

      {/* Activity Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Notifications</CardTitle>
          <CardDescription>
            Get notified about your productivity milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
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
          </div>
        </CardContent>
      </Card>

      {/* Group Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Group & Challenge Notifications</CardTitle>
          <CardDescription>
            Get notified about group activities and challenges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
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
          </div>
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
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;

