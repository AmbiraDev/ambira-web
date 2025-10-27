'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Users,
  Trophy,
  Target,
  ChevronDown,
  BarChart3,
} from 'lucide-react';

export type GroupTab =
  | 'posts'
  | 'members'
  | 'challenges'
  | 'leaderboard'
  | 'analytics'
  | 'about';

interface GroupTabsProps {
  activeTab: GroupTab;
  onTabChange: (tab: GroupTab) => void;
  groupId: string;
  memberCount: number;
  isAdmin?: boolean;
}

const tabConfig = {
  posts: {
    label: 'Posts',
    icon: MessageSquare,
    description: 'Group discussions and updates',
  },
  members: {
    label: 'Members',
    icon: Users,
    description: 'Group members and their activity',
  },
  challenges: {
    label: 'Challenges',
    icon: Target,
    description: 'Group challenges and competitions',
  },
  leaderboard: {
    label: 'Leaderboard',
    icon: Trophy,
    description: 'Member rankings and achievements',
  },
  analytics: {
    label: 'Analytics',
    icon: BarChart3,
    description: 'Group statistics and insights',
  },
  about: {
    label: 'About',
    icon: MessageSquare,
    description: 'Group information and details',
  },
};

export default function GroupTabs({
  activeTab,
  onTabChange,
  groupId,
  memberCount,
  isAdmin = false,
}: GroupTabsProps) {
  const [_isMobileMenuOpen, _setIsMobileMenuOpen] = useState(false);

  const tabs = Object.entries(tabConfig) as [
    GroupTab,
    (typeof tabConfig)[GroupTab],
  ][];

  return (
    <div className="sticky top-12 md:top-0 bg-white border-b border-gray-200 z-30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Tabs - Responsive */}
        <div className="flex md:gap-8">
          <nav
            className="flex md:space-x-8 overflow-x-auto scrollbar-hide"
            aria-label="Group tabs"
          >
            {tabs.map(([tabKey, config]) => {
              const Icon = config.icon;
              const isActive = activeTab === tabKey;

              return (
                <button
                  key={tabKey}
                  onClick={() => onTabChange(tabKey)}
                  className={`
                    flex-1 md:flex-initial flex items-center justify-center gap-2 py-3 md:py-4 px-1 text-sm md:text-base font-medium border-b-2 transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? 'border-[#007AFF] text-[#007AFF] md:text-gray-900'
                        : 'border-transparent text-gray-500 md:text-gray-600 hover:text-gray-700 md:hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 md:inline hidden" />
                  {config.label}
                  {tabKey === 'members' && (
                    <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {memberCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
