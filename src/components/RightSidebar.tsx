'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseChallengeApi, firebaseUserApi, firebaseApi } from '@/lib/firebaseApi';
import { Challenge } from '@/types';
import { Trophy, Users, UserPlus, ChevronRight } from 'lucide-react';

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
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSuggestedContent();
    }
  }, [user]);

  const loadSuggestedContent = async () => {
    try {
      setIsLoading(true);

      if (!user) return;

      // Load challenges (top 2)
      try {
        const challenges = await firebaseChallengeApi.getChallenges({ status: 'active' });
        setActiveChallenges(challenges.slice(0, 2));
      } catch (error) {
        console.error('Failed to load challenges:', error);
      }

      // Load suggested users (top 3)
      try {
        // Get list of users we're already following
        const followingList = await firebaseUserApi.getFollowing(user.id);
        const followingIds = new Set(followingList.map(u => u.id));
        
        // Load more users to ensure we have enough suggestions
        const { users } = await firebaseUserApi.searchUsers('', 1, 50);
        const filtered = users
          .filter(u => u.id !== user.id && !followingIds.has(u.id)) // Exclude self and already following
          .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
          .slice(0, 3);
        setSuggestedUsers(filtered);
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

  return (
    <aside className="hidden lg:block w-[300px] flex-shrink-0">
      <div className="sticky top-[88px] space-y-4 max-h-[calc(100vh-104px)] overflow-y-auto">

        {/* Suggested Friends - Redesigned */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">Connect</h3>
              </div>
              <Link href="/search?type=people" className="text-xs text-[#007AFF] hover:text-[#0056D6] font-semibold">
                See All
              </Link>
            </div>
            <p className="text-xs text-gray-600">
              Discover people on similar journeys
            </p>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <UserPlus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No suggestions yet</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {suggestedUsers.map(suggestedUser => (
                <Link
                  key={suggestedUser.id}
                  href={`/profile/${suggestedUser.username}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {suggestedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {suggestedUser.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      @{suggestedUser.username}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Clubs - Redesigned */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Clubs</h3>
              </div>
              <Link href="/groups" className="text-xs text-[#007AFF] hover:text-[#0056D6] font-semibold">
                Explore
              </Link>
            </div>
            <p className="text-xs text-gray-600">
              Join communities and grow together
            </p>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedGroups.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No clubs yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to create one!</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {suggestedGroups.map(group => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {group.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {group.memberCount || 0} members
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Challenges - Redesigned */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-gray-900">Challenges</h3>
              </div>
              <Link href="/challenges" className="text-xs text-[#007AFF] hover:text-[#0056D6] font-semibold">
                View All
              </Link>
            </div>
            <p className="text-xs text-gray-600">
              Compete and achieve your goals
            </p>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : activeChallenges.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No active challenges</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {activeChallenges.map(challenge => (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {challenge.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {challenge.participantCount || 0} participants
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}

export default RightSidebar;
