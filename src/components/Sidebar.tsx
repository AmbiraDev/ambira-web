'use client'

import React from 'react'

interface SidebarProps {
  type: 'left' | 'right'
  children: React.ReactNode
  className?: string
}

function Sidebar({ type, children, className = '' }: SidebarProps) {
  return (
    <aside className={`hidden lg:block ${type === 'left' ? 'lg:w-80' : 'lg:w-72'} ${className}`}>
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">{children}</div>
    </aside>
  )
}

// Left sidebar content component - Duolingo Style (Light Mode)
export function LeftSidebar() {
  return (
    <Sidebar type="left">
      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6 relative overflow-hidden">
        {/* Duolingo glow effect */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#58CC02] opacity-5 rounded-full blur-3xl pointer-events-none" />

        <h3 className="text-lg font-extrabold text-[#3C3C3C] mb-4 relative z-10">Your Stats</h3>

        {/* Week Stats */}
        <div className="mb-6 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#777777] font-semibold">This Week</span>
            <span className="text-sm font-bold text-[#3C3C3C]">12h 30m</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#777777] font-semibold">Tasks Completed</span>
            <span className="text-sm font-bold text-[#3C3C3C]">24</span>
          </div>
        </div>

        {/* Streak */}
        <div className="mb-6 relative z-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9600] to-[#FF7700] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-base font-bold text-[#3C3C3C]">7 Day Streak</span>
          </div>
          <p className="text-xs text-[#777777] font-semibold">Keep it up! You're doing great.</p>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10">
          <h4 className="text-sm font-bold text-[#3C3C3C] mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 text-sm font-semibold text-[#777777] hover:text-[#58CC02] hover:bg-[#F7F7F7] rounded-xl transition-all border-2 border-transparent hover:border-[#E5E5E5]">
              View Training Log
            </button>
            <button className="w-full text-left px-4 py-3 text-sm font-semibold text-[#777777] hover:text-[#58CC02] hover:bg-[#F7F7F7] rounded-xl transition-all border-2 border-transparent hover:border-[#E5E5E5]">
              Create Project
            </button>
            <button className="w-full text-left px-4 py-3 text-sm font-semibold text-[#777777] hover:text-[#58CC02] hover:bg-[#F7F7F7] rounded-xl transition-all border-2 border-transparent hover:border-[#E5E5E5]">
              Join Group
            </button>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}

// Right sidebar content component - Duolingo Style (Light Mode)
export function RightSidebar() {
  return (
    <Sidebar type="right">
      <div className="space-y-6">
        {/* Challenges */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD900] opacity-5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD900] to-[#FFAA00] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3C3C3C]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-[#3C3C3C]">Challenges</h3>
          </div>
          <p className="text-sm text-[#777777] mb-4 relative z-10 font-semibold">
            Join challenges to stay motivated and compete with others.
          </p>
          <button className="text-sm text-[#1CB0F6] hover:text-[#0088CC] transition-colors font-bold relative z-10">
            View All Challenges →
          </button>
        </div>

        {/* Groups */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#CE82FF] opacity-5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CE82FF] to-[#A855F7] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-[#3C3C3C]">Groups</h3>
          </div>
          <p className="text-sm text-[#777777] mb-4 relative z-10 font-semibold">
            Connect with like-minded people and join productivity groups.
          </p>
          <button className="text-sm text-[#1CB0F6] hover:text-[#0088CC] transition-colors font-bold relative z-10">
            View All Groups →
          </button>
        </div>

        {/* Suggested Friends */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#58CC02] opacity-5 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-base font-extrabold text-[#3C3C3C] mb-4 relative z-10">
            Suggested Friends
          </h3>
          <div className="space-y-3 relative z-10">
            {/* Mock suggested friends */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center space-x-3 p-2 hover:bg-[#F7F7F7] rounded-xl transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#58CC02] to-[#45A000] p-0.5 flex-shrink-0">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-[#3C3C3C]">F{i}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#3C3C3C] truncate">Friend {i}</p>
                  <p className="text-xs text-[#777777] truncate font-semibold">
                    Fan favorite on Focumo
                  </p>
                </div>
                <button className="px-4 py-2 text-sm bg-[#58CC02] text-white rounded-xl hover:brightness-105 transition-all font-bold border-2 border-b-4 border-[#45A000] active:border-b-2 active:translate-y-[2px] flex-shrink-0">
                  Follow
                </button>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-[#1CB0F6] hover:text-[#0088CC] transition-colors font-bold relative z-10">
            Find and Invite Your Friends →
          </button>
        </div>
      </div>
    </Sidebar>
  )
}

export default Sidebar
