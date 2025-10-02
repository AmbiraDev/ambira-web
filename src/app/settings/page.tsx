'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  HelpCircle,
  ArrowRight,
  Settings as SettingsIcon
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: 'Profile',
      description: 'Manage your profile information and preferences',
      icon: User,
      href: '/profile/edit',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Privacy & Security',
      description: 'Control who can see your profile and activity',
      icon: Shield,
      href: '/settings/privacy',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Notifications',
      description: 'Customize your notification preferences',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Appearance',
      description: 'Customize the look and feel of the app',
      icon: Palette,
      href: '/settings/appearance',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Data & Storage',
      description: 'Manage your data, exports, and storage',
      icon: Database,
      href: '/settings/data',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    },
    {
      title: 'Help & Support',
      description: 'Get help, report issues, and contact support',
      icon: HelpCircle,
      href: '/settings/help',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account, preferences, and privacy settings
          </p>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.href} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <Icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {category.description}
                  </CardDescription>
                  <Button variant="ghost" asChild className="w-full justify-between p-0 h-auto">
                    <Link href={category.href}>
                      <span>Manage</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common settings and actions you might need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" asChild className="justify-start">
                <Link href="/profile/edit">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/settings/privacy">
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy Settings
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/settings/notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
