'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseChallengeApi, firebaseUserApi, firebaseApi } from '@/lib/firebaseApi';
import { Challenge, ChallengeProgress as ChallengeProgressType } from '@/types';
import { Trophy, Users, UserPlus, TrendingUp } from 'lucide-react';

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
        const { users } = await firebaseUserApi.searchUsers('', 1, 10);
        const filtered = users
          .filter(u => u.id !== user.id)
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
      <div className="sticky top-[88px] space-y-4">

        {/* Challenges */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Challenges</h3>
              </div>
              <Link href="/challenges" className="text-sm text-[#007AFF] hover:text-[#0056D6] font-semibold">
                View All
              </Link>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Join exciting challenges to stay on top of your game, earn new achievements and see how you stack up.
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
            <div className="p-4 text-center text-gray-500 text-sm">
              No active challenges yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeChallenges.map(challenge => (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm mb-1">
                    {challenge.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {challenge.participantCount || 0} participants
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Clubs/Groups */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#007AFF] flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Clubs</h3>
              </div>
              <Link href="/groups" className="text-sm text-[#007AFF] hover:text-[#0056D6] font-semibold">
                View All
              </Link>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Why do it alone? Get more out of your Ambira experience by joining or creating a Club.
            </p>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
            <div className="divide-y divide-gray-100">
              {suggestedGroups.map(group => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block p-4 hover:bg-blue-50 transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Group Avatar */}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-[#007AFF] transition-colors truncate">
                        {group.name}
                      </div>
                      {group.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">{group.memberCount || 0}</span>
                        <span>members</span>
                      </div>
                    </div>
                    
                    {/* Arrow Indicator */}
                    <div className="text-[#007AFF] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Friends */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Suggested Friends</h3>
              </div>
              <Link href="/search?type=people" className="text-sm text-[#007AFF] hover:text-[#0056D6] font-semibold">
                Find Friends
              </Link>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              We'll suggest users you may know based on your activity and interests.
            </p>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No suggestions yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suggestedUsers.map(suggestedUser => (
                <Link
                  key={suggestedUser.id}
                  href={`/profile/${suggestedUser.username}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-[#FC4C02] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {suggestedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {suggestedUser.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {suggestedUser.location || 'Local Legend'} · {suggestedUser.followersCount || 0} followers
                    </div>
                  </div>
                  <button className="px-3 py-1 text-xs font-medium text-[#007AFF] border border-[#007AFF] rounded hover:bg-[#007AFF] hover:text-white transition-colors">
                    Follow
                  </button>
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
