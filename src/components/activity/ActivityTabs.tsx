'use client';

import React from 'react';

type ActivityTab = 'sessions' | 'analytics';

interface ActivityTabsProps {
  activeTab: ActivityTab;
  setActiveTab: (tab: ActivityTab) => void;
}

export function ActivityTabs({ activeTab, setActiveTab }: ActivityTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-8" aria-label="Activity tabs">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Sessions
        </button>
      </nav>
    </div>
  );
}
