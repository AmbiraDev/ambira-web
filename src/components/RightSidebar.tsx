'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseUserApi, firebaseApi } from '@/lib/firebaseApi';
import { Users } from 'lucide-react';

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  location?: string;
  followersCount: number;
}

interface SuggestedGroup {
  id: string;
  name: string;
  memberCount: number;
  description: string;
}

function RightSidebar() {
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadSuggestedContent();
    }
  }, [user]);

  const loadSuggestedContent = async () => {
    try {
      setIsLoading(true);

      if (!user) return;

      // Load suggested users (top 3)
      try {
        // Use the getSuggestedUsers API which filters by profileVisibility
        const suggestions = await firebaseUserApi.getSuggestedUsers(3);
        setSuggestedUsers(suggestions);
      } catch (error) {
        console.error('Failed to load suggested users:', error);
      }

      // Load suggested groups (top 3)
      try {
        const groups = await firebaseApi.group.searchGroups({}, 10);
        setSuggestedGroups(groups.slice(0, 3));
      } catch (error) {
        console.error('Failed to load suggested groups:', error);
      }
    } catch (error) {
      console.error('Failed to load suggested content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    if (!user) return;

    const isFollowing = followingUsers.has(userId);

    // Optimistic update
    setFollowingUsers(prev => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });

    try {
      if (isFollowing) {
        await firebaseApi.user.unfollowUser(userId);
      } else {
        await firebaseApi.user.followUser(userId);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      // Revert on error
      setFollowingUsers(prev => {
        const next = new Set(prev);
        if (isFollowing) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    }
  };

  return (
    <aside className="hidden xl:block w-[320px] flex-shrink-0" aria-label="Suggestions and groups sidebar">
      <div className="space-y-4 h-full overflow-y-auto scrollbar-hide pb-6">

        {/* Suggested Friends - Redesigned */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Suggested for you</h3>
              <Link href="/search?type=people" className="text-xs text-[#007AFF] hover:text-[#0056D6] font-semibold">
                See all
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No suggestions available</p>
            </div>
          ) : (
            <div className="py-2">
              {suggestedUsers.map((suggestedUser, index) => (
                <div
                  key={suggestedUser.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${suggestedUser.username}`}>
                      <div className="w-12 h-12 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white">
                        <span className="text-white font-semibold text-sm">
                          {suggestedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${suggestedUser.username}`} className="font-semibold text-sm text-gray-900 hover:text-[#007AFF] truncate block mb-0.5">
                        {suggestedUser.name}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">
                        @{suggestedUser.username}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleFollowToggle(suggestedUser.id);
                      }}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-h-[36px] min-w-[80px] ${
                        followingUsers.has(suggestedUser.id)
                          ? 'border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 bg-white'
                          : 'bg-[#007AFF] hover:bg-[#0051D5] text-white'
                      }`}
                      aria-label={followingUsers.has(suggestedUser.id) ? `Unfollow ${suggestedUser.name}` : `Follow ${suggestedUser.name}`}
                      aria-pressed={followingUsers.has(suggestedUser.id)}
                    >
                      {followingUsers.has(suggestedUser.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clubs - Redesigned */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Groups to join</h3>
              <Link href="/groups" className="text-xs text-[#007AFF] hover:text-[#0056D6] font-semibold">
                See all
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedGroups.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No groups available</p>
            </div>
          ) : (
            <div className="py-2">
              {suggestedGroups.map(group => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate group-hover:text-[#007AFF] transition-colors">
                      {group.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            <Link href="/about" className="hover:underline">About</Link>
            <span>·</span>
            <Link href="/help" className="hover:underline">Help</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
          <p className="text-xs text-gray-400 mt-2">© 2025 Ambira</p>
        </div>

      </div>
    </aside>
  );
}

export default RightSidebar;
