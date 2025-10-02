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
      <div className="space-y-6">
        {/* Challenges */}
        <div className="bg-card-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-success-green rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Challenges</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Join challenges to stay motivated and compete with others.
          </p>
          <button className="text-sm text-electric-blue hover:text-electric-blue-dark transition-colors">
            View All Challenges →
          </button>
        </div>

        {/* Groups */}
        <div className="bg-card-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-electric-blue rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Groups</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect with like-minded people and join productivity groups.
          </p>
          <button className="text-sm text-electric-blue hover:text-electric-blue-dark transition-colors">
            View All Groups →
          </button>
        </div>

        {/* Suggested Friends */}
        <div className="bg-card-background rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Suggested Friends</h3>
          <div className="space-y-3">
            {/* Mock suggested friends */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">F{i}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Friend {i}</p>
                  <p className="text-xs text-muted-foreground">Fan favorite on Ambira</p>
                </div>
                <button className="px-3 py-1 text-xs bg-electric-blue text-white rounded-full hover:bg-electric-blue-dark transition-colors">
                  Follow
                </button>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-electric-blue hover:text-electric-blue-dark transition-colors">
            Find and Invite Your Friends →
          </button>
        </div>
      </div>
    </Sidebar>
  );
}

export default Sidebar;
