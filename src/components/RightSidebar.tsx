'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseUserApi, firebaseApi } from '@/lib/firebaseApi';
import { cachedQuery } from '@/lib/cache';
import GroupAvatar from '@/components/GroupAvatar';
import SuggestedPeopleModal from '@/components/SuggestedPeopleModal';
import SuggestedGroupsModal from '@/components/SuggestedGroupsModal';
import { Users } from 'lucide-react';

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  location?: string;
  followersCount: number;
  profilePicture?: string;
}

interface SuggestedGroup {
  id: string;
  name: string;
  memberCount: number;
  description: string;
  imageUrl?: string;
}

function RightSidebar() {
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadSuggestedContent();
    }
  }, [user]);

  const loadSuggestedContent = async () => {
    try {
      setIsLoading(true);

      if (!user) return;

      // Load the list of users we're already following
      try {
        const following = await firebaseUserApi.getFollowing(user.id);
        const followingIds = new Set(following.map(u => u.id));
        setFollowingUsers(followingIds);
      } catch (error) {
        console.error('Failed to load following list:', error);
      }

      // Load suggested users (top 5) with 1 hour cache
      try {
        // Use the getSuggestedUsers API which filters by profileVisibility and already-followed users
        const suggestions = await cachedQuery(
          `suggested_users_${user.id}`,
          () => firebaseUserApi.getSuggestedUsers(5),
          {
            memoryTtl: 60 * 60 * 1000, // 1 hour in memory
            localTtl: 60 * 60 * 1000,  // 1 hour in localStorage
            sessionCache: true,
            dedupe: true,
          }
        );
        setSuggestedUsers(suggestions);
      } catch (error) {
        console.error('Failed to load suggested users:', error);
      }

      // Load suggested groups (top 5) with 1 hour cache
      try {
        // Get user's current groups to exclude them from suggestions
        const userGroups = await firebaseApi.group.getUserGroups(user.id);
        const userGroupIds = new Set(userGroups.map(g => g.id));

        // Get all groups with caching
        const allGroups = await cachedQuery(
          `suggested_groups_all`,
          () => firebaseApi.group.searchGroups({}, 15),
          {
            memoryTtl: 60 * 60 * 1000, // 1 hour in memory
            localTtl: 60 * 60 * 1000,  // 1 hour in localStorage
            sessionCache: true,
            dedupe: true,
          }
        );
        const filteredGroups = allGroups.filter(group => !userGroupIds.has(group.id));
        setSuggestedGroups(filteredGroups.slice(0, 5));
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
        // Remove from suggestions after following
        setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
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
      <div className="space-y-4 h-full overflow-y-auto scrollbar-hide pt-20 pb-6">

        {/* Suggested Friends - Redesigned */}
        <div className="px-2">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-lg font-semibold text-gray-900">Suggested for you</h3>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-3 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg">
              <p className="text-sm text-gray-500">No suggestions available</p>
            </div>
          ) : (
            <div className="space-y-1">
              {suggestedUsers.map((suggestedUser, index) => (
                <Link
                  key={suggestedUser.id}
                  href={`/profile/${suggestedUser.username}`}
                  className="block px-3 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {suggestedUser.profilePicture ? (
                      <Image
                        src={suggestedUser.profilePicture}
                        alt={`${suggestedUser.name}'s profile picture`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-semibold text-sm">
                          {suggestedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 hover:text-[#007AFF] truncate mb-0.5">
                        {suggestedUser.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{suggestedUser.username}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFollowToggle(suggestedUser.id);
                      }}
                      className={`text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
                        followingUsers.has(suggestedUser.id)
                          ? 'text-gray-600 hover:text-gray-900'
                          : 'text-[#007AFF] hover:text-[#0051D5]'
                      }`}
                      aria-label={followingUsers.has(suggestedUser.id) ? `Unfollow ${suggestedUser.name}` : `Follow ${suggestedUser.name}`}
                      aria-pressed={followingUsers.has(suggestedUser.id)}
                    >
                      {followingUsers.has(suggestedUser.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Clubs - Redesigned */}
        <div className="px-2">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-lg font-semibold text-gray-900">Suggested Groups</h3>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-3 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedGroups.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg">
              <p className="text-sm text-gray-500">No groups available</p>
            </div>
          ) : (
            <div className="space-y-1">
              {suggestedGroups.map(group => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block px-3 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GroupAvatar
                      imageUrl={group.imageUrl}
                      name={group.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 hover:text-[#007AFF] truncate mb-0.5">
                        {group.name}
                      </p>
                      <div className="text-xs text-gray-500">
                        {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                      </div>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!user || joiningGroups.has(group.id)) return;

                        setJoiningGroups(prev => new Set(prev).add(group.id));
                        try {
                          await firebaseApi.group.joinGroup(group.id, user.id);
                          // Remove from suggestions after joining
                          setSuggestedGroups(prev => prev.filter(g => g.id !== group.id));
                        } catch (error) {
                          // Log error message only to avoid console object logging
                          if (error instanceof Error) {
                            console.warn('Failed to join group:', error.message);
                          } else {
                            console.warn('Failed to join group: Unknown error');
                          }
                        } finally {
                          setJoiningGroups(prev => {
                            const next = new Set(prev);
                            next.delete(group.id);
                            return next;
                          });
                        }
                      }}
                      className="text-sm font-semibold text-[#007AFF] hover:text-[#0051D5] transition-colors whitespace-nowrap flex-shrink-0"
                      disabled={joiningGroups.has(group.id)}
                    >
                      {joiningGroups.has(group.id) ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      <SuggestedPeopleModal
        isOpen={showPeopleModal}
        onClose={() => setShowPeopleModal(false)}
      />
      <SuggestedGroupsModal
        isOpen={showGroupsModal}
        onClose={() => setShowGroupsModal(false)}
      />
    </aside>
  );
}

export default RightSidebar;
