'use client';

import React from 'react';

interface SidebarProps {
  type: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

function Sidebar({ type, children, className = '' }: SidebarProps) {
  return (
    <aside className={`hidden lg:block ${type === 'left' ? 'lg:w-80' : 'lg:w-72'} ${className}`}>
      <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
        {children}
      </div>
    </aside>
  );
}

// Left sidebar content component
export function LeftSidebar() {
  return (
    <Sidebar type="left">
      <div className="bg-card-background rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Stats</h3>
        
        {/* Week Stats */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">This Week</span>
            <span className="text-sm font-medium text-foreground">12h 30m</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tasks Completed</span>
            <span className="text-sm font-medium text-foreground">24</span>
          </div>
        </div>

        {/* Streak */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-electric-blue rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-foreground">7 Day Streak</span>
          </div>
          <p className="text-xs text-muted-foreground">Keep it up! You're doing great.</p>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-electric-blue transition-colors">
              View Training Log
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-electric-blue transition-colors">
              Create Project
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-electric-blue transition-colors">
              Join Group
            </button>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

// Right sidebar content component
export function RightSidebar() {
  return (
    <Sidebar type="right">
      <div className="space-y-8">
        {/* Challenges */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-3 px-1">Challenges</h3>
          <p className="text-sm text-gray-600 mb-3 px-1">
            Join challenges to stay motivated and compete with others.
          </p>
          <button className="text-sm text-[#007AFF] hover:underline transition-colors px-1 font-medium">
            View All Challenges →
          </button>
        </div>

        {/* Groups */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-3 px-1">Groups</h3>
          <p className="text-sm text-gray-600 mb-3 px-1">
            Connect with like-minded people and join productivity groups.
          </p>
          <button className="text-sm text-[#007AFF] hover:underline transition-colors px-1 font-medium">
            View All Groups →
          </button>
        </div>

        {/* Suggested Friends */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-4 px-1">Suggested Friends</h3>
          <div className="space-y-3">
            {/* Mock suggested friends */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 px-1 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-white">F{i}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">Friend {i}</p>
                  <p className="text-xs text-gray-600 truncate">Fan favorite on Ambira</p>
                </div>
                <button className="px-3 py-1.5 text-xs bg-[#007AFF] text-white rounded hover:bg-[#0066DD] transition-colors font-medium flex-shrink-0">
                  Follow
                </button>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-[#007AFF] hover:underline transition-colors px-1 font-medium">
            Find and Invite Your Friends →
          </button>
        </div>
      </div>
    </Sidebar>
  );
}

export default Sidebar;
