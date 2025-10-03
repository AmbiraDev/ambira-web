'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Users, 
  Trophy, 
  Target,
  ChevronDown
} from 'lucide-react';

export type GroupTab = 'posts' | 'members' | 'challenges' | 'leaderboard';

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
    description: 'Group discussions and updates'
  },
  members: {
    label: 'Members',
    icon: Users,
    description: 'Group members and their activity'
  },
  challenges: {
    label: 'Challenges',
    icon: Target,
    description: 'Group challenges and competitions'
  },
  leaderboard: {
    label: 'Leaderboard',
    icon: Trophy,
    description: 'Member rankings and achievements'
  }
};

export default function GroupTabs({ 
  activeTab, 
  onTabChange, 
  groupId, 
  memberCount,
  isAdmin = false 
}: GroupTabsProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = Object.entries(tabConfig) as [GroupTab, typeof tabConfig[GroupTab]][];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Tabs */}
        <div className="hidden sm:flex">
          <nav className="flex space-x-8" aria-label="Group tabs">
            {tabs.map(([tabKey, config]) => {
              const Icon = config.icon;
              const isActive = activeTab === tabKey;
              
              return (
                <button
                  key={tabKey}
                  onClick={() => onTabChange(tabKey)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
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

        {/* Mobile Menu */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-between w-full py-4 px-1 text-left font-medium text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-2">
              {React.createElement(tabConfig[activeTab].icon, { className: "w-4 h-4" })}
              {tabConfig[activeTab].label}
              {activeTab === 'members' && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {memberCount}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMobileMenuOpen && (
            <div className="pb-4 space-y-1">
              {tabs.map(([tabKey, config]) => {
                const Icon = config.icon;
                const isActive = activeTab === tabKey;
                
                return (
                  <button
                    key={tabKey}
                    onClick={() => {
                      onTabChange(tabKey);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      flex items-center gap-2 w-full py-2 px-3 text-left text-sm rounded-md transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                    {tabKey === 'members' && (
                      <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {memberCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
