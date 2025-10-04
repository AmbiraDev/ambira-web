'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { Group, Challenge } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import { Users, Trophy, Target, Calendar, Award, Dumbbell, Book, Briefcase, Heart } from 'lucide-react';
import Link from 'next/link';

type TabType = 'active' | 'challenges';

const categoryIcons: Record<string, React.ReactNode> = {
  fitness: <Dumbbell className="w-5 h-5" />,
  study: <Book className="w-5 h-5" />,
  work: <Briefcase className="w-5 h-5" />,
  health: <Heart className="w-5 h-5" />,
  default: <Target className="w-5 h-5" />,
};

export default function GroupsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [groups, setGroups] = useState<Group[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load user's groups
      const userGroupsData = await firebaseApi.group.getUserGroups(user.id);
      setGroups(userGroupsData);

      // Load all challenges
      const allChallenges = await firebaseApi.challenge.searchChallenges({}, 50);
      setChallenges(allChallenges);

      // Get user's active challenges
      const userActiveChallenges = await firebaseApi.challenge.getUserChallenges(user.id);
      setUserChallenges(userActiveChallenges.map(c => c.id));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      await firebaseApi.challenge.joinChallenge(challengeId, user.id);
      setUserChallenges(prev => [...prev, challengeId]);
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view groups</h1>
          <p className="text-gray-600">You need to be logged in to join groups and challenges.</p>
        </div>
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => userChallenges.includes(c.id));
  const availableChallenges = challenges.filter(c => !userChallenges.includes(c.id));

  // Group challenges by category
  const challengesByCategory = availableChallenges.reduce((acc, challenge) => {
    const category = challenge.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(challenge);
    return acc;
  }, {} as Record<string, Challenge[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title="Groups" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Tabs */}
        <div className="sticky top-14 md:top-0 bg-white md:bg-gray-50 border-b border-gray-200 z-30">
          <div className="bg-gray-50 border-b md:border-b-0 border-gray-200">
            <div className="max-w-4xl mx-auto flex gap-8 px-4 md:px-6 lg:px-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 text-base font-medium transition-colors border-b-2 ${
                  activeTab === 'active'
                    ? 'text-gray-900 border-[#007AFF]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('challenges')}
                className={`py-4 px-1 text-base font-medium transition-colors border-b-2 ${
                  activeTab === 'challenges'
                    ? 'text-gray-900 border-[#007AFF]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Challenges
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto py-6">
          {activeTab === 'active' ? (
            // Active Groups Tab
            <div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
                </div>
              ) : groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.map(group => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-[#007AFF] transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#007AFF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-[#007AFF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{group.memberCount} members</span>
                            {group.privacy && <span className="capitalize">{group.privacy}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h3>
                  <p className="text-gray-600 mb-6">Join a group to start tracking with others</p>
                  <Link
                    href="/search?type=groups"
                    className="inline-flex items-center px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-lg hover:bg-[#0051D5] transition-colors"
                  >
                    Discover Groups
                  </Link>
                </div>
              )}
            </div>
          ) : (
            // Challenges Tab
            <div className="space-y-6">
              {/* Active Challenges */}
              {activeChallenges.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Your Active Challenges</h2>
                  <div className="space-y-3">
                    {activeChallenges.map(challenge => (
                      <Link
                        key={challenge.id}
                        href={`/challenges/${challenge.id}`}
                        className="block bg-white rounded-lg border border-[#007AFF] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#007AFF] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">{challenge.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{challenge.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {challenge.participantCount} participants
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Ends {new Date(challenge.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Challenges by Category */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {activeChallenges.length > 0 ? 'Discover More Challenges' : 'Available Challenges'}
                </h2>

                {Object.keys(challengesByCategory).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(challengesByCategory).map(([category, categoryChallenges]) => (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 text-[#007AFF]">
                            {categoryIcons[category.toLowerCase()] || categoryIcons.default}
                          </div>
                          <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                        </div>
                        <div className="space-y-3">
                          {categoryChallenges.map(challenge => (
                            <div
                              key={challenge.id}
                              className="bg-white rounded-lg border border-gray-200 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 mb-1">{challenge.title}</h4>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{challenge.description}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {challenge.participantCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      Ends {new Date(challenge.endDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleJoinChallenge(challenge.id)}
                                  className="px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-lg hover:bg-[#0051D5] transition-colors flex-shrink-0"
                                >
                                  Join
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Challenges Available</h3>
                    <p className="text-gray-600">Check back later for new challenges</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />

      <BottomNavigation />
    </div>
  );
}
